// A seed produces the same portrait on every device; only the seed is stored.
export function randomAvatarSeed() {
  return Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(36)).join('-');
}
export function avatarUrl(seed = 'guest') {
  let hash = 2166136261;
  for (const char of String(seed)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const colors = ['#cddfd6', '#e5cf92', '#d4c5eb', '#b7d6eb', '#edc5bb', '#cbd2e5'];
  const skin = ['#f6d5b5', '#e9b58d', '#c88e66', '#986747', '#70472f'][hash % 5];
  const hair = ['#292524', '#51392d', '#8b5e34', '#d4a85b'][Math.floor(hash / 5) % 4];
  const shirt = ['#526b84', '#667e66', '#8b638d', '#b76f58'][Math.floor(hash / 20) % 4];
  const bg = colors[Math.floor(hash / 80) % colors.length];
  const glasses = hash % 3 === 0 ? '<g fill="none" stroke="#334155" stroke-width="2"><rect x="28" y="40" width="15" height="10" rx="4"/><rect x="49" y="40" width="15" height="10" rx="4"/><path d="M43 44h6"/></g>' : '';
  // Two short cuts, a bob, and long hair give randomized portraits a mix of presentations.
  const hairstyle = Math.floor(hash / 480) % 4;
  const backHair = [
    '', '',
    `<path d="M20 40Q18 12 46 12Q75 12 73 42L75 69Q64 75 58 66H34Q25 75 18 69Z" fill="${hair}"/>`,
    `<path d="M20 40Q18 12 46 12Q76 12 74 42L80 85Q66 91 57 76H34Q22 90 14 84Z" fill="${hair}"/>`,
  ][hairstyle];
  const fringe = [
    'M24 37Q22 12 46 14Q72 13 68 39L61 31Q43 36 32 27Z',
    'M24 38Q20 15 44 14Q74 11 68 39L62 27Q42 24 28 37Z',
    'M22 44Q18 13 46 14Q74 12 71 44L64 40L61 29Q45 36 29 31L28 45Z',
    'M22 46Q18 15 46 14Q76 12 71 47L64 40Q62 25 49 24Q43 37 28 40L27 49Z',
  ][hairstyle];
  const earrings = hairstyle >= 2 ? '<g fill="#e5cf92"><circle cx="24" cy="53" r="3"/><circle cx="68" cy="53" r="3"/></g>' : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><clipPath id="portrait"><circle cx="48" cy="48" r="48"/></clipPath></defs><g clip-path="url(#portrait)"><rect width="96" height="96" fill="${bg}"/>${backHair}<path d="M13 96Q14 70 36 68H58Q81 70 83 96" fill="${shirt}"/><rect x="38" y="56" width="18" height="21" rx="8" fill="${skin}"/><ellipse cx="46" cy="43" rx="23" ry="27" fill="${skin}"/><path d="${fringe}" fill="${hair}"/><g fill="#292524"><circle cx="35" cy="44" r="2"/><circle cx="56" cy="44" r="2"/></g>${glasses}${earrings}<path d="M39 57Q46 62 53 57" fill="none" stroke="#784638" stroke-width="2" stroke-linecap="round"/></g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
export const ACCOUNT_ROLES = ['Admin', 'UI/UX Designer', 'Product Manager', 'AI Developer'];
export function roleLabel(occupation) {
  return { 'UI/UX Designer': 'UX', 'Product Manager': 'PM', 'AI Developer': 'AI' }[occupation] || occupation || 'Role not set';
}
export function profileAvatar(profile = {}, uid = 'guest') {
  return profile.profile_picture || avatarUrl(profile.avatarSeed || uid);
}
