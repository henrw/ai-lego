import React, { useRef, useState, useEffect } from "react";
import { useUserAuth } from "../../../authentication/UserAuthContext";
import useMyStore from "../../../contexts/projectContext";
import { colorClasses } from "../../../contexts/projectContext";

export default function PersonaEvaluation({ isExpanded, setIsExpanded, selectedCardIds, number, cardsData, cardId2number, selectedPersona }) {
    const { user } = useUserAuth();

    const [apiPending, setApiPending] = useState(false);

    const togglePanel = () => setIsExpanded(!isExpanded);
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    const resetTextInput = () => {
        const textArea = document.getElementById("persona-eval-textarea");
        textArea.value = "";
    }

    const getProblemText = () => {
        const textArea = document.getElementById("persona-eval-textarea");
        return textArea.value;
    }

    const setProblemTextWrapper = (text) => {
        const textArea = document.getElementById("persona-eval-textarea");
        if (textArea) {
            textArea.value = text;  // Update the text in the textarea
            textArea.style.height = "auto";  // Reset height to ensure the new height calculation is correct
            textArea.style.height = textArea.scrollHeight + "px";  // Set the height to the scroll height
        }
    }

    const evaluatePersona = async () => {
        setApiPending(true);
        const response = await fetch("/api/evaluate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personaDescription: selectedPersona[0].description,
                cardsData: cardsData
            }),
        });

        if (response.ok) {
            const data = await response.json();
            setProblemTextWrapper(data.res);
            console.log(data.res);
        } else {
            console.error('Failed to fetch:', response.status);
        }
        setApiPending(false);
    };

    return (
        <>
            <div className={`w-96 text-sm overflow-y-auto expandable-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        <div className="flex flex-row items-center mb-2">
                            <h2 className="font-bold">Persona Evaluation</h2>
                            <button
                                onClick={() => togglePanel()}
                                className="text p-1 ml-auto text-gray-400 hover:text-red-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* <div className="flex mb-3 text-base">Please discuss the ethical issue you identified by answering the following prompts</div> */}
                        <div className="mb-3">
                            <p>Selected Persona:</p>
                            {
                                selectedPersona.length === 1 ? (
                                    <div className="flex flex-col w-full items-center gap-1">
                                        <img src={selectedPersona[0].imgUrl} width={50} alt="persona"></img>
                                        <p>{selectedPersona[0].description}</p>
                                    </div>
                                ) : (
                                    <div>[Select one persona (click on the persona icon)]</div>
                                )
                            }
                        </div>
                        {
                            selectedPersona.length === 1 && (
                                <button type="button" class="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
                                    onClick={evaluatePersona}>
                                    Simulate persona's feeling
                                </button>
                            )
                        }
                        {
                            apiPending && <p>Generating...</p>
                        }
                        <div className="mt-3">
                            <textarea
                                id="persona-eval-textarea"
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                // value={problemText}
                                onChange={(e) => setProblemTextWrapper(e.target.value)}
                            />
                        </div>

                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => { addEvaluation(user.displayName, [], { type: "persona", personaDescription: selectedPersona[0].description, problem: getProblemText() }); resetTextInput(); setIsExpanded(); }}>
                            Submit
                        </button>
                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button bg-violet-950 text-white z-10" onClick={togglePanel}>Persona</button>}
        </>
    );
};