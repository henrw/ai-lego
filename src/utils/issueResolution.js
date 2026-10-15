export const specificationSnapshot = cards => cards.filter(card => card.stage?.toLowerCase() !== 'note').map(card => ({ uid: card.uid, stage: card.stage, description: card.description || '' }));

export function specificationChanges(issue, cards, selectedIds) {
  const baseline = issue.specificationBaseline;
  const byId = new Map((baseline || []).map(card => [card.uid, card]));
  return specificationSnapshot(cards).filter(card => selectedIds.includes(card.uid)).flatMap(card => {
    const before = byId.get(card.uid);
    if (baseline && before?.description === card.description && before?.stage === card.stage) return [];
    return [{ cardId: card.uid, stage: card.stage, blockNumber: cards.filter(item => item.stage === card.stage).findIndex(item => item.uid === card.uid), before: before?.description ?? '', after: card.description, kind: !baseline ? 'existing' : before ? 'updated' : 'added', beforeKnown: !!baseline }];
  });
}
export function resolutionIsCurrent(resolution, cards) {
  return !!resolution?.changes?.length && resolution.changes.every(change => cards.some(card => card.uid === change.cardId && card.stage === change.stage && (card.description || '') === change.after));
}
export function issueStatus(issue) { return issue.resolutionStatus || 'open'; }
export function issueCommentSnapshot(issue) {
  return Object.fromEntries(['uid', 'text', 'problem', 'type', 'stakeholder', 'impact', 'open', 'author', 'by', 'lastUpdatedTime'].filter(key => issue[key] !== undefined).map(key => [key, issue[key]]));
}
export function resolutionTransition(issue, action, actor, cards, input, time) {
  const status = issueStatus(issue);
  if (action === 'submit') {
    if (!['ai', 'admin'].includes(actor.role)) throw new Error('Only AI developers or admins can submit a resolution.');
    if (status !== 'open') throw new Error('This issue has changed. Reopen its review to see the latest status.');
    if (input.expectedSpecifications && input.expectedSpecifications.some(expected => !cards.some(card => card.uid === expected.uid && card.stage === expected.stage && (card.description || '') === expected.description))) throw new Error('Specifications changed while submitting. Click Address issue again to capture the latest changes.');
    const changes = specificationChanges(issue, cards, input.cardIds || []);
    if (!input.uid || !changes.length || changes.some(change => change.kind === 'added' && !change.after.trim())) throw new Error('Update at least one updated or new specification block before addressing this issue.');
    const resolution = { uid: input.uid, changes, submittedBy: actor.author, submittedAt: time };
    return { resolutionStatus: 'pending', resolution, resolutionHistory: [...(issue.resolutionHistory || []), { action: 'submitted', ...resolution, comment: issueCommentSnapshot(issue) }] };
  }
  if (!['reviewer', 'admin'].includes(actor.role)) throw new Error('Only PM/UX reviewers or admins can review a resolution.');
  if (status !== 'pending' || !input.resolutionId || issue.resolution?.uid !== input.resolutionId) throw new Error('This proposal has changed. Reopen its review before deciding.');
  if (!['approve', 'request_changes'].includes(action)) throw new Error('Unknown review action.');
  if (action === 'approve' && !resolutionIsCurrent(issue.resolution, cards)) throw new Error('The linked specifications changed after this proposal. Request an updated resolution before approving.');
  if (action === 'request_changes' && !input.note?.trim()) throw new Error('Explain what still needs to change.');
  const review = { action: action === 'approve' ? 'approved' : 'changes_requested', resolutionId: input.resolutionId, note: input.note?.trim() || '', reviewedBy: actor.author, reviewedAt: time, comment: issueCommentSnapshot(issue) };
  return { resolutionStatus: action === 'approve' ? 'resolved' : 'open', resolutionReview: review, resolutionHistory: [...(issue.resolutionHistory || []), review] };
}

export function captureIssueChanges(issue, cards) {
  const changes = specificationChanges(issue, cards, cards.map(card => card.uid)).filter(change => change.kind !== 'added' || change.after.trim());
  if (!changes.length) throw new Error('Update a specification or add a lifecycle block before addressing this issue.');
  return { cardIds: changes.map(change => change.cardId), expectedSpecifications: changes.map(change => ({ uid: change.cardId, stage: change.stage, description: change.after })) };
}

export function completedReviews(issue) {
  const history = issue.resolutionHistory || [];
  return history.flatMap((entry, index) => {
    if (!['approved', 'changes_requested'].includes(entry.action)) return [];
    const proposal = history.slice(0, index).reverse().find(previous => previous.action === 'submitted' && (!entry.resolutionId || previous.uid === entry.resolutionId));
    return [{ ...entry, changes: proposal?.changes || [], submittedBy: proposal?.submittedBy, comment: entry.comment || proposal?.comment || issue }];
  });
}
