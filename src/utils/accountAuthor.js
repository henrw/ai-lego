import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function accountAuthor(fallbackName, isDemo) {
  const user = isDemo ? null : auth?.currentUser;
  if (!user) return { name: fallbackName || 'Anonymous', uid: '', occupation: '', avatarSeed: '', profile_picture: '' };
  let profile = {};
  try { profile = (await getDoc(doc(db, 'users', user.uid))).data() || {}; }
  catch { /* Keep submissions available if a profile cannot be read. */ }
  return {
    uid: user.uid, name: profile.fullName || user.displayName || user.email || fallbackName || 'Participant',
    occupation: profile.occupation || '', avatarSeed: profile.avatarSeed || user.uid,
    profile_picture: profile.profile_picture || '',
  };
}
