
const storageKey = uid => `ai-lego:openai-key:${uid}`;
export function readOpenAIKey(uid) {
  if (!uid) return '';
  try { return sessionStorage.getItem(storageKey(uid)) || ''; } catch { return ''; }
}
export function saveOpenAIKey(uid, value) {
  if (!uid) throw new Error('Sign in before saving an API key.');
  const key = value.trim();
  if (key && (!key.startsWith('sk-') || /\s/.test(key))) throw new Error('Paste a valid OpenAI API key beginning with sk-.');
  if (key) sessionStorage.setItem(storageKey(uid), key);
  else sessionStorage.removeItem(storageKey(uid));
}
export function openAIKeyHeaders(uid) {
  const key = readOpenAIKey(uid);
  return key ? { 'X-OpenAI-API-Key': key } : {};
}
