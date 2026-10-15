import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { roleLayout } from './accountRole';

export default function useAccountRole(user, isDemo) {
  const [profile, setProfile] = useState({ uid: null, occupation: '', error: '' });
  useEffect(() => {
    if (isDemo || !user?.uid) return;
    return onSnapshot(doc(db, 'users', user.uid), snapshot => {
      setProfile({ uid: user.uid, occupation: snapshot.data()?.occupation || '', error: '' });
    }, () => setProfile({ uid: user.uid, occupation: '', error: 'Could not load your role. Refresh to retry.' }));
  }, [user?.uid, isDemo]);
  return {
    ...roleLayout(isDemo || !user ? 'Admin' : profile.occupation),
    roleLoading: !isDemo && !!user && profile.uid !== user.uid,
    roleError: !isDemo && profile.uid === user?.uid ? profile.error : '',
  };
}
