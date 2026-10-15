import { openAIKeyHeaders } from '../../../utils/openAIKey';
import React, { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { useUserAuth } from "../../../authentication/UserAuthContext";
import useMyStore from "../../../contexts/projectContext";
import useDraft from "../../../utils/useDraft";
import { readAIResponse } from "../../../utils/aiResponse";

export default function ClassicPersonaEvaluation({ renderHeader, model = 'gpt-6.1-sol', side = "right", showLauncher = true,  isExpanded, setIsExpanded, selectedPersona, cardsData }) {
    const { user } = useUserAuth();
    const projectId = useMyStore(store => store.projectId);
    const addEvaluation = useMyStore(store => store.addEvaluation);
    const personaId = selectedPersona[0]?.uid || selectedPersona[0]?.description || "none";
    const [personaEvalText, setPersonaEvalText, resetTextInput] = useDraft(`evaluation-persona-${projectId}-${personaId}`);
    const [apiPending, setApiPending] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState("");
    const personaAbortRef = useRef(null);
    const submissionRef = useRef(null);
    const textAreaRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);
    const togglePanel = () => setIsExpanded(!isExpanded);
    useEffect(() => {
        setApiPending(false); setIsStreaming(false); setApiError(""); submissionRef.current = null;
        return () => { personaAbortRef.current?.abort(); personaAbortRef.current = null; };
    }, [projectId, personaId]);
    useEffect(() => {
        if (!textAreaRef.current) return;
        const maxHeight = Math.floor(window.innerHeight * (isStreaming ? 0.35 : 0.6));
        textAreaRef.current.style.height = "auto";
        textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, maxHeight)}px`;
        textAreaRef.current.style.overflowY = textAreaRef.current.scrollHeight > maxHeight ? "auto" : "hidden";
        if (shouldAutoScrollRef.current) textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }, [personaEvalText, isStreaming, isExpanded]);
    const stopPersonaEvaluation = () => { personaAbortRef.current?.abort("stopped"); };
    const evaluatePersona = async () => {
        if (apiPending || selectedPersona.length !== 1) return;
        const controller = new AbortController(); personaAbortRef.current = controller;
        const timeout = setTimeout(() => controller.abort("timeout"), 55000);
        setApiPending(true); setIsStreaming(true); setApiError("");
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || ""}/api/evaluate?stream=1`, {
                method: "POST", headers: { "Content-Type": "application/json", ...openAIKeyHeaders(user?.uid), Accept: "text/event-stream" },
                body: JSON.stringify({ model, personaDescription: selectedPersona[0].description, personaProfile: selectedPersona[0].profile || {}, cardsData, stream: true }), signal: controller.signal,
            });
            await readAIResponse(response, text => { if (personaAbortRef.current === controller) setPersonaEvalText(text); });
        } catch (error) {
            if (personaAbortRef.current === controller) setApiError(controller.signal.aborted ? controller.signal.reason === "timeout" ? "The request timed out. Your text is retained; retry the simulation." : "Simulation stopped. Your text is retained." : error.message || "Check your connection and try again.");
        } finally {
            clearTimeout(timeout);
            if (personaAbortRef.current === controller) { personaAbortRef.current = null; setApiPending(false); setIsStreaming(false); }
        }
    };
    const saveEvaluation = async () => {
        if (saving || apiPending || !personaEvalText.trim() || selectedPersona.length !== 1) return;
        setSaving(true); setApiError(""); submissionRef.current ||= `evaluation-${uuid()}`;
        const persona = selectedPersona[0];
        const ok = await addEvaluation(user?.displayName || "Anonymous", [], { uid: submissionRef.current, type: "persona", ...(persona.uid ? { personaId: persona.uid } : {}), personaDescription: persona.description, problem: personaEvalText.trim() });
        setSaving(false);
        if (ok) { resetTextInput(); submissionRef.current = null; setIsExpanded(false); }
        else setApiError("Your evaluation could not be saved. The draft is retained; retry saving.");
    };

    return (
        <>
            <div hidden={!showLauncher && !isExpanded} className={`w-96 text-sm overflow-y-auto expandable-panel ${side === "left" ? "evaluation-left" : ""} ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {/* Panel content goes here - it will show when expanded */}
                {isExpanded && (
                    <>
                        {renderHeader?.(apiPending || saving)}
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
                        {apiError && (
                            <p role="alert" className="mt-2 text-sm text-red-600">{apiError}</p>
                        )}
                        {selectedPersona.length === 1 && (
                            <div className="mt-3 flex flex-col gap-2 mb-2">
                                <button
                                    type="button"
                                    className="w-full focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-4 py-2.5 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 disabled:opacity-60 disabled:cursor-not-allowed"
                                    onClick={evaluatePersona}
                                    disabled={apiPending}
                                >
                                    {apiPending ? "Generating..." : "Simulate persona's feeling"}
                                </button>
                                {apiPending && (
                                    <button
                                        type="button"
                                        className="w-full text-white bg-red-500 hover:bg-red-600 focus:outline-none font-medium rounded-lg text-sm px-4 py-2.5"
                                        onClick={stopPersonaEvaluation}
                                    >
                                        Stop
                                    </button>
                                )}
                            </div>
                        )}
                        {isStreaming && <p className="text-xs text-gray-500 mb-2">Waiting for response...</p>}
                        <div className="mt-3">
                            <textarea
                                id="persona-eval-textarea"
                                ref={textAreaRef}
                                className="w-full border border-gray-300 p-2 mb-2 rounded min-h-[160px] resize-y"
                                value={personaEvalText}
                                aria-label="Persona evaluation text"
                                disabled={apiPending || saving}
                                onChange={(e) => setPersonaEvalText(e.target.value)}
                                onScroll={() => {
                                    if (!textAreaRef.current) return;
                                    const { scrollTop, scrollHeight, clientHeight } = textAreaRef.current;
                                    shouldAutoScrollRef.current = scrollTop + clientHeight >= scrollHeight - 8;
                                }}
                            />
                        </div>
                        <button
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            disabled={saving || apiPending || !personaEvalText.trim() || selectedPersona.length !== 1}
                            onClick={saveEvaluation}
                        >
                            Save
                        </button>

                    </>
                )}
            </div>
            {showLauncher && !isExpanded && <button className={`round-button toolbox-action toolbox-persona ${side === "left" ? "evaluation-left" : ""} bg-violet-950 text-white z-10`} onClick={togglePanel}>Persona</button>}
        </>
    );
};
