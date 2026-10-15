import React from 'react';
import useMyStore from '../../../contexts/projectContext';
import useSessionState from '../../../utils/useSessionState';
import ClassicPersonaEvaluation from './ClassicPersonaEvaluation';
import ScenarioWorkbench from '../Workbench/ScenarioWorkbench';

export default function PersonaEvaluation(props) {
  const playback = useMyStore(s => s.scenarioPlayback);
  const projectId = useMyStore(s => s.projectId);
  const [model, setModel] = useSessionState(`persona-evaluation-model-${projectId}`, 'gpt-6.1-sol');
  const [mode, setMode] = useSessionState(`persona-evaluation-mode-${projectId}`, 'workbench');
  const renderHeader = disabled => <div className="persona-evaluation-heading">
    <h2>Persona evaluation</h2>
    <label className="persona-mode-control"><input type="checkbox" disabled={disabled} checked={mode === 'workbench'} onChange={e => setMode(e.target.checked ? 'workbench' : 'classic')}/><span>Scenario workbench</span></label>
    <label className="persona-model-switch"><span>GPT-4</span><input type="checkbox" role="switch" aria-label="Use GPT-6.1 Sol" disabled={disabled} checked={model === 'gpt-6.1-sol'} onChange={e => setModel(e.target.checked ? 'gpt-6.1-sol' : 'gpt-4')}/><span>GPT-6.1 Sol</span></label>
    <button className="persona-evaluation-close" aria-label="Close persona evaluation" onClick={() => props.setIsExpanded(false)}>×</button>
  </div>;
  if (mode === 'classic') return <ClassicPersonaEvaluation {...props} model={model} renderHeader={renderHeader}/>;
  const persona = props.selectedPersona[0];
  return <>
    {props.isExpanded && <aside className={`expandable-panel expanded workbench-panel ${playback ? 'trace-panel-away' : ''} ${props.side === 'left' ? 'evaluation-left' : ''}`} aria-label="Stakeholder scenario workbench">
      <ScenarioWorkbench key={`${projectId}-${persona?.uid || 'none'}`} persona={persona} model={model} cardsData={props.cardsData} renderHeader={renderHeader} role={props.role}/>
    </aside>}
    {props.showLauncher !== false && !props.isExpanded && <button className={`round-button toolbox-action toolbox-persona ${props.side === 'left' ? 'evaluation-left' : ''} bg-violet-950 text-white z-10`} onClick={() => props.setIsExpanded(true)}>Persona</button>}
  </>;
}
