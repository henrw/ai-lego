import React, { useRef, useState, useEffect } from "react";
import { useUserAuth } from "../../authentication/UserAuthContext";
import useMyStore from "../../contexts/projectContext";
import { colorClasses } from "../../contexts/projectContext";

export default function EvaluationPanel({ selectedCardIds, cardsData, cardId2number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useUserAuth();

    const togglePanel = () => setIsExpanded(!isExpanded);
    const [problemText, setProblemText] = useState("");
    const [valueText, setValueText] = useState("");
    const [stakeholderText, setStakeholderText] = useState("");
    const [impactText, setImpactText] = useState("");
    const [openText, setOpenText] = useState("");
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    const resetTextInput = () => {
        setProblemText("");
        setValueText("");
        setStakeholderText("");
        setImpactText("");
        setOpenText("");
    }

    return (
        <>
            <div className={`w-96 text-sm expandable-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        <div className="flex flex-row items-center mb-4">
                            <h2 className="font-bold">Evaluation Report #{"TODO"}</h2>
                            <button
                                onClick={() => togglePanel()}
                                className="text p-1 ml-auto"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-3">
                            <p>Related Stage(s):</p>
                            {
                                selectedCardIds.length !== 0 && (
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
                                )
                            }
                        </div>
                        <div className="mb-3">
                            <p>Briefly describe the issue:</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={problemText}
                                onChange={(e) => setProblemText(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <p>What are some <strong>societal values</strong> impacted in this issue?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={valueText}
                                onChange={(e) => setValueText(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <p><strong>Who</strong> is at risk of experiencing the issue?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={stakeholderText}
                                onChange={(e) => setStakeholderText(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <p>What are the types of <strong>impact</strong> (e.g., alllocation, quality of service, stereotyping, denigration, over- or underrepresentation)? What is the degree of impact [no discernable - minor - moderate - major]? What is the scale of impact [small - medium - large]?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={impactText}
                                onChange={(e) => setImpactText(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <p>Any other comments?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={openText}
                                onChange={(e) => setOpenText(e.target.value)}
                            />
                        </div>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => { addEvaluation(user.displayName, selectedCardIds, { problem: problemText, value: valueText, stakeholder: stakeholderText, impact: impactText, open: openText }); resetTextInput(); }}>
                            Submit
                        </button>
                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button font-bold" onClick={togglePanel}>Evaluate</button>}
        </>
    );
};