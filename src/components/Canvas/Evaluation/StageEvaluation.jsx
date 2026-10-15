import { v4 as uuid } from "uuid";
import useDraft from "../../../utils/useDraft";
import React, { useEffect, useRef, useState } from "react";
import { useUserAuth } from "../../../authentication/UserAuthContext";
import useMyStore, { colorClasses, stageEvaluationPrompts } from "../../../contexts/projectContext";

export default function StageEvaluation({side = "right", showLauncher = true, isExpanded, setIsExpanded, selectedCardIds, number, cardsData, cardId2number }) {

    const { user } = useUserAuth();

    const togglePanel = () => setIsExpanded(!isExpanded);
    const projectId = useMyStore(store => store.projectId);
    const validCardIds = selectedCardIds.filter(id => cardsData.some(card => card.uid === id)).slice(-1);
    const selectedStage = cardsData.find(card => card.uid === validCardIds[0]);
    const draftKey = `evaluation-stage-${projectId}-${validCardIds[0] || "none"}`;
    const [problemText, setProblemText, resetTextInput] = useDraft(draftKey);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const submissionRef = useRef(null);
    useEffect(() => { submissionRef.current = null; setSaveError(""); }, [draftKey]);
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
            <div hidden={!showLauncher && !isExpanded} className={`w-96 text-sm overflow-y-auto expandable-panel ${side === "left" ? "evaluation-left" : ""} ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        <div className="flex flex-row items-center mb-2">
                            <h2 className="font-bold">Stage Evaluation</h2>
                            <button
                                aria-label="Close stage evaluation"
                                onClick={() => togglePanel()}
                                className="text p-1 ml-auto text-gray-400 hover:text-red-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="mb-3 text-sm">Evaluate one lifecycle block at a time. Click another block to switch; each block keeps its own draft.</p>
                        {selectedStage ? <section className="stage-evaluation-target" aria-label="Selected lifecycle block">
                            <strong className={`bg-${colorClasses[selectedStage.stage]} rounded px-2 py-1`}>{selectedStage.stage.charAt(0).toUpperCase() + selectedStage.stage.slice(1)}{cardId2number[selectedStage.uid] > 0 ? ` #${cardId2number[selectedStage.uid]}` : ''}</strong>
                            {selectedStage.description && <p className="mt-2 text-sm">{selectedStage.description}</p>}
                        </section> : <p>Select a lifecycle block on the canvas to evaluate it.</p>}
                        <div className="mb-3">
                            <label htmlFor="stage-evaluation-issue">{selectedStage ? stageEvaluationPrompts[selectedStage.stage] || "Describe the issue in this stage:" : "Issue"}</label>
                            <textarea id="stage-evaluation-issue" aria-label="Issue for selected stage" disabled={saving || !selectedStage}
                                className="w-full border border-gray-300 p-2 mb-2 rounded" rows={5}
                                value={problemText} onChange={(e) => setProblemText(e.target.value)}/>
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
            {showLauncher && !isExpanded && <button className={`round-button toolbox-action toolbox-stage ${side === "left" ? "evaluation-left" : ""} bg-amber-950 bottom-[70px] text-white z-10`} onClick={togglePanel}>Stage</button>}
        </>
    );
};
