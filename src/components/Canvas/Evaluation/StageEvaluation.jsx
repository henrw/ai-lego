import { v4 as uuid } from "uuid";
import useDraft from "../../../utils/useDraft";
import React, { useRef, useState } from "react";
import { useUserAuth } from "../../../authentication/UserAuthContext";
import useMyStore, { colorClasses, stageEvaluationPrompts } from "../../../contexts/projectContext";

export default function StageEvaluation({isExpanded, setIsExpanded, selectedCardIds, number, cardsData, cardId2number }) {

    const { user } = useUserAuth();

    const togglePanel = () => setIsExpanded(!isExpanded);
    const projectId = useMyStore(store => store.projectId);
    const [problemText, setProblemText, resetTextInput] = useDraft(`evaluation-stage-${projectId}`);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const submissionRef = useRef(null);
    const validCardIds = selectedCardIds.filter(id => cardsData.some(card => card.uid === id));
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    const saveEvaluation = async () => {
        if (saving || !problemText.trim() || !validCardIds.length) return;
        setSaving(true); setSaveError(""); submissionRef.current ||= `evaluation-${uuid()}`;
        const ok = await addEvaluation(user?.displayName || "Anonymous", validCardIds, { uid: submissionRef.current, type: "stage", problem: problemText.trim() });
        setSaving(false);
        if (ok) { resetTextInput(); submissionRef.current = null; setIsExpanded(false); }
        else setSaveError("Could not save this evaluation. Your draft is retained; retry saving.");
    };

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
                            <p>Related Stage:</p>
                            {
                                validCardIds.length > 0 ? (
                                    <div className="flex flex-row gap-1">
                                        {
                                            validCardIds.map((cardId) => {
                                                const stage = cardsData.filter(cardData => cardData.uid === cardId)[0].stage;
                                                return (
                                                    <div key={cardId} className={`rounded-full p-1 bg-${colorClasses[stage]}`}>
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
                            <p>{
                            validCardIds.map((cardId) => {
                                const stage = cardsData.filter(cardData => cardData.uid === cardId)[0].stage;
                                return stageEvaluationPrompts[stage] || "Briefly describe the issue of this stage:";
                            })}</p>
                            <textarea
                                className="w-full border border-gray-300 p-2 mb-2 rounded"
                                value={problemText}
                                onChange={(e) => setProblemText(e.target.value)}
                            />
                        </div>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            disabled={saving || !problemText.trim() || !validCardIds.length}
                            onClick={saveEvaluation}>
                            Submit
                        </button>
                        {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button bg-amber-950 bottom-[70px] text-white z-10" onClick={togglePanel}>Stage</button>}
        </>
    );
};
