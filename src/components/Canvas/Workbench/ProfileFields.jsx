import React, { useId } from 'react';
import { normalizeProfile } from '../../../utils/workbench';

const fieldGuidance = {
  relationship: { label: 'Relationship to the system', help: 'How does this person use the system or experience its effects? They do not need to be a direct user.', example: 'An applicant whose resume is screened before a recruiter sees it.' },
  goal: { label: 'Goal', help: 'What is this person trying to achieve in this situation?', example: 'Get an interview for a job that matches their experience.' },
  circumstances: { label: 'Everyday situation', help: 'Describe the context that could shape their experience, such as their experience, available time, or resources.', example: 'Returning to work after a career break and applying while caring for a family member.' },
  knowledge: { label: 'What they know', help: 'What do they know about the system or process? This helps the walkthrough avoid assuming insider knowledge.', example: 'Knows the job requirements, but not how the automated screening works.' },
  constraints: { label: 'Specific limitations', help: 'Add a restriction that matters beyond the everyday situation. Leave blank if there is nothing to add.', example: 'Can only use a phone to submit an application or request a review.' },
  assumptions: { label: 'Assumptions to check', help: 'What are you taking for granted about this person that research should confirm?', example: 'We assume they would ask for an explanation after being rejected.' },
  unknowns: { label: 'Open questions', help: 'What do you still need to learn about this person’s experience?', example: 'Would they notice or understand the option to request a review?' },
};
const mainFields = ['relationship', 'goal', 'circumstances', 'knowledge'];
const extraFields = ['constraints', 'assumptions', 'unknowns'];

export default function ProfileFields({ value, onChange, disabled = false }) {
  const profile = normalizeProfile(value);
  const fieldId = useId();
  const renderField = key => {
    const { label, help, example } = fieldGuidance[key];
    return <div className="workbench-profile-field" key={key}>
      <label htmlFor={`${fieldId}-${key}`}>{label}{extraFields.includes(key) && <span className="persona-optional"> (optional)</span>}</label>
      <p id={`${fieldId}-${key}-help`} className="workbench-field-help">{help}</p>
      <textarea id={`${fieldId}-${key}`} aria-describedby={`${fieldId}-${key}-help`} rows={2} disabled={disabled} placeholder={`e.g., ${example}`} value={profile[key]} onChange={e => onChange({ ...profile, [key]: e.target.value, provenance: { ...profile.provenance, [key]: 'designer' } })}/>
    </div>;
  };
  const sourceNotes = <label>Research or observations supporting this persona (optional)<textarea rows={3} disabled={disabled} placeholder="Research excerpts, observations, or references. Leave empty for a fictional profile." value={profile.evidence} onChange={e => onChange({ ...profile, evidence: e.target.value })}/></label>;
  return <div className="workbench-profile">
    <p className="workbench-hint">Start with a few useful details. AI-generated profiles are suggestions to review.</p>
    {mainFields.map(renderField)}
    {extraFields.map(renderField)}
    <div className="persona-research-notes">{sourceNotes}</div>
  </div>;
}
