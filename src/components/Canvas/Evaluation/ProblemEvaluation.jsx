import React, { useRef, useState, useEffect } from "react";
import { useUserAuth } from "../../../authentication/UserAuthContext";
import useMyStore from "../../../contexts/projectContext";
import { colorClasses } from "../../../contexts/projectContext";

export default function IssueEvaluation({isExpanded, setIsExpanded, selectedCardIds, number, cardsData, cardId2number }) {
    const { user } = useUserAuth();

    const togglePanel = () => setIsExpanded(!isExpanded);
    const [problemText, setProblemText] = useState("");
    const [valueText, setValueText] = useState("");
    const [stakeholderText, setStakeholderText] = useState("");
    const [impactText, setImpactText] = useState("");
    const [typeOfImpact, setTypeOfImpact] = useState('');
    const [degreeOfImpact, setDegreeOfImpact] = useState(4);
    const [scaleOfImpact, setScaleOfImpact] = useState('');
    const [openText, setOpenText] = useState("");
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    const resetTextInput = () => {
        setProblemText("");
        setValueText("");
        setStakeholderText("");
        setImpactText("");
        setTypeOfImpact("");
        setDegreeOfImpact(4);
        setScaleOfImpact("");
        setOpenText("");
    }

    return (
        <>
            <div className={`w-96 text-sm overflow-y-auto expandable-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        <div className="flex flex-row items-center mb-2">
                            <h2 className="font-bold">Issue Evaluation</h2>
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
                            <p>Related Stage(s):</p>
                            {
                                selectedCardIds.length !== 0 ? (
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
                                    <div>[Select all stages that apply (click on the cards)]</div>
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
                        {/* <div className="mb-3">
                            <p>2. What are some <strong>societal values</strong> impacted in this issue?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={valueText}
                                onChange={(e) => setValueText(e.target.value)}
                            />
                        </div> */}
                        <div className="mb-3">
                            <p><strong>Who</strong> is at risk of experiencing the issue?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={stakeholderText}
                                onChange={(e) => setStakeholderText(e.target.value)}
                            />
                        </div>

                        <div className="mb-1 space-y-4">
                            {/* Dropdown for Types of Impact */}
                            <p>What is the potential downstream <strong>impact</strong>?</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={impactText}
                                onChange={(e) => setImpactText(e.target.value)}
                            />
                            <p>How severe is the impact?</p>
                            <div className="flex flex-row mb-3">
                                <div className="flex flex-col flex-grow">
                                    <input
                                        type="range"
                                        min="1"
                                        max="7"
                                        value={degreeOfImpact}
                                        onChange={(e) => setDegreeOfImpact(e.target.value)}
                                        className="slider flex w-full"
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span className="text-xs">Not at all</span>
                                        <span className="text-xs">Moderate</span>
                                        <span className="text-xs">&nbsp;&nbsp;Extreme</span>
                                    </div>
                                </div>
                                <div className="flex flex-shrink px-1">
                                    {degreeOfImpact}
                                </div>
                            </div>

                            {/* <div>
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
                            </div> */}
                            {/* 
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
                            </fieldset> */}
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
                            onClick={() => { addEvaluation(user.displayName, selectedCardIds, { type: "problem", problem: problemText, stakeholder: stakeholderText, impact: [impactText, degreeOfImpact].join('-'), open: openText }); resetTextInput(); setIsExpanded(); }}>
                            Submit
                        </button>
                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button bg-black text-white bottom-[120px] z-10" onClick={togglePanel}>Issue</button>}
        </>
    );
};