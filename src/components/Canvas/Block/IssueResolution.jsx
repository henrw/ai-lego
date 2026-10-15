import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import useMyStore from '../../../contexts/projectContext';
import useDraft from '../../../utils/useDraft';
import { captureIssueChanges, completedReviews, issueStatus, resolutionIsCurrent } from '../../../utils/issueResolution';
import AccountIdentity from '../../AccountIdentity';
import StageNote from '../Workbench/StageNote';
import RunDetails from '../Workbench/RunDetails';

const labels = { open: 'Open', pending: 'Awaiting approval', resolved: 'Resolved' };
function Changes({ changes }) {
  return <div className="resolution-changes">{changes.map(change => <div key={change.cardId} className="resolution-change">
    <strong>{change.stage}{change.blockNumber > 0 ? ` #${change.blockNumber}` : ''} · {!change.beforeKnown ? 'Specification' : change.kind === 'added' ? 'New block' : 'Updated'}</strong>
    <div className="resolution-comparison">
      <div><span>Before</span><p>{!change.beforeKnown ? 'Not recorded for this older issue.' : change.kind === 'added' ? 'New block' : change.before || '(Empty)'}</p></div>
      <div><span>Now</span><p>{change.after || '(Empty)'}</p></div>
    </div>
  </div>)}</div>;
}
function OriginalComment({ comment }) {
  const persona = comment.stageTrace?.personaSnapshot || comment.workbench?.personaSnapshot;
  return <div className="resolution-history-comment">{persona && <div className="flex items-center gap-2"><img src={persona.imgUrl || 'https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%205.png?alt=media'} width={28} height={32} style={{ objectFit: 'contain' }} alt="Simulated stakeholder"/><span>{persona.description}</span></div>}<p>{comment.type === 'persona' ? `“${(comment.problem || comment.text || '').trim().replace(/^[“"]|[”"]$/g, '')}”` : comment.problem || comment.text}</p>{['stakeholder', 'impact', 'open'].map(key => comment[key] ? <p key={key}>{key === 'stakeholder' ? 'Stakeholders' : key === 'impact' ? 'Impact' : 'Additional comment'}: {comment[key]}</p> : null)}</div>;
}
function ReviewParticipants({ entry, comment }) {
  const people = new Map();
  const add = (author, fallbackName, action) => {
    if (!author && !fallbackName) return;
    const key = author?.uid || author?.name || fallbackName;
    const person = people.get(key) || { author, fallbackName, actions: [] };
    person.actions.push(action); people.set(key, person);
  };
  add(comment.author, comment.by, 'Comment');
  add(entry.submittedBy, null, 'Updated');
  add(entry.reviewedBy, null, 'Reviewer');
  return <div className="resolution-participants">{[...people.entries()].map(([key, person]) => <div key={key}><AccountIdentity author={person.author} fallbackName={person.fallbackName}/><span className="resolution-person-actions">{person.actions.join(' · ')}</span></div>)}</div>;
}
export function ReviewHistory({ issue, embedded = false }) {
  const completed = completedReviews(issue);
  const entries = completed.length ? completed : issue.resolutionStatus === 'resolved' ? [{ action: 'approved', comment: issue, reviewedBy: issue.resolutionReview?.reviewedBy, note: issue.resolutionReview?.note }] : [];
  if (!entries.length) return null;
  const content = <>{entries.map((entry, index) => <div key={index}>
    <span className={`issue-status issue-status-${entry.action === 'approved' ? 'resolved' : 'pending'}`}>{entry.action === 'approved' ? 'Approved' : 'Changes requested'}</span>
    <OriginalComment comment={{ ...issue, ...entry.comment }}/>
    {issue.stageTrace && <StageNote trace={issue.stageTrace} hideStakeholder/>}
    {issue.workbench && <details className="scenario-workbench"><summary>Scenario and evidence</summary><RunDetails run={issue.workbench}/></details>}
    <ReviewParticipants entry={entry} comment={entry.comment || issue}/>
    {entry.note && <p className="resolution-history-note">Review: {entry.note}</p>}
    {entry.changes && <Changes changes={entry.changes}/>}
  </div>)}</>;
  return embedded ? <div className="resolution-history-entry">{content}</div> : <details className="resolution-history"><summary>Review history ({entries.length})</summary>{content}</details>;
}
export default function IssueResolution({ issue, kind = 'evaluations', role = 'admin', showHistory = true }) {
  const cards = useMyStore(state => state.cards);
  const projectId = useMyStore(state => state.projectId);
  const reviewIssue = useMyStore(state => state.reviewIssue);
  const status = issueStatus(issue);
  const [expanded, setExpanded] = useState(true);
  const [note, setNote, clearNote] = useDraft(`resolution-review-${projectId}-${kind}-${issue.uid}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canAddress = ['ai', 'admin'].includes(role) && status === 'open';
  const canReview = ['reviewer', 'admin'].includes(role) && status === 'pending';
  const current = resolutionIsCurrent(issue.resolution, cards);
  const submit = async action => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const input = action === 'submit' ? { ...captureIssueChanges(issue, useMyStore.getState().cards), uid: uuid() } : { note, resolutionId: issue.resolution?.uid };
      const result = await reviewIssue(kind, issue.uid, action, input);
      if (!result.ok) setError(result.error);
      else { clearNote(); setExpanded(true); }
    } catch (error) { setError(error.message || 'Could not save this review. Please retry.'); }
    finally { setBusy(false); }
  };
  if (status === 'resolved') return <div className="resolution-inline no-drag" onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>{showHistory && <ReviewHistory issue={issue}/>}</div>;
  return <div className="issue-resolution no-drag" onClick={event => event.stopPropagation()} onMouseDown={event => event.stopPropagation()}>
    <div className="issue-resolution-footer">
      <span className={`issue-status issue-status-${status}`}>{labels[status]}</span>
      {canAddress && <button type="button" disabled={busy} onClick={() => submit('submit')}>{busy ? 'Saving…' : 'Address issue'}</button>}
      {issue.resolution && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Hide changes' : 'Show changes'}</button>}
    </div>
    {status === 'open' && issue.resolutionReview?.action === 'changes_requested' && <p className="issue-review-note">Changes requested: {issue.resolutionReview.note}</p>}
    {issue.resolution && expanded && <div className="resolution-inline">
      <AccountIdentity author={issue.resolution.submittedBy}/>
      <Changes changes={issue.resolution.changes}/>
      {!current && status === 'pending' && <p className="resolution-warning">The linked specifications have changed or been removed since this proposal. Request an updated resolution before approving.</p>}
      {canReview && <>
        <label className="resolution-field">Review comment<textarea value={note} onChange={event => setNote(event.target.value)} rows={2} placeholder="Explain any further changes needed…"/></label>
        <div className="resolution-actions"><button className="resolution-primary" type="button" disabled={busy || !current} onClick={() => submit('approve')}>Approve resolution</button><button type="button" disabled={busy || !note.trim()} onClick={() => submit('request_changes')}>Request changes</button></div>
      </>}
      {status === 'resolved' && issue.resolutionReview && <div className="resolution-review-feedback"><strong>Approved by</strong><AccountIdentity author={issue.resolutionReview.reviewedBy}/>{issue.resolutionReview.note && <p>{issue.resolutionReview.note}</p>}</div>}
      {showHistory && !!issue.resolutionHistory?.length && <ReviewHistory issue={issue}/>}
    </div>}
    {error && <p role="alert" className="issue-review-note text-red-700">{error}</p>}
  </div>;
}
