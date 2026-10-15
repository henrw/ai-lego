import React, { useEffect, useState } from 'react';
import useMyStore from "../../../contexts/projectContext";
import { db } from "../../../firebase";
import { doc, collection, arrayUnion, query, where, getDocs, writeBatch, onSnapshot } from "firebase/firestore"; // Import Firestore document update functions

import { profileAvatar, roleLabel } from "../../../utils/avatar";
import { useUserAuth } from "../../../authentication/UserAuthContext";

export function makeShareUrl(href, projectId) {
    const url = new URL(href);
    url.pathname = `/project/${encodeURIComponent(projectId)}`;
    url.searchParams.delete("usp"); url.hash = "";
    return url.toString();
}

function CollaboratorModal({ isOpen, onClose }) {
    const projectId = useMyStore((store) => store.projectId);
    const { user } = useUserAuth();
    const [participants, setParticipants] = useState([]);
    const [participantsError, setParticipantsError] = useState("");
    const [participantsLoading, setParticipantsLoading] = useState(false);
    useEffect(() => {
        setParticipants([]); setParticipantsError(""); setStatus(""); setEmail(""); setUserNotFound(false);
        if (!isOpen || !projectId) return;
        setParticipantsLoading(true);
        let active = true;
        const watchers = new Map();
        const stop = onSnapshot(doc(db, "projects", projectId), snapshot => {
            if (!active) return;
            if (!snapshot.exists()) { setParticipantsLoading(false); setParticipantsError("This project is unavailable."); return; }
            const ids = [...new Set(snapshot.data().userIds || [])];
            for (const [id, unsubscribe] of watchers) if (!ids.includes(id)) { unsubscribe(); watchers.delete(id); }
            setParticipants(previous => ids.map(uid => previous.find(person => person.uid === uid) || { uid, loading: true }));
            setParticipantsLoading(false);
            ids.forEach(uid => {
                if (watchers.has(uid)) return;
                watchers.set(uid, onSnapshot(doc(db, "users", uid), profile => {
                    if (active) setParticipants(previous => previous.map(person => person.uid === uid ? { ...profile.data(), uid, unavailable: !profile.exists() } : person));
                }, () => {
                    if (active) setParticipants(previous => previous.map(person => person.uid === uid ? { uid, unavailable: true } : person));
                }));
            });
        }, () => { if (active) { setParticipantsLoading(false); setParticipantsError("Could not load participants. Close Share and retry."); } });
        return () => { active = false; stop(); watchers.forEach(unsubscribe => unsubscribe()); };
    }, [isOpen, projectId]);
    const [email, setEmail] = useState('');
    const [userNotFound, setUserNotFound] = useState(false);
    const [status, setStatus] = useState("");
    const [pending, setPending] = useState(false);
    const handleSubmit = (e) => { e.preventDefault(); addCollaborator(email); };

    const url = makeShareUrl(window.location.href, projectId);

    const handleCopyClick = async () => {
        try {
            await navigator.clipboard.writeText(url); setStatus("Link copied.");
        } catch (err) {
            setStatus("Clipboard unavailable. Select and copy the link instead.");
        }
    };

    const addCollaborator = async (email) => {
        if (!projectId || pending) return;
        setPending(true); setStatus(""); setUserNotFound(false);
        try {
            const snapshot = await getDocs(query(collection(db, "users"), where("email", "==", email.trim())));
            if (snapshot.empty) { setUserNotFound(true); return; }
            const userId = snapshot.docs[0].id;
            const batch = writeBatch(db);
            batch.update(doc(db, "projects", projectId), { userIds: arrayUnion(userId) });
            batch.update(doc(db, "users", userId), { projectIds: arrayUnion(projectId) });
            await batch.commit(); setEmail(""); setStatus("Collaborator added.");
        } catch { setStatus("Could not add collaborator. Check your connection and project permissions, then retry."); }
        finally { setPending(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]" role="dialog" aria-modal="true" aria-labelledby="share-title">
            <div className="relative top-20 mx-auto p-5 border w-[90%] md:w-[500px] shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center">
                    <h3 id="share-title" className="text-lg leading-6 font-medium text-gray-900">
                        Share project
                    </h3>
                    <button aria-label="Close Share" onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <section className="mt-4" aria-label="Project participants">
                    <h4 className="text-sm font-semibold text-gray-700">Participants {participants.length > 0 && `(${participants.length})`}</h4>
                    {participantsLoading && <p role="status" className="text-sm text-gray-500 mt-2">Loading participants…</p>}
                    {participantsError && <p role="alert" className="text-sm text-red-600 mt-2">{participantsError}</p>}
                    {!participantsLoading && !participantsError && participants.length === 0 && <p className="text-sm text-gray-500 mt-2">No participants yet.</p>}
                    <ul className="mt-2 max-h-60 overflow-y-auto divide-y divide-gray-100">
                        {participants.map(person => <li key={person.uid} className="flex items-center gap-3 py-3">
                            <img src={profileAvatar(person, person.uid)} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{person.loading ? "Loading profile…" : person.unavailable ? "Profile unavailable" : person.fullName || person.email || "Participant"}{person.uid === user?.uid && " (you)"}</p>
                                {person.email && <p className="text-xs text-gray-500 truncate">{person.email}</p>}
                            </div>
                            <span className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1" title={person.occupation}>{roleLabel(person.occupation)}</span>
                        </li>)}
                    </ul>
                </section>
                <form onSubmit={handleSubmit} className="mt-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                    </label>
                    <div className='flex flex-row items-center'>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="mr-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full py-2 px-2 sm:text-sm border-gray-300 rounded-md"
                            placeholder="you@example.com"
                            required
                            value={email}
                            onClick={() => setUserNotFound(false)}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <div className="ml-auto">
                            <button
                                type="submit"
                                disabled={pending}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Invite
                            </button>
                        </div>
                    </div>
                    {
                        userNotFound && (
                            <p className='text-red-500'>User not found.</p>
                        )
                    }
                </form>
                {status && <p role="status" className="text-sm mt-2">{status}</p>}
                <div className='mt-4 flex flex-row'>
                    <input type="text" aria-label="Project share link" className="w-[90%] p-2 border" value={url} readOnly />
                    <button onClick={handleCopyClick} className='ml-2 bg-blue-500 p-1 rounded text-white text-sm'>Copy</button>
                </div>
            </div>
        </div>
    );
}

export default CollaboratorModal;
