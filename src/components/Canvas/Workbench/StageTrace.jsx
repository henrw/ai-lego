import PlanBasis from './PlanBasis';
import React, { useEffect, useState } from 'react';
import { traceExperience } from '../../../utils/workbench';
import useMyStore from '../../../contexts/projectContext';

export const traceStatus = { concern: 'Potential concern', no_additional_concern: 'No additional concern identified', insufficient_information: 'More information needed' };

export default function StageTrace({ run, persona, author, disabled = false }) {
  const entries = run.result.stageTrace;
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(() => entries.filter(e => e.status !== 'no_additional_concern').map(e => e.cardId));
  const [saving, setSaving] = useState(false);
  const [retryIds, setRetryIds] = useState([]);
  const [message, setMessage] = useState('');
  const evaluations = useMyStore(s => s.evaluations) || [];
  const saved = cardId => !retryIds.includes(cardId) && evaluations.some(e => e.uid === `trace-${run.uid}-${cardId}`);
  const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (index >= entries.length - 1) setPlaying(false);
      else setIndex(i => i + 1);
    }, 4500);
    return () => clearTimeout(timer);
  }, [playing, index, entries.length]);
  useEffect(() => {
    if (disabled) return;
    useMyStore.setState({ scenarioPlayback: index < 0 ? null : { runId: run.uid, index, entries, persona: { ...run.personaSnapshot, imgUrl: persona.imgUrl }, planSnapshot: run.planSnapshot, reducedMotion, playing, onPause: () => setPlaying(false), onPlay: () => { if (index === entries.length - 1) setIndex(0); setPlaying(true); }, onPrevious: () => { setPlaying(false); setIndex(i => Math.max(0, i - 1)); }, onNext: () => { setPlaying(false); setIndex(i => Math.min(i + 1, entries.length - 1)); }, onClear: () => { setPlaying(false); setIndex(-1); } } });
  }, [index, entries, run, persona.imgUrl, reducedMotion, playing, disabled]);
  useEffect(() => () => useMyStore.setState({ scenarioPlayback: null }), []);
  useEffect(() => { if (disabled) setPlaying(false); }, [disabled]);
  const play = () => { if (index < 0 || index === entries.length - 1) setIndex(0); setPlaying(true); };
  const publish = async () => {
    setSaving(true); setMessage('');
    let complete = 0;
    try {
      for (const entry of entries.filter(e => selected.includes(e.cardId) && !saved(e.cardId))) {
        const uid = `trace-${run.uid}-${entry.cardId}`;
        const ok = await useMyStore.getState().addEvaluation(author, [entry.cardId], {
          uid, type: 'persona', personaId: run.personaSnapshot.uid, personaDescription: run.personaSnapshot.description,
          problem: traceExperience(entry), stageTrace: { runId: run.uid, branchId: run.selectedBranchId || null, branchSnapshot: run.branchSnapshot || null, entry, planSnapshot: run.planSnapshot, personaSnapshot: run.personaSnapshot, scenario: run.scenario, model: run.model, promptVersion: run.promptVersion, createdAt: run.createdAt },
        });
        if (!ok) { setRetryIds(ids => [...new Set([...ids, entry.cardId])]); setMessage('Some comments could not be saved. Published comments are retained; retry the remaining ones.'); return; }
        setRetryIds(ids => ids.filter(id => id !== entry.cardId));
        complete++;
      }
      setMessage(`${complete} stage comments published. These findings require human review.`);
    } catch { setMessage('Could not publish all comments. Retry to save the remaining ones.'); }
    finally { setSaving(false); }
  };
  return <section className="stage-trace" aria-label="Lifecycle stage trace">
    <h3>Lifecycle trace · {entries.length} blocks examined</h3>
    <p className="workbench-hint">Playback of generated findings. The persona traces design decisions; internal stages are not experiences they necessarily know about. Canvas notes are drafts until published.</p>
    <div className="stage-trace-controls">
      <button disabled={disabled || saving || playing} onClick={play}>{index === entries.length - 1 ? 'Replay trace' : 'Play trace'}</button>
      <button disabled={!playing} onClick={() => setPlaying(false)}>Pause</button>
      <button disabled={disabled || saving || index <= 0} onClick={() => { setPlaying(false); setIndex(i => Math.max(0, i - 1)); }}>Previous stage</button>
      <button disabled={disabled || saving || index >= entries.length - 1} onClick={() => { setPlaying(false); setIndex(i => i + 1); }}>Next stage</button>
      <button disabled={index < 0} onClick={() => { setPlaying(false); setIndex(-1); }}>Clear canvas trace</button>
    </div>
    {reducedMotion && <p className="workbench-hint">Reduced motion is enabled. Stages change without movement animation.</p>}
    <ol className="stage-trace-list">{entries.map((entry, i) => {
      const card = run.planSnapshot.find(c => c.uid === entry.cardId);
      return <li key={entry.cardId} className={index === i ? 'trace-current' : ''}>
        <button className="stage-trace-jump" aria-pressed={index === i} onClick={() => { setPlaying(false); setIndex(i); }}>{i + 1}. {card?.stage || entry.cardId}</button>
        <span className={`trace-status trace-status-${entry.status}`}>{traceStatus[entry.status]}</span>
        <p className="trace-persona-experience">{traceExperience(entry)}</p>
        <PlanBasis evidence={entry.planEvidence} planSnapshot={run.planSnapshot}/>
        {entry.assumptions.length > 0 && <p><b>Assumptions:</b> {entry.assumptions.join('; ')}</p>}
        {entry.unknowns.length > 0 && <p><b>Unknowns:</b> {entry.unknowns.join('; ')}</p>}
        {entry.validation && <p><b>Validation:</b> {entry.validation}</p>}
        {entry.status !== 'no_additional_concern' && <label className="trace-publish-choice"><input type="checkbox" disabled={saved(entry.cardId) || saving} checked={saved(entry.cardId) || selected.includes(entry.cardId)} onChange={e => setSelected(current => e.target.checked ? [...current, entry.cardId] : current.filter(id => id !== entry.cardId))}/>{saved(entry.cardId) ? 'Published on canvas' : 'Publish this draft comment'}</label>}
      </li>;
    })}</ol>
    <button disabled={disabled || saving || !selected.some(id => !saved(id))} onClick={publish}>{saving ? 'Publishing…' : 'Publish selected stage comments'}</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
