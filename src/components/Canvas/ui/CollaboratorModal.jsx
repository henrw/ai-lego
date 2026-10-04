import React, { useState } from 'react';
import useMyStore from "../../../contexts/projectContext";
import { db } from "../../../firebase";
import { doc, collection, arrayUnion, query, where, getDocs, writeBatch } from "firebase/firestore"; // Import Firestore document update functions

export function makeShareUrl(href, projectId) {
    const url = new URL(href);
    url.pathname = `/project/${encodeURIComponent(projectId)}`;
    url.searchParams.delete("usp"); url.hash = "";
    return url.toString();
}

function CollaboratorModal({ isOpen, onClose }) {
    const projectId = useMyStore((store) => store.projectId);
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
            await batch.commit(); setStatus("Collaborator added.");
        } catch { setStatus("Could not add collaborator. Check your connection and project permissions, then retry."); }
        finally { setPending(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20">
            <div className="relative top-20 mx-auto p-5 border w-[90%] md:w-[500px] shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Add Collaborator
                    </h3>
                    <button onClick={onClose} className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
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
                    <input type="text" className="w-[90%] p-2 border" value={url} readOnly />
                    <button onClick={handleCopyClick} className='ml-2 bg-blue-500 p-1 rounded text-white text-sm'>Copy</button>
                </div>
            </div>
        </div>
    );
}

export default CollaboratorModal;
