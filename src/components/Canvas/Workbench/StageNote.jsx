import React from 'react';

export default function StageNote({ trace, showExperience = false, hideStakeholder = false }) {
  const { entry, personaSnapshot, scenario } = trace;
  return <section className="scenario-workbench stage-note" aria-label="Stage finding evidence">
    {!hideStakeholder && <p><b>Stakeholder:</b> {personaSnapshot.description}{scenario.stageScope !== 'all' && <> · {scenario.title}</>}</p>}
    {trace.branchSnapshot && <p><b>Path:</b> {trace.branchSnapshot.title} · {trace.branchSnapshot.choice}</p>}
    {showExperience && <p>{entry.stakeholderExperience}</p>}
    {entry.assumptions.length > 0 && <p><b>Assumptions:</b> {entry.assumptions.join('; ')}</p>}
    {entry.unknowns.length > 0 && <p><b>Unknowns:</b> {entry.unknowns.join('; ')}</p>}
    {entry.validation && <p><b>Validation:</b> {entry.validation}</p>}
  </section>;
}
