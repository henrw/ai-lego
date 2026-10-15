import { openAIKeyHeaders } from '../../../utils/openAIKey';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import useMyStore from '../../../contexts/projectContext';
import { useUserAuth } from '../../../authentication/UserAuthContext';
import useSessionState from '../../../utils/useSessionState';
import { normalizeProfile, scenarios, planSnapshot, samePlan, branchPlaybackRun, tracePlanOrder } from '../../../utils/workbench';
import { readWorkbenchStream } from '../../../utils/workbenchStream';
import ProfileFields from './ProfileFields';
import RunDetails from './RunDetails';
import StageTrace from './StageTrace';
import ScenarioBranches from './ScenarioBranches';
import ScenarioReview from './ScenarioReview';

export default function ScenarioWorkbench({ persona, cardsData, renderHeader, model = 'gpt-6.1-sol', role = 'admin' }) {
  const projectId = useMyStore(s => s.projectId);
  const links = useMyStore(s => s.links) || [];
  const evaluations = useMyStore(s => s.evaluations) || [];
  const { user } = useUserAuth();
  const [draft, setDraft] = useSessionState(`workbench-${projectId}-${persona?.uid || 'none'}`, {
    profile: normalizeProfile(persona?.profile), scenario: { ...scenarios[0], mode: 'walkthrough', assumption: '', specificSituation: '', stageScope: 'relevant' }, run: null, concernText: '', cardIds: [], notes: '', savedId: null,
  });
  const analysisMode = draft.analysisMode || (draft.run?.scenario.stageScope === 'all' ? 'lifecycle' : 'journey');
  const [showSettings, setShowSettings] = useState(!draft.run);
  const [generating, setBusy] = useState(false);
  const [journeyBusy, setJourneyBusy] = useState(false);
  const busy = generating || journeyBusy;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requestRef = useRef(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; requestRef.current?.abort(); useMyStore.setState({ scenarioPlayback: null }); }; }, []);
  const update = patch => setDraft({ ...draft, ...patch });
  const history = evaluations.filter(e => e.personaId === persona?.uid && e.workbench && (analysisMode === 'lifecycle' ? e.workbench.scenario.stageScope === 'all' : e.workbench.scenario.stageScope !== 'all'));
  const moment = scenarios.find(s => s.id === draft.scenario.id) || scenarios[0];
  const specificSituation = draft.scenario.specificSituation ?? (scenarios.some(s => s.id === draft.scenario.id) ? '' : draft.scenario.situation || '');
  const currentPlan = planSnapshot(cardsData);
  const currentLinks = links.filter(l => currentPlan.some(c => c.uid === l.start) && currentPlan.some(c => c.uid === l.end));
  const stale = draft.run && (!samePlan(draft.run.planSnapshot, currentPlan) || (draft.run.linksSnapshot && JSON.stringify(draft.run.linksSnapshot) !== JSON.stringify(currentLinks)));
  const selectedBranch = draft.selectedBranchId || draft.run?.selectedBranchId || null;
  const playbackRun = useMemo(() => draft.run && (draft.run.scenario.stageScope === 'all' ? draft.run : branchPlaybackRun(draft.run, selectedBranch)), [draft.run, selectedBranch]);
  const simulate = async (previous = null, journey = null) => {
    if (generating || saving || !persona || (journeyBusy && !journey)) return;
    const controller = new AbortController(); requestRef.current = controller;
    const fullTrace = previous ? previous.scenario.stageScope === 'all' : journey?.trace === true;
    const timer = setTimeout(() => controller.abort('timeout'), 175000);
    setShowSettings(false); setBusy(true); setError(''); setNotice('');
    // Replays use the frozen inputs, even if the profile form has since changed.
    const personaSnapshot = previous ? previous.personaSnapshot : { uid: persona.uid, description: persona.description, imgUrl: persona.imgUrl || null, profile: draft.profile };
    const { visibleContext: legacyVisibleContext, ...currentScenario } = draft.scenario;
    const scenario = fullTrace ? { id: 'lifecycle-impacts', title: 'Lifecycle impacts', mode: 'walkthrough', stageScope: 'all', assumption: (previous?.scenario || draft.scenario).assumption || '', specificSituation: previous ? previous.scenario.specificSituation || '' : specificSituation, situation: (previous ? previous.scenario.specificSituation : specificSituation)?.trim() || 'Examine how decisions across the lifecycle could affect this stakeholder, without a prescribed temporal moment.' } : previous ? previous.scenario : { ...currentScenario, ...(journey?.moment || moment), mode: 'walkthrough', stageScope: fullTrace ? 'all' : 'relevant', specificSituation, situation: specificSituation.trim() || (journey?.moment || moment).situation };
    const capturedPlan = currentPlan;
    let showCanvas = fullTrace;
    const streamCards = tracePlanOrder(capturedPlan, currentLinks);
    const streamEntries = streamCards.map(c => ({ cardId: c.uid, status: 'waiting', pending: true, comment: '' }));
    const runId = uuid();
    let latestIndex = 0, heldIndex = 0, followLive = true;
    const showProgress = entries => {
      if (!showCanvas || controller.signal.aborted || !mounted.current || requestRef.current !== controller) return;
      entries.forEach(entry => {
        const i = streamEntries.findIndex(e => e.cardId === entry.cardId);
        if (i >= 0) { streamEntries[i] = entry; latestIndex = i; }
      });
      useMyStore.setState({ scenarioPlayback: {
        runId, index: followLive ? latestIndex : heldIndex, entries: [...streamEntries], persona: { ...personaSnapshot, imgUrl: persona.imgUrl }, planSnapshot: capturedPlan,
        reducedMotion: typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        generating: true, playing: followLive,
        onPause: () => { heldIndex = latestIndex; followLive = false; showProgress([]); },
        onPlay: () => { followLive = true; showProgress([]); },
        onPrevious: () => { heldIndex = Math.max(0, (followLive ? latestIndex : heldIndex) - 1); followLive = false; showProgress([]); },
        onNext: () => { heldIndex = Math.min(latestIndex, (followLive ? latestIndex : heldIndex) + 1); followLive = false; showProgress([]); },
        lastAvailableIndex: latestIndex,
        onStop: () => controller.abort('stopped'),
        onClear: () => { showCanvas = false; useMyStore.setState({ scenarioPlayback: null }); },
      } });
    };
    if (fullTrace) showProgress([]);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || ''}/api/workbench`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...openAIKeyHeaders(user?.uid) }, signal: controller.signal, body: JSON.stringify({ action: 'scenario', model, branching: !fullTrace, links: currentLinks, stream: fullTrace, persona: personaSnapshot, scenario, cardsData: capturedPlan, previous: previous ? { planSnapshot: previous.planSnapshot, planConnections: previous.linksSnapshot || [], result: previous.result } : null }) });
      if (!response.ok) { const failure = await response.json(); throw new Error(failure.error || 'Scenario generation failed. Please retry.'); }
      const data = fullTrace && response.headers?.get('content-type')?.includes('application/x-ndjson')
        ? await readWorkbenchStream(response, showProgress) : await response.json();
      if (!data.result?.concern || !Array.isArray(data.result.steps)) throw new Error('The scenario response was incomplete. Please retry.');
      if (requestRef.current !== controller || !mounted.current || controller.signal.aborted) return;
      const run = { uid: runId, createdAt: new Date().toISOString(), model: data.model, promptVersion: data.promptVersion, personaSnapshot, scenario, planSnapshot: capturedPlan, linksSnapshot: currentLinks, result: data.result, previousRunId: previous?.uid || null, previousSnapshot: previous ? { planSnapshot: previous.planSnapshot, concern: previous.result.concern } : null };
      setDraft({ ...draft, analysisMode: fullTrace ? 'lifecycle' : 'journey', scenario, journeyRuns: journey && !journey.single ? [...journey.completed, run] : draft.journeyRuns, run, selectedBranchId: null, savedId: null, concernText: `${data.result.concern.title}\n\n${data.result.concern.mechanism}`, cardIds: data.result.concern.blockIds, notes: '' });
      return run;
    } catch (e) {
      if (mounted.current && requestRef.current === controller) setError(controller.signal.aborted ? controller.signal.reason === 'timeout' ? 'Request timed out. Your previous run is retained; retry.' : 'Generation stopped. Your previous run is retained.' : e.message);
    } finally {
      clearTimeout(timer);
      if (mounted.current && requestRef.current === controller) { useMyStore.setState({ scenarioPlayback: null }); setBusy(false); requestRef.current = null; }
    }
  };
  const exploreJourney = async () => {
    if (busy || saving || !persona) return;
    setJourneyBusy(true);
    const completed = [];
    try {
      for (const focus of scenarios) {
        if (!mounted.current) break;
        const run = await simulate(null, { moment: focus, completed });
        if (!run) break;
        completed.push(run);
      }
      if (mounted.current && completed.length === scenarios.length) setNotice('Before, Outcome, and After are ready. Select a moment to inspect or save its result.');
    } finally { if (mounted.current) setJourneyBusy(false); }
  };
  const inspectMoment = focus => {
    const journeyRuns = draft.journeyRuns?.map(run => run.uid === draft.run?.uid ? { ...draft.run, draftState: { selectedBranchId: selectedBranch, savedId: draft.savedId, concernText: draft.concernText, cardIds: draft.cardIds, notes: draft.notes } } : run);
    const run = journeyRuns?.find(r => r.scenario.id === focus.id);
    update({ journeyRuns, scenario: { ...draft.scenario, ...focus, specificSituation }, ...(run ? { run, selectedBranchId: run.selectedBranchId || null, savedId: null, concernText: `${run.result.concern.title}\n\n${run.result.concern.mechanism}`, cardIds: run.result.concern.blockIds, notes: '', ...run.draftState } : {}) });
  };
  const selectAnalysis = nextMode => {
    if (busy || saving || nextMode === analysisMode) return;
    const snapshot = { scenario: draft.scenario, run: draft.run, selectedBranchId: draft.selectedBranchId, savedId: draft.savedId, concernText: draft.concernText, cardIds: draft.cardIds, notes: draft.notes };
    const restored = draft.analysisDrafts?.[nextMode];
    setDraft({ ...draft, analysisMode: nextMode, analysisDrafts: { ...draft.analysisDrafts, [analysisMode]: snapshot }, ...(restored || { scenario: { ...draft.scenario, ...scenarios[0] }, run: null, selectedBranchId: null, savedId: null, concernText: '', cardIds: [], notes: '' }) });
    setShowSettings(!restored?.run); setError(''); setNotice('');
    useMyStore.setState({ scenarioPlayback: null });
  };
  const save = async () => {
    if (!draft.run || saving || draft.savedId) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const uid = `scenario-${draft.run.uid}`;
      const { draftState, ...savedRun } = draft.run;
      const ok = await useMyStore.getState().addEvaluation(user?.displayName || 'Anonymous', draft.cardIds, { uid, type: 'persona', personaId: persona.uid, personaDescription: draft.run.personaSnapshot.description, problem: draft.concernText.trim(), workbench: { ...savedRun, selectedBranchId: selectedBranch }, scenarioNotes: draft.notes, scenarioReview: { status: 'generated', note: '', evidence: '' } });
      if (!mounted.current) return;
      if (ok) { update({ savedId: uid }); setNotice('Scenario saved and linked to the selected blocks.'); }
      else setError('Could not save this scenario. Your draft is retained; retry saving.');
    } catch (e) { if (mounted.current) setError(e.message); }
    finally { if (mounted.current) setSaving(false); }
  };
  const saveProfile = async () => {
    setSaving(true); setError('');
    try {
      const { isSelected, ...savedPersona } = persona;
      const ok = await useMyStore.getState().addPersona({ ...savedPersona, profile: draft.profile });
      if (mounted.current) { if (ok) setNotice('Profile saved. Existing runs retain their original profile.'); else setError('Could not save profile. Your draft is retained.'); }
    } catch (e) { if (mounted.current) setError(e.message); }
    finally { if (mounted.current) setSaving(false); }
  };
  return <div className="scenario-workbench">
    {renderHeader?.(busy || saving)}
    <div className="analysis-mode-toggle" role="group" aria-label="Choose simulation view">
      <button type="button" disabled={busy || saving} aria-pressed={analysisMode === 'journey'} onClick={() => selectAnalysis('journey')}><strong>Stakeholder journey</strong><span>Before → Outcome → After, with possible choices and consequences.</span></button>
      <button type="button" disabled={busy || saving} aria-pressed={analysisMode === 'lifecycle'} onClick={() => selectAnalysis('lifecycle')}><strong>Lifecycle impacts</strong><span>Every lifecycle block, with animated stakeholder comments.</span></button>
    </div>
    {!persona ? <p>Select a persona on the canvas, or create one to explore a scenario.</p> : <>
      <h3>{persona.description}</h3>
      <details><summary>Profile, evidence and assumptions</summary><ProfileFields value={draft.profile} onChange={profile => update({ profile })} disabled={busy || saving}/><button disabled={busy || saving} onClick={saveProfile}>Save profile</button></details>
      <fieldset disabled={busy || saving}>
        {analysisMode === 'journey' && <div className="scenario-timeline" role="group" aria-label="Moment in the stakeholder experience">
          <strong>Stakeholder experience</strong>
          <div className="scenario-timeline-track">{scenarios.map((s, index) => {
            const count = history.filter(e => e.workbench.scenario.id === s.id).length;
            return <button type="button" key={s.id} className="scenario-timeline-stop" aria-pressed={moment.id === s.id} onClick={() => inspectMoment(s)}>
              <span className="scenario-timeline-dot" aria-hidden="true">{index + 1}</span>
              <strong>{s.title}</strong><span className="scenario-timeline-count">{count ? `${count} saved` : draft.journeyRuns?.some(r => r.scenario.id === s.id) ? 'Draft ready' : 'Not explored'}</span>
            </button>;
          })}</div>
          <p className="scenario-timeline-question">{moment.question}</p>
          {showSettings && <p className="workbench-hint">Journey only: Before → Outcome → After. Select a moment to inspect its result.</p>}
          {showSettings && history.some(e => !scenarios.some(s => s.id === e.workbench.scenario.id)) && <p className="workbench-hint">Earlier scenario types remain in saved history and are not counted on this timeline.</p>}
        </div>}
        {showSettings && <div className="journey-settings" aria-label="Journey settings">
        <label>Specific situation to explore (optional)<textarea rows={2} placeholder="Leave blank to explore this moment, or describe a particular event." value={specificSituation} onChange={e => update({ scenario: { ...draft.scenario, specificSituation: e.target.value } })}/></label>
        <label>Assumption to explore (optional)<textarea rows={2} placeholder="For example: the person has little time to request review." value={draft.scenario.assumption} onChange={e => update({ scenario: { ...draft.scenario, assumption: e.target.value } })}/></label>
        <button className="workbench-primary" onClick={() => analysisMode === 'journey' ? exploreJourney() : simulate(null, { single: true, trace: true })} disabled={busy || saving || !currentPlan.some(c => c.description.trim())}>{analysisMode === 'journey' ? 'Generate journey' : 'Run lifecycle trace'}</button>
        </div>}
      </fieldset>
      {!showSettings && !busy && <button onClick={() => setShowSettings(true)} aria-expanded="false">Regenerate…</button>}
      {busy && <button onClick={() => requestRef.current?.abort('stopped')}>Stop generation</button>}
      {error && <p role="alert" className="workbench-error">{error}</p>}{notice && <p role="status">{notice}</p>}
      {draft.run && <>
        <h3>{draft.run.scenario.stageScope === 'all' ? 'Lifecycle impacts' : `Scenario result · ${draft.run.scenario.title}`}</h3>
        {!draft.savedId && <p className="workbench-hint">Save this run before starting another exploration if you want to keep it in shared history.</p>}
        {stale && <p className="workbench-warning">The plan has changed since this run. Saving retains the original snapshot; replay to examine the current plan.</p>}
        {draft.run.previousSnapshot && <details open><summary>Original and current specifications</summary><div className="workbench-plan-comparison">{[...new Set([...draft.run.previousSnapshot.planSnapshot.map(c => c.uid), ...draft.run.planSnapshot.map(c => c.uid)])].map(id => {
          const before = draft.run.previousSnapshot.planSnapshot.find(c => c.uid === id); const after = draft.run.planSnapshot.find(c => c.uid === id);
          if (before?.description === after?.description && before?.stage === after?.stage) return null;
          return <section key={id}><strong>{after?.stage || before?.stage}</strong><p><b>Before:</b> {before?.description ?? 'New block'}</p><p><b>Now:</b> {after?.description ?? 'Removed block'}</p></section>;
        })}</div><p><b>Original concern:</b> {draft.run.previousSnapshot.concern.title}</p></details>}
        {draft.run.scenario.stageScope !== 'all' && <ScenarioBranches run={draft.run} selected={selectedBranch} disabled={busy || saving} onSelect={id => update({ selectedBranchId: id || '', run: { ...draft.run, selectedBranchId: id }, savedId: null })}/>}
        {draft.run.result.stageTrace && <StageTrace key={playbackRun.uid} run={playbackRun} persona={persona} author={user?.displayName || 'Anonymous'} disabled={busy || saving}/>}
        <RunDetails run={draft.run} showBranches={false}/>
        <fieldset disabled={busy || saving || !!draft.savedId}>
          <label>Issue to save (editable)<textarea rows={4} value={draft.concernText} onChange={e => update({ concernText: e.target.value })}/></label>
          <label>Team notes or proposed revision<textarea rows={2} value={draft.notes} onChange={e => update({ notes: e.target.value })}/></label>
          <div className="workbench-blocks"><b>Link concern to blocks</b>{draft.run.planSnapshot.map(c => <label key={c.uid}><input type="checkbox" checked={draft.cardIds.includes(c.uid)} onChange={e => update({ cardIds: e.target.checked ? [...draft.cardIds, c.uid] : draft.cardIds.filter(id => id !== c.uid) })}/>{c.stage}: {c.description.slice(0, 85)}</label>)}</div>
          <button className="workbench-primary" disabled={!draft.concernText.trim() || !draft.cardIds.length || !!draft.savedId || busy || saving} onClick={save}>{draft.savedId ? 'Scenario saved' : saving ? 'Saving…' : 'Save scenario and concern'}</button>
        </fieldset>
        <button disabled={busy || saving || !stale} onClick={() => simulate(draft.run)}>Replay with current plan</button>
        {!stale && <p className="workbench-hint">Revise a lifecycle block to compare the same scenario and persona.</p>}
        {draft.run.scenario.stageScope !== 'all' && !draft.run.result.branches && <details><summary>Explore another continuation</summary><p className="workbench-hint">Save this run first if you want to keep it. A continuation starts a new exploration with the displayed scenario.</p>{draft.run.result.alternatives.map((a, i) => <button key={i} disabled={busy || saving} onClick={() => { update({ scenario: { ...draft.run.scenario, assumption: a.description }, profile: draft.run.personaSnapshot.profile }); setNotice('Continuation loaded into the scenario form. Choose Generate journey to run it.'); }}>{a.title}</button>)}</details>}
      </>}
      <details open={history.length > 0}><summary>Saved scenarios ({history.length})</summary>{history.map(issue => <section className="workbench-saved" key={issue.uid}><strong>{issue.workbench.scenario.title}</strong><p>{issue.problem}</p>{issue.scenarioNotes && <p>Team notes: {issue.scenarioNotes}</p>}<p className="workbench-hint">{issue.resolutionStatus === 'resolved' ? 'Resolution approved' : 'Resolution requires human review'} · {issue.workbench.createdAt}</p><button disabled={busy || saving} onClick={() => update({ run: issue.workbench, selectedBranchId: issue.workbench.selectedBranchId || null, savedId: issue.uid, concernText: issue.problem, notes: issue.scenarioNotes || '', cardIds: issue.cardIds || [] })}>Inspect saved run</button><button disabled={busy || saving || samePlan(issue.workbench.planSnapshot, currentPlan)} onClick={() => simulate(issue.workbench)}>Replay saved scenario</button><ScenarioReview issue={issue} role={role}/></section>)}</details>
    </>}
  </div>;
}
