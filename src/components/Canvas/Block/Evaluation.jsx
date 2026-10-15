import React from "react";
import useMyStore from "../../../contexts/projectContext";

import IssueResolution from "./IssueResolution";
import { profileAvatar, roleLabel } from "../../../utils/avatar";
import StageNote from '../Workbench/StageNote';
import RunDetails from '../Workbench/RunDetails';
import ScenarioReview from '../Workbench/ScenarioReview';

export default function EvaluationBox({ evaluationData, role, showHistory = true }) {
    const { author, by, problem, type, stakeholder, impact, open } = evaluationData;
    const persona = useMyStore(store => store.personas?.find(p => p.uid === evaluationData.personaId || (!evaluationData.personaId && p.description === evaluationData.personaDescription)));
    const snapshot = evaluationData.stageTrace?.personaSnapshot || evaluationData.workbench?.personaSnapshot;
    const personaLabel = snapshot?.description || evaluationData.personaDescription || persona?.description;
    const personaImage = snapshot?.imgUrl || persona?.imgUrl || 'https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%205.png?alt=media';
    const experience = evaluationData.stageTrace?.entry.stakeholderExperience || problem;
    const displayedExperience = type === 'persona' ? `“${experience?.trim().replace(/^[“"]|[”"]$/g, '') || ''}”` : experience;
    const authorName = author?.name || by || 'Anonymous';
    const authorLabel = `${authorName}${author?.occupation ? ` · ${roleLabel(author.occupation)}` : ''}`;
    const identityPictures = <span className="evaluation-inline-identities">
        <span className="evaluation-profile-picture" tabIndex={0} aria-label={`Registered by ${authorLabel}`}><img src={profileAvatar(author, author?.uid || authorName)} alt=""/><span className="evaluation-profile-tooltip" role="tooltip">{authorLabel}</span></span>
        {type === 'persona' && personaLabel && <span className="evaluation-profile-picture evaluation-persona-picture" tabIndex={0} aria-label={`Simulated stakeholder: ${personaLabel}`}><img src={personaImage} alt=""/><span className="evaluation-profile-tooltip" role="tooltip">Simulated stakeholder: {personaLabel}</span></span>}
    </span>;
    if (evaluationData.resolutionStatus === "resolved") return <IssueResolution showHistory={showHistory} issue={evaluationData} role={role}/>;
    return (
        <div className="flex items-start mb-2">
            <div className="flex flex-col w-full leading-1.5">
                <div className={`evaluation-card relative text-sm font-normal bg-white p-2 ${evaluationData.resolutionStatus === "resolved" ? "evaluation-card-resolved" : ""}`}>
                    {type === "problem" && (
                        <div>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">{identityPictures}Problem: {evaluationData.stageTrace?.entry.stakeholderExperience || problem}</p>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">Stakeholders: {stakeholder}</p>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">Impact: {impact}</p>
                            <p className="text-sm font-normal py-2.5 whitespace-pre-wrap">Open-ended Comment: {open}</p>
                        </div>
                    )}
                    {(type === "stage" || type === "persona") && (
                        <p className="evaluation-inline-comment">{identityPictures}{displayedExperience}</p>
                    )}
                    {evaluationData.workbench && <details className="scenario-workbench"><summary>Scenario, assumptions and evidence</summary><RunDetails run={evaluationData.workbench}/>{evaluationData.scenarioNotes && <p>Team notes: {evaluationData.scenarioNotes}</p>}<ScenarioReview issue={evaluationData} role={role}/></details>}
                    {evaluationData.stageTrace && <StageNote trace={evaluationData.stageTrace} hideStakeholder/>}
                    <IssueResolution showHistory={showHistory} issue={evaluationData} role={role}/>
                </div>
            </div>
        </div>
    );
}
