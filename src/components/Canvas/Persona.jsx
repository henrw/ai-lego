import React, { useState } from 'react';
import useMyStore from "../../contexts/projectContext";
import EvaluationBox from "./Card/Evaluation";
import { shallow } from "zustand/shallow";

function PersonaIcon({ imgUrl, description, isSelected, toggleFunction, idx }) {
    const [isHover, setIsHover] = useState(false);
    const [showEvaluation, setShowEvaluation] = useState(false);
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
                <div className={`absolute right-0 bottom-0 transform translate-y-full bg-white ml-2 rounded-lg p-2 w-[300px] border border-1`}>{description}</div>
            }
            {
                showEvaluation &&
                <div className='right-0 bottom-0 absolute transform translate-y-[100%] w-[400px] bg-white p-2 border border-1'>
                    {(evaluationData.map((evaluation, idx) => (<>
                        <EvaluationBox evaluationData={evaluation} />
                        {idx !== evaluationData.length-1 && <div className='border-b-0.5 border'></div>} 
                    </>
                    )))}
                </div>
            }
            {
                (evaluationData.length) !== 0 && (
                    <button className="ml-1 text-white absolute top-0 right-0"
                        onClick={(e) => { e.stopPropagation(); setShowEvaluation(!showEvaluation); }}>
                        <svg className="w-7 h-7" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="5%" y="5%" width="26" height="21" fill="#fca5a5"></rect>
                            <path d="M27 0H3C1.35 0 0 1.35 0 3V30L6 24H27C28.65 24 30 22.65 30 21V3C30 1.35 28.65 0 27 0ZM27 21H4.8L3 22.8V3H27V21Z" fill="#fca5a5" stroke="" strokeWidth="1" />
                            <text x="50%" y="48%" className="text-sm font-bold" textAnchor="middle" fill="black" dominantBaseline="central">{evaluationData.length}</text>
                        </svg>
                    </button>
                )
            }
        </div>
    );
}

export default PersonaIcon;