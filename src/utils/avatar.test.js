import { webcrypto } from 'crypto';
import { avatarUrl, profileAvatar, randomAvatarSeed, roleLabel } from './avatar';

beforeAll(() => { global.crypto = webcrypto; });

it('keeps portraits stable across reloads and varies them by seed', () => {
  expect(avatarUrl('account-a')).toBe(avatarUrl('account-a'));
  expect(avatarUrl('account-a')).not.toBe(avatarUrl('account-b'));
  const svg = decodeURIComponent(avatarUrl('<script>').split(',')[1]);
  expect(svg).toContain('<svg');
  expect(svg).not.toContain('<script>');
});
it('preserves uploaded photos and falls back for older accounts', () => {
  expect(profileAvatar({profile_picture:'https://example.com/me.png',avatarSeed:'a'},'b')).toBe('https://example.com/me.png');
  expect(profileAvatar({},'old-user')).toBe(avatarUrl('old-user'));
  expect(profileAvatar({avatarSeed:'saved'},'old-user')).toBe(avatarUrl('saved'));
});
it('creates random seeds and labels existing occupations', () => {
  expect(randomAvatarSeed()).not.toBe(randomAvatarSeed());
  expect(roleLabel('UI/UX Designer')).toBe('UX');
  expect(roleLabel('Product Manager')).toBe('PM');
  expect(roleLabel('AI Developer')).toBe('AI');
  expect(roleLabel('Researcher')).toBe('Researcher');
  expect(roleLabel('')).toBe('Role not set');
});
