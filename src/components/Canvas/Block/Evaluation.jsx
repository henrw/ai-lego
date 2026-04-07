import React from "react";

export default function EvaluationBox({ evaluationData }) {
    const { by, problem, type, stakeholder, impact, open } = evaluationData;
    return (
        <div className="flex items-start mb-2">
            <div className="flex flex-col w-full leading-1.5">
                <div className="relative text-sm font-normal bg-white p-2">
                    {type !== "persona" && (
                        <div className="flex flex-row items-center">
                            <img className="w-8 h-8 rounded-full" src="/profile-pic.png" alt="Jese" />
                            <span className="ml-2">{by}</span>
                            <span className="text-gray-500 ml-auto">{type}-wise</span>
                        </div>
                    )}
                    {type === "problem" && (
                        <div>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">Problem: {problem}</p>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">Stakeholders: {stakeholder}</p>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">Impact: {impact}</p>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">Open-ended Comment: {open}</p>
                        </div>
                    )}
                    {(type === "stage" || type === "persona") && (
                        <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">{problem}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
