import React, { useState } from 'react';
import useMyStore from '../../../contexts/projectContext';
import useSessionState from '../../../utils/useSessionState';
import AccountIdentity from '../../AccountIdentity';

export default function ScenarioReview({ issue, role = 'admin' }) {
  const projectId = useMyStore(s => s.projectId);
  const [review, setReview] = useSessionState(`scenario-review-${projectId}-${issue.uid}`, issue.scenarioReview || { status: 'generated', note: '', evidence: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canReview = ['admin', 'reviewer'].includes(role);
  const save = async () => {
    setBusy(true); setError('');
    try {
      const ok = await useMyStore.getState().reviewScenario(issue.uid, review);
      if (!ok) setError('Could not save review. Your draft is retained; retry.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <details className="workbench-review"><summary>Team assessment: {issue.scenarioReview?.status === 'dismissed' ? 'Dismissed' : issue.scenarioReview?.status === 'evidence' ? 'Evidence recorded' : issue.scenarioReview?.status === 'reviewed' ? 'Reviewed' : 'Needs review'}</summary>
    {issue.scenarioReview?.author && <AccountIdentity author={issue.scenarioReview.author}/>}
    {issue.scenarioReview?.note && <p>Saved assessment: {issue.scenarioReview.note}</p>}
    {issue.scenarioReview?.evidence && <p>Recorded evidence: {issue.scenarioReview.evidence}</p>}
    <p className="workbench-hint">Assessment does not resolve the issue. Use the resolution review to approve design changes.</p>
    {canReview && <fieldset disabled={busy}><label>Assessment<select value={review.status} onChange={e => setReview({ ...review, status: e.target.value })}><option value="generated">Needs review</option><option value="reviewed">Reviewed by team</option><option value="evidence">Checked against evidence</option><option value="dismissed">Dismissed with reason</option></select></label>
    <label>Review notes<textarea value={review.note} onChange={e => setReview({ ...review, note: e.target.value })}/></label>
    <label>Stakeholder or empirical evidence<textarea value={review.evidence} placeholder="Record the source, observation and whether it supports or contradicts the concern." onChange={e => setReview({ ...review, evidence: e.target.value })}/></label>
    <button type="button" onClick={save} disabled={(review.status === 'dismissed' && !review.note.trim()) || (review.status === 'evidence' && !review.evidence.trim())}>{busy ? 'Saving…' : 'Save assessment'}</button></fieldset>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
