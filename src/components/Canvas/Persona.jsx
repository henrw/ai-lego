import React, { useState } from 'react';
import useMyStore from "../../contexts/projectContext";
import EvaluationBox from "./Card/Evaluation";
import { shallow } from "zustand/shallow";

function PersonaIcon({ imgUrl, description, isSelected, toggleFunction, idx }) {
    const [isHover, setIsHover] = useState(false);
    const [showEvaluation, setShowEvaluation] = useState(false);
    const [currentEvalIndex, setCurrentEvalIndex] = useState(0);
    const evaluationData = useMyStore(
        (store) => store.evaluations.filter((evaluation) => (evaluation.personaDescription === description)), // TODO filter the card-matched evaluations only
        shallow
    );
    return (
        <div className={`p-2 px-3 flex flex-col cursor-pointer relative ${isSelected ? "" : ""}`}
            onClick={() => { toggleFunction(idx) }}
            onMouseOut={() => setIsHover(false)}>
            <img
                src={imgUrl} alt="persona lego" width={50} style={{ "object-fit": "contain" }} className="" onMouseEnter={() => setIsHover(true)} />
            {
                (isHover) &&
                <div className={`absolute right-0 bottom-0 transform translate-y-full bg-white ml-2 rounded-lg p-2 w-[300px] border border-1 text-xs`}>{description}</div>
            }
            {
                showEvaluation &&
                <div className="right-0 bottom-0 absolute transform translate-y-[100%] w-[420px] bg-white p-2 border border-gray-200 rounded-lg shadow-lg">
                    <div className="flex items-center mb-1">
                        <div className="text-xs font-semibold text-gray-600">Persona Evaluation</div>
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
                            <EvaluationBox evaluationData={evaluationData[currentEvalIndex]} />
                        </>
                    )}
                </div>
            }
            {
                (evaluationData.length) !== 0 && (
                    <button
                        className="ml-1 absolute top-0 right-0 cursor-pointer w-7 h-7 flex items-center justify-center hover:scale-105 transition-transform duration-150"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentEvalIndex(0);
                            setShowEvaluation(!showEvaluation);
                        }}
                        title="View persona concerns"
                        aria-label="View persona concerns"
                    >
                        <svg className="w-7 h-7 drop-shadow-sm animate-pulse" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                            <path d="M27 0H3C1.35 0 0 1.35 0 3V30L6 24H27C28.65 24 30 22.65 30 21V3C30 1.35 28.65 0 27 0Z" fill="#fca5a5" />
                            <text x="50%" y="48%" className="text-sm font-bold" textAnchor="middle" fill="#111827" dominantBaseline="central">{evaluationData.length}</text>
                        </svg>
                    </button>
                )
            }
        </div>
    );
}

export default PersonaIcon;
