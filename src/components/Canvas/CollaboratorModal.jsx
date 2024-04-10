import React, { useState } from 'react';
import useMyStore from "../../contexts/projectContext";
import { db } from "../../firebase"; // Ensure you have this import
import { doc, getDoc, updateDoc, addDoc, collection, arrayUnion, query, where, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore"; // Import Firestore document update functions

function CollaboratorModal({ isOpen, onClose }) {
    const projectId = useMyStore((store) => store.projectId);
    const [email, setEmail] = useState('');
    const [userNotFound, setUserNotFound] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Sending invitation to:", email);
        // Add your logic to send the email or manage collaborators here
    };

    const url = `${window.location.href}?usp=sharing`;

    const handleCopyClick = async () => {
        try {
            await navigator.clipboard.writeText(url);
            // alert('URL copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const addCollaborator = async (email) => {
        if (projectId) {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));

            try {
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    console.log("No matching users.");
                    setUserNotFound(true);
                    return;
                }
                let userId = null;
                querySnapshot.forEach((doc) => {
                    console.log(`Found user with ID: ${doc.id}`);
                    userId = doc.id;
                    // Do something with the doc.id or doc.data()
                });

                const projectRef = doc(db, "projects", projectId);
                try {
                    await updateDoc(projectRef, {
                        userIds: arrayUnion(userId)
                    });
                    const userDocRef = doc(db, "users", userId);
                    await updateDoc(userDocRef, {
                        projectIds: arrayUnion(projectId)
                    });
                    console.log("User ID added to project.");
                } catch (error) {
                    console.error("Error adding user ID to project: ", error);
                }

            } catch (error) {
                console.error("Error getting documents: ", error);
                setUserNotFound(true);
            }
        }
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
                                onClick={() => { addCollaborator(email) }}
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
                <div className='mt-4 flex flex-row'>
                    <input type="text w-[90%] p-2 border" value={url} readOnly />
                    <button onClick={handleCopyClick} className='ml-2 bg-blue-500 p-1 rounded text-white text-sm'>Copy</button>
                </div>
            </div>
        </div>
    );
}

export default CollaboratorModal;