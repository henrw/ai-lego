import React, { useRef, useState, useEffect } from "react";
import { useUserAuth } from "../../../authentication/UserAuthContext";
import useMyStore from "../../../contexts/projectContext";
import { colorClasses } from "../../../contexts/projectContext";

export default function StageEvaluation({ selectedCardIds, number, cardsData, cardId2number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useUserAuth();

    const togglePanel = () => setIsExpanded(!isExpanded);
    const [problemText, setProblemText] = useState("");
    const [promptText, setPromptText] = useState("");
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    const resetTextInput = () => {
        setProblemText("");
    }

    return (
        <>
            <div className={`w-96 text-sm overflow-y-auto expandable-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        <div className="flex flex-row items-center mb-2">
                            <h2 className="font-bold">Stage Evaluation</h2>
                            <button
                                onClick={() => togglePanel()}
                                className="text p-1 ml-auto text-gray-400 hover:text-red-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex mb-3 text-base">Please discuss the ethical issue you identified by answering the following prompts</div>
                        <div className="mb-3">
                            <p>0. Related Stage:</p>
                            {
                                selectedCardIds.length === 1 ? (
                                    <div className="flex flex-row gap-1">
                                        {
                                            selectedCardIds.map((cardId) => {
                                                const stage = cardsData.filter(cardData => cardData.uid === cardId)[0].stage;
                                                return (
                                                    <div className={`rounded-full p-1 bg-${colorClasses[stage]}`}>
                                                        {stage}#{cardId2number[cardId]}
                                                    </div>
                                                );
                                            }
                                            )
                                        }
                                    </div>
                                ) : (
                                    <div>[Select one stage (click on the card)]</div>
                                )
                            }
                        </div>
                        <div className="mb-3">
                            <p>1. Briefly describe the issue:</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={problemText}
                                onChange={(e) => setProblemText(e.target.value)}
                            />
                        </div>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => { addEvaluation(user.displayName, selectedCardIds, { problem: problemText, }); resetTextInput(); setIsExpanded(); }}>
                            Submit
                        </button>
                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button bg-amber-950 bottom-[70px] text-white z-10" onClick={togglePanel}>Stage</button>}
        </>
    );
};