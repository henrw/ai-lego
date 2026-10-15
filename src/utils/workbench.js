export const profileFields = { relationship: 'Relationship to the system', goal: 'Goal', circumstances: 'Relevant circumstances', constraints: 'Constraints', knowledge: 'What this stakeholder knows', assumptions: 'Designer assumptions', unknowns: 'Unknowns to investigate' };
export const emptyProfile = () => ({ ...Object.fromEntries(Object.keys(profileFields).map(k => [k, ''])), evidence: '', provenance: Object.fromEntries(Object.keys(profileFields).map(k => [k, 'designer'])) });
export const normalizeProfile = profile => ({ ...emptyProfile(), ...profile, provenance: { ...emptyProfile().provenance, ...profile?.provenance } });
export const scenarios = [
  { id: 'before', title: 'Before', question: 'What can this person understand, access, or influence before the system affects them?', situation: 'Before an outcome, explore the stakeholder’s understanding, access, choices, and ability to influence the process.' },
  { id: 'outcome', title: 'Outcome', question: 'What happens when this person receives or experiences the result?', situation: 'When an outcome arrives, explore how the stakeholder interprets it and experiences its consequences.' },
  { id: 'after', title: 'After', question: 'What can this person do next, and what happens over time?', situation: 'After an outcome, explore the stakeholder’s opportunities for recourse, adaptation, and longer-term effects.' },
];
export const planSnapshot = cards => cards.filter(c => c.stage?.toLowerCase() !== 'note').map(c => ({ uid: c.uid, stage: c.stage, description: c.description || '' }));
export const samePlan = (a, b) => JSON.stringify([...a].sort((x, y) => x.uid.localeCompare(y.uid))) === JSON.stringify([...b].sort((x, y) => x.uid.localeCompare(y.uid)));
export const comparisonLabels = { may_be_addressed: 'May be addressed', persists: 'Concern persists', new_burden: 'New stakeholder burden', insufficient_information: 'Insufficient information' };
export function coverageStatus(evaluations, personaId, scenarioId) {
  const matches = evaluations.filter(e => e.personaId === personaId && e.workbench?.scenario.id === scenarioId);
  if (!matches.length) return 'Not explored';
  if (matches.some(e => e.scenarioReview?.status === 'evidence' && e.scenarioReview?.evidence?.trim())) return 'Evidence recorded';
  if (matches.some(e => e.scenarioReview?.status === 'reviewed')) return 'Team reviewed';
  return 'Scenario saved';
}

// Old saved traces may have a separate analyst comment. The persona speaks its experience.
export const traceExperience = entry => entry?.stakeholderExperience || entry?.comment || '';

export function branchPlaybackRun(run, branchId) {
  const branch = run?.result.branches?.find(b => b.id === branchId);
  if (!branch || !run.result.stageTrace) return run;
  const trace = run.result.stageTrace;
  const fork = trace.findIndex(e => e.cardId === branch.visits[0].cardId);
  const entries = branch.visits.map(visit => ({ ...trace.find(e => e.cardId === visit.cardId), ...visit }));
  return { ...run, uid: `${run.uid}-branch-${branch.id}`, selectedBranchId: branch.id,
    branchSnapshot: branch, result: { ...run.result, stageTrace: [...trace.slice(0, Math.max(0, fork)).filter(e => !branch.visits.some(v => v.cardId === e.cardId)), ...entries] } };
}

export function tracePlanOrder(cards, links = []) {
  const order = ['problem', 'task', 'data', 'model', 'train', 'test', 'deploy', 'feedback'];
  const rank = c => { const i = order.indexOf(c.stage.toLowerCase()); return i < 0 ? order.length : i; };
  const sorted = [...cards].sort((a,b) => rank(a) - rank(b));
  const visited = new Set(), result = [];
  const walk = card => {
    if (visited.has(card.uid)) return;
    visited.add(card.uid); result.push(card);
    sorted.filter(next => links.some(l => l.start === card.uid && l.end === next.uid)).forEach(walk);
  };
  sorted.filter(c => !links.some(l => l.end === c.uid)).forEach(walk);
  sorted.forEach(walk);
  return result;
}
