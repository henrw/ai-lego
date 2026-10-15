import React from 'react';
import PlanBasis from './PlanBasis';
import ScenarioBranches from './ScenarioBranches';
import { comparisonLabels } from '../../../utils/workbench';

export default function RunDetails({ run, showBranches = true }) {
  if (!run?.result) return null;
  const lifecycleTrace = run.scenario.stageScope === 'all';
  const { concern, comparison, steps, alternatives } = run.result;
  return <div className="workbench-result">
    <p className="workbench-hint">Illustrative scenario · Requires human review</p>
    {comparison && <section className="workbench-comparison"><strong>{comparisonLabels[comparison.status]}</strong><p>{comparison.explanation}</p>{comparison.changedBlocks?.map(change => <p key={change.cardId}><b>{run.planSnapshot.find(c => c.uid === change.cardId)?.stage || 'Removed block'}:</b> {change.effect}</p>)}<p><b>Remaining uncertainty:</b> {comparison.residual || 'None identified by this run.'}</p><p><b>Shifted burden:</b> {comparison.newBurden || 'None identified by this run.'}</p></section>}
    {!lifecycleTrace && !run.result.branches && <ol className="workbench-steps">{steps.map((step, i) => <li key={i}><strong>Encounter {i + 1}</strong><p><b>What I notice:</b> {step.observation}</p><p><b>What I try:</b> {step.action}</p><p><b>What happens next:</b> {step.response}</p>{step.assumption && <p className="workbench-hint">Assumption: {step.assumption}</p>}</li>)}</ol>}
    <section><strong>{concern.title}</strong><p>{concern.mechanism}</p></section>
    <section><PlanBasis evidence={concern.planEvidence} planSnapshot={run.planSnapshot}/></section>
    <section><b>Assumptions</b><ul>{concern.assumptions.map((s, i) => <li key={i}>{s}</li>)}</ul><b>Unknowns</b><ul>{concern.unknowns.map((s, i) => <li key={i}>{s}</li>)}</ul><p><b>Validation needed:</b> {concern.validation}</p><p><b>Possible mitigation:</b> {concern.mitigation}</p></section>
    {!lifecycleTrace && !run.result.branches && <details><summary>Alternative continuations ({alternatives.length})</summary><p className="workbench-hint">Possibilities to explore, not estimated frequencies.</p>{alternatives.map((a, i) => <section key={i}><strong>{a.title}</strong><p>{a.description}</p></section>)}</details>}
    {!lifecycleTrace && run.result.stageTrace && <p className="workbench-hint">Full lifecycle trace: {run.result.stageTrace.length} blocks examined. Inspect this saved run in the persona workbench to play the trace or publish stage comments.</p>}
    {!lifecycleTrace && showBranches && run.result.branches && <ScenarioBranches run={run} selected={run.selectedBranchId} disabled onSelect={() => {}}/>}
  </div>;
}
