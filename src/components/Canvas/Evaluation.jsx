import React, { useRef, useState, useEffect } from "react";
import { useUserAuth } from "../../authentication/UserAuthContext";
import useMyStore from "../../contexts/projectContext";
import { colorClasses } from "../../contexts/projectContext";

export default function EvaluationPanel({ selectedCardIds, number, cardsData, cardId2number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useUserAuth();

    const togglePanel = () => setIsExpanded(!isExpanded);
    const [problemText, setProblemText] = useState("");
    const [valueText, setValueText] = useState("");
    const [stakeholderText, setStakeholderText] = useState("");
    // const [impactText, setImpactText] = useState("");
    const [typeOfImpact, setTypeOfImpact] = useState('');
    const [degreeOfImpact, setDegreeOfImpact] = useState('');
    const [scaleOfImpact, setScaleOfImpact] = useState('');
    const [openText, setOpenText] = useState("");
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    const resetTextInput = () => {
        setProblemText("");
        setValueText("");
        setStakeholderText("");
        // setImpactText("");
        setTypeOfImpact("");
        setDegreeOfImpact("");
        setScaleOfImpact("");
        setOpenText("");
    }

    return (
        <>
            <div className={`w-96 text-sm overflow-y-auto expandable-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        <div className="flex flex-row items-center mb-4">
                            <h2 className="font-bold">Evaluation Report #{number}</h2>
                            <button
                                onClick={() => togglePanel()}
                                className="text p-1 ml-auto text-gray-400 hover:text-red-500"
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
                            <p>1. Briefly describe the issue:</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={problemText}
                                onChange={(e) => setProblemText(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <p>2. What are some <strong>societal values</strong> impacted in this issue?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={valueText}
                                onChange={(e) => setValueText(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <p>3. <strong>Who</strong> is at risk of experiencing the issue?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={stakeholderText}
                                onChange={(e) => setStakeholderText(e.target.value)}
                            />
                        </div>

                        <div className="mb-1 space-y-4">
                            {/* Dropdown for Types of Impact */}
                            <p>4. How is the <strong>impact</strong>?</p>
                            <div>
                                <label htmlFor="types-of-impact" className="block  font-sm">Types of Impact</label>
                                <select
                                    id="types-of-impact"
                                    value={typeOfImpact}
                                    onChange={(e) => setTypeOfImpact(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Select an impact type</option>
                                    <option value="allocation">Allocation</option>
                                    <option value="quality of service">Quality of Service</option>
                                    <option value="stereotyping">Stereotyping</option>
                                    <option value="denigration">Denigration</option>
                                    <option value="overrepresentation">Overrepresentation</option>
                                    <option value="underrepresentation">Underrepresentation</option>
                                </select>
                            </div>

                            {/* Scale for Degree of Impact */}
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-medium ">Degree of Impact</legend>
                                <div className="flex items-center space-x-4">
                                    {["no discernable", "minor", "moderate", "major"].map((degree) => (
                                        <label key={degree} className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="degree-of-impact"
                                                value={degree}
                                                checked={degreeOfImpact === degree}
                                                onChange={(e) => setDegreeOfImpact(e.target.value)}
                                                className="focus:ring-indigo-500 h-4 w-4 border-gray-300"
                                            />
                                            {degree.charAt(0).toUpperCase() + degree.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            {/* Scale for Scale of Impact */}
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-medium ">Scale of Impact</legend>
                                <div className="flex items-center space-x-4">
                                    {["small", "medium", "large"].map((scale) => (
                                        <label key={scale} className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="scale-of-impact"
                                                value={scale}
                                                checked={scaleOfImpact === scale}
                                                onChange={(e) => setScaleOfImpact(e.target.value)}
                                                className="focus:ring-indigo-500 h-4 w-4 border-gray-300"
                                            />
                                            {scale.charAt(0).toUpperCase() + scale.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </div>

                        <div className="mb-3">
                            <p>5. Any other comments?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={openText}
                                onChange={(e) => setOpenText(e.target.value)}
                            />
                        </div>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => { addEvaluation(user.displayName, selectedCardIds, { problem: problemText, value: valueText, stakeholder: stakeholderText, impact: [typeOfImpact, degreeOfImpact, scaleOfImpact].join('-'), open: openText }); resetTextInput(); setIsExpanded(); }}>
                            Submit
                        </button>
                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button font-bold z-30" onClick={togglePanel}>Evaluate</button>}
        </>
    );
};