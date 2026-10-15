import React from 'react';

function Encounter({ step, number }) {
  return <div className="branch-encounter"><strong>Encounter {number}</strong>
    <p>{step.observation} {step.action} {step.response}</p>
    {step.assumption && <p className="workbench-hint">Assumption: {step.assumption}</p>}
  </div>;
}

export default function ScenarioBranches({ run, selected, onSelect, disabled }) {
  const branches = run.result.branches;
  if (!branches?.length) return null;
  const selectedBranch = branches.find(b => b.id === selected);
  return <section className="scenario-branches" aria-label="Branching stakeholder experiences">
    <h3>Possible paths</h3>
    <p className="workbench-hint">Both paths share the experience through Encounter {branches[0].afterStep}, then diverge. Compare the possibilities below; choose a path for playback.</p>
    <div className="branch-grid" role="group" aria-label="Choose a continuation">
      <article className={`branch-grid-shared branch-path-card ${!selectedBranch ? 'branch-path-selected' : ''}`}>
        <button disabled={disabled} aria-pressed={!selectedBranch} onClick={() => onSelect(null)}>Shared encounter</button>
        {run.result.steps.slice(0, branches[0].afterStep).map((step,i) => <Encounter key={i} step={step} number={i + 1}/>)}
      </article>
      {branches.map(branch => <article key={branch.id} className={`branch-path-card ${selected === branch.id ? 'branch-path-selected' : ''}`} aria-label={branch.title}>
        <button disabled={disabled} aria-pressed={selected === branch.id} onClick={() => onSelect(branch.id)}>{branch.title}</button>
        <p className="branch-choice">{branch.choice}</p>
        {branch.steps.map((step,i) => <Encounter key={i} step={step} number={branch.afterStep + i + 1}/>)}
        <p>{branch.outcome}</p>
        {branch.assumptions.length > 0 && <p><b>Assumptions:</b> {branch.assumptions.join('; ')}</p>}
        {branch.unknowns.length > 0 && <p><b>Unknowns:</b> {branch.unknowns.join('; ')}</p>}
      </article>)}
    </div>
    <p className="workbench-hint">Possibilities, not predictions.{run.result.stageTrace && ' Play trace to follow the selected path. Saving retains both paths and your selection.'}</p>
  </section>;
}
