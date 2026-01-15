import React, { useEffect, useRef, useState } from "react";
import { useUserAuth } from "../../../authentication/UserAuthContext";
import useMyStore from "../../../contexts/projectContext";

export default function PersonaEvaluation({ isExpanded, setIsExpanded, selectedCardIds, number, cardsData, cardId2number, selectedPersona }) {
    const { user } = useUserAuth();

    const [apiPending, setApiPending] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const personaAbortRef = useRef(null);
    const streamTickerRef = useRef(null);
    const streamTargetRef = useRef("");
    const streamDisplayIndexRef = useRef(0);
    const streamCompleteRef = useRef(false);
    const streamStartTimeRef = useRef(0);
    const [personaEvalText, setPersonaEvalText] = useState("");
    const textAreaRef = useRef(null);
    const shouldAutoScrollRef = useRef(true);

    const togglePanel = () => setIsExpanded(!isExpanded);
    const addEvaluation = useMyStore((store) => store.addEvaluation);

    const resetTextInput = () => {
        setPersonaEvalText("");
    }

    const getProblemText = () => {
        return personaEvalText;
    }

    const setProblemTextWrapper = (text) => {
        setPersonaEvalText(text);
    }

    useEffect(() => {
        if (!textAreaRef.current) return;
        const maxHeight = Math.floor(window.innerHeight * (isStreaming ? 0.35 : 0.6));
        textAreaRef.current.style.height = "auto";
        const nextHeight = Math.min(textAreaRef.current.scrollHeight, maxHeight);
        textAreaRef.current.style.height = `${nextHeight}px`;
        textAreaRef.current.style.overflowY = textAreaRef.current.scrollHeight > maxHeight ? "auto" : "hidden";
        if (shouldAutoScrollRef.current) {
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
        }
    }, [personaEvalText, isStreaming]);

    const startStreamTicker = () => {
        if (streamTickerRef.current) return;
        const streamWpm = 600;
        const avgCharsPerWord = 6;
        const charsPerMs = (streamWpm * avgCharsPerWord) / 60000;
        const tickMs = 50;
        streamStartTimeRef.current = 0;
        streamTickerRef.current = setInterval(() => {
            const target = streamTargetRef.current || "";
            if (streamStartTimeRef.current === 0 && target.length > 0) {
                streamStartTimeRef.current = Date.now();
            }
            if (streamStartTimeRef.current === 0) {
                return;
            }
            const elapsedMs = Date.now() - streamStartTimeRef.current;
            const desiredLength = Math.floor(elapsedMs * charsPerMs);
            if (desiredLength > streamDisplayIndexRef.current) {
                streamDisplayIndexRef.current = Math.min(desiredLength, target.length);
                setPersonaEvalText(target.slice(0, streamDisplayIndexRef.current));
            }
            if (streamCompleteRef.current) {
                if (streamDisplayIndexRef.current >= target.length) {
                    clearInterval(streamTickerRef.current);
                    streamTickerRef.current = null;
                    setIsStreaming(false);
                    setApiPending(false);
                }
            }
        }, tickMs);
    };

    const stopPersonaEvaluation = () => {
        if (personaAbortRef.current) {
            personaAbortRef.current.abort();
            personaAbortRef.current = null;
        }
        if (streamTickerRef.current) {
            clearInterval(streamTickerRef.current);
            streamTickerRef.current = null;
        }
        streamTargetRef.current = "";
        streamDisplayIndexRef.current = 0;
        streamCompleteRef.current = true;
        setApiPending(false);
        setIsStreaming(false);
    };

    const evaluatePersona = async () => {
        if (apiPending) return;
        setApiPending(true);
        setIsStreaming(true);
        streamTargetRef.current = "";
        streamDisplayIndexRef.current = 0;
        streamCompleteRef.current = false;
        streamStartTimeRef.current = 0;
        shouldAutoScrollRef.current = true;
        setProblemTextWrapper("");
        startStreamTicker();
        const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || "";
        const controller = new AbortController();
        personaAbortRef.current = controller;

        try {
            const response = await fetch(`${apiBaseUrl}/api/evaluate?stream=1`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                },
                body: JSON.stringify({
                    personaDescription: selectedPersona[0].description,
                    cardsData: cardsData,
                    stream: true
                }),
                signal: controller.signal,
            });

            const contentType = response.headers.get("content-type") || "";
            const shouldStream = response.ok && response.body && (contentType.includes("text/event-stream") || response.headers.get("x-stream") === "1");
            if (shouldStream) {
                setIsStreaming(true);
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let fullText = "";
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split("\n\n");
                    buffer = events.pop() || "";
                    for (const event of events) {
                        const line = event.split("\n").find((entry) => entry.startsWith("data: "));
                        if (!line) continue;
                        const chunk = line.replace("data: ", "");
                        if (chunk === "[DONE]") {
                            streamCompleteRef.current = true;
                            return;
                        }
                        fullText += chunk;
                        streamTargetRef.current = fullText;
                    }
                }
                streamCompleteRef.current = true;
                return;
            }

            if (response.ok) {
                const data = await response.json();
                const finalText = data.res || "";
                streamTargetRef.current = finalText;
                streamCompleteRef.current = true;
                console.log(data.res);
            } else {
                console.error('Failed to fetch:', response.status);
                streamCompleteRef.current = true;
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error("Failed to fetch:", error);
            }
            streamCompleteRef.current = true;
        } finally {
            personaAbortRef.current = null;
        }
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
                        {selectedPersona.length === 1 && (
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    type="button"
                                    className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-4 py-2.5 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900 disabled:opacity-60 disabled:cursor-not-allowed"
                                    onClick={evaluatePersona}
                                    disabled={apiPending}
                                >
                                    {apiPending ? "Generating..." : "Simulate persona's feeling"}
                                </button>
                                {apiPending && (
                                    <button
                                        type="button"
                                        className="text-white bg-red-500 hover:bg-red-600 focus:outline-none font-medium rounded-lg text-sm px-4 py-2.5"
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
                            onClick={() => {
                                const author = user?.displayName || "Anonymous";
                                const personaDescription = selectedPersona[0]?.description || "Unknown persona";
                                addEvaluation(author, [], { type: "persona", personaDescription, problem: getProblemText() });
                                resetTextInput();
                                setIsExpanded();
                            }}
                        >
                            Save
                        </button>

                    </>
                )}
            </div>
            {!isExpanded && <button className="round-button bg-violet-950 text-white z-10" onClick={togglePanel}>Persona</button>}
        </>
    );
};
