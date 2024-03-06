import React, { useRef, useState, useEffect } from "react";
import { useUserAuth } from "../authentication/UserAuthContext";
import useMyStore from "../contexts/projectContext";

export default function EvaluationPanel() {
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useUserAuth();

    const togglePanel = () => setIsExpanded(!isExpanded);
    const [problemText, setProblemText] = useState("");
    const [valueText, setValueText] = useState("");
    const [stakeholderText, setStakeholderText] = useState("");
    const [impactText, setImpactText] = useState("");
    const [openText, setOpenText] = useState("");
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    return (
        <>
            <div className={`w-96 expandable-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        <div className="flex flex-row items-center mb-4">
                            <h2 className="font-bold">Evaluation Report #{"TODO"}</h2>
                            <button
                                onClick={() => togglePanel()}
                                className="text p-1 ml-auto"
                            >
                                ❌
                            </button>
                        </div>
                        {/* <div className="mb-3">
                        <p>Related Stage(s):</p>
                    </div> */}
                        <div className="mb-3">
                            <p>Please briefly describe the issue:</p>
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
                    onClick={() => { addEvaluation(user.displayName, {problem: problemText, value: valueText, stakeholder: stakeholderText, impact: impactText, open: openText}) }}>
                            Submit
                        </button>
                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button font-bold" onClick={togglePanel}>Evaluate</button>}
        </>
    );
};