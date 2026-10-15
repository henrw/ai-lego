import React, { useState } from 'react';
import useMyStore from "../../../contexts/projectContext";
import EvaluationBox from "../Block/Evaluation";
import { shallow } from "zustand/shallow";

function PersonaIcon({ personaId, imgUrl, description, isSelected, toggleFunction, idx, openAbove = false, alignLeft = false, accountRole = "admin" }) {
    const deletePersona = useMyStore(store => store.deletePersona);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [isHover, setIsHover] = useState(false);
    const [showEvaluation, setShowEvaluation] = useState(false);
    const [currentEvalIndex, setCurrentEvalIndex] = useState(0);
    const evaluationData = useMyStore(
        (store) => store.evaluations.filter((evaluation) => (evaluation.personaId ? evaluation.personaId === personaId : evaluation.personaDescription === description)),
        shallow
    );
    const activeIssueCount = evaluationData.filter(issue => issue.resolutionStatus !== 'resolved').length;
    return (
        <div className={`p-2 px-3 flex flex-col cursor-pointer relative ${isSelected ? "" : ""}`}
            role="button" tabIndex={0} aria-label={`${accountRole === 'reviewer' ? 'Evaluate persona' : 'Select persona'}: ${description}`} aria-pressed={isSelected || false}
            onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); toggleFunction(idx); } }}
            onClick={() => { toggleFunction(idx) }}
            onMouseOut={() => setIsHover(false)}>
            <button type="button" className="persona-delete-button" disabled={deleting} aria-label={`Delete persona: ${description}`} title="Delete persona" onClick={async event => {
                event.stopPropagation(); setDeleting(true); setDeleteError('');
                try { if (!await deletePersona(personaId)) setDeleteError('Could not delete. Retry from save status.'); }
                catch { setDeleteError('Could not delete this persona.'); }
                finally { setDeleting(false); }
            }}>×</button>
            {deleteError && <span role="alert">{deleteError}</span>}
            <img
                src={imgUrl} alt="persona lego" width={50} style={{ objectFit: "contain" }} onMouseEnter={() => setIsHover(true)} />
            {
                (isHover) &&
                <div className={`absolute ${alignLeft ? "left-0" : "right-0"} ${openAbove ? "bottom-full" : "bottom-0 transform translate-y-full"} persona-label-tooltip bg-white rounded-lg border border-1 text-xs`}>{description}</div>
            }
            {
                showEvaluation &&
                <div className={`${alignLeft ? "left-0" : "right-0"} absolute ${openAbove ? "bottom-full" : "bottom-0 transform translate-y-[100%]"} w-[420px] bg-white p-2 border border-gray-200 rounded-lg shadow-lg`}>
                    <div className="flex items-center mb-1">
                        <div className="text-xs font-semibold text-gray-600">{activeIssueCount ? "Persona Evaluation" : "Review history"}</div>
                        <div className="ml-auto text-xs text-gray-500">
                            {evaluationData.length > 0 ? `${currentEvalIndex + 1} / ${evaluationData.length}` : "0 / 0"}
                        </div>
                    </div>
                    {evaluationData.length > 0 && (
                        <>
                            {evaluationData.length > 1 && (
                                <div className="mb-1 flex items-center justify-between">
                                    <button
                                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setCurrentEvalIndex((prev) => (prev - 1 + evaluationData.length) % evaluationData.length);
                                        }}
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setCurrentEvalIndex((prev) => (prev + 1) % evaluationData.length);
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                            <EvaluationBox role={accountRole} evaluationData={evaluationData[Math.min(currentEvalIndex, evaluationData.length - 1)]} />
                        </>
                    )}
                </div>
            }
            {accountRole === 'reviewer' && <span className="brick-evaluate-cue persona-evaluate-cue" aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z" /></svg>
                Evaluate
            </span>}
            {activeIssueCount === 0 && evaluationData.length > 0 && <button type="button" className="text-xs text-gray-500 underline" onClick={event => { event.stopPropagation(); setCurrentEvalIndex(0); setShowEvaluation(!showEvaluation); }}>History</button>}
            {
                activeIssueCount > 0 && (
                    <button
                        className="ml-1 absolute top-0 right-0 cursor-pointer w-7 h-7 flex items-center justify-center hover:scale-105 transition-transform duration-150"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentEvalIndex(0);
                            setShowEvaluation(!showEvaluation);
                        }}
                        title={`${activeIssueCount} active issues${evaluationData.length > activeIssueCount ? "; review history available" : ""}`}
                        aria-label="View persona concerns"
                    >
                        <svg className={`w-7 h-7 drop-shadow-sm ${activeIssueCount ? "animate-pulse" : ""}`} viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                            <path d="M27 0H3C1.35 0 0 1.35 0 3V30L6 24H27C28.65 24 30 22.65 30 21V3C30 1.35 28.65 0 27 0Z" fill={activeIssueCount ? "#fca5a5" : "#cbd5e1"} />
                            <text x="50%" y="48%" className="text-sm font-bold" textAnchor="middle" fill="#111827" dominantBaseline="central">{activeIssueCount}</text>
                        </svg>
                    </button>
                )
            }
        </div>
    );
}

export default PersonaIcon;
