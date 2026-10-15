export function canvasRole(occupation) {
  if (occupation === 'AI Developer' || occupation === 'AI') return 'ai';
  if (['Product Manager', 'UI/UX Designer', 'PM', 'UX'].includes(occupation)) return 'reviewer';
  // Preserve the original interface for Admin and existing accounts without a role.
  return 'admin';
}
export function roleLayout(occupation) {
  const role = canvasRole(occupation);
  return { role, showLifecycle: role !== 'reviewer', showEvaluation: role !== 'ai', evaluationSide: 'right' };
}
