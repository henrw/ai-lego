import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PersonaEvaluation from '../Evaluation/PersonaEvaluation';
import useMyStore from '../../../contexts/projectContext';
import { emptyProfile, coverageStatus } from '../../../utils/workbench';
jest.mock('../../../authentication/UserAuthContext', () => ({ useUserAuth: () => ({ user: null }) }));
jest.mock('../../../contexts/projectContext', () => {
  const state = { projectId:'workbench-test', personas:[], evaluations:[], addEvaluation:jest.fn(), addPersona:jest.fn(), reviewScenario:jest.fn() };
  const hook = selector => selector(state); hook.getState = () => state; hook.setState=jest.fn();
  return { __esModule:true, default:hook };
});
const persona = { uid:'applicant', description:'Applicant returning after a career break', profile:emptyProfile() };
const plan = [{uid:'data',stage:'data',description:'Historical decisions'}];
const props = { isExpanded:true, setIsExpanded:jest.fn(), selectedPersona:[persona], cardsData:plan };
const output = () => ({result:{ steps:[{observation:'Receives result',action:'Asks for review',response:'Not specified',assumption:'May seek review'}],concern:{title:'Potential exclusion',mechanism:'Historical patterns may persist',blockIds:['data'],planEvidence:[{cardId:'data',quote:'Historical decisions'}],assumptions:['Past bias'],unknowns:['Error rate'],validation:'Audit cases',mitigation:'Review labels'},alternatives:[{title:'Appeal',description:'Requests review'},{title:'Leave',description:'Moves on'}],comparison:null },model:'fixture',promptVersion:'v1'});
const explore = async () => {
  fireEvent.click(screen.getByRole('button',{name:'Generate journey'}));
  await screen.findByText('Before, Outcome, and After are ready. Select a moment to inspect or save its result.');
};
beforeEach(() => { sessionStorage.clear(); jest.clearAllMocks(); useMyStore.getState().personas=[persona]; useMyStore.getState().evaluations=[]; global.fetch=jest.fn(async()=>({ok:true,json:async()=>output()})); useMyStore.getState().addEvaluation.mockResolvedValue(true); });
afterEach(() => { delete global.fetch; });
it('defaults to the workbench and preserves classic as an optional mode',()=>{
  render(<PersonaEvaluation {...props}/>);
  expect(screen.queryByLabelText('Perspective')).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Generate journey'})).toBeEnabled();
  fireEvent.click(screen.getByRole('checkbox',{name:'Scenario workbench'}));
  expect(screen.getByRole('button',{name:"Simulate persona's feeling"})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox',{name:'Scenario workbench'}));
  expect(screen.queryByLabelText('Information visible to the stakeholder')).not.toBeInTheDocument();
});
it('retains the generation snapshot, editable concern and stable ID on save retry',async()=>{
  const save=useMyStore.getState().addEvaluation; save.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const {rerender}=render(<PersonaEvaluation {...props}/>); await explore();
  fireEvent.change(screen.getByLabelText('Issue to save (editable)'),{target:{value:'Reviewed concern'}});
  rerender(<PersonaEvaluation {...props} cardsData={[{...plan[0],description:'New labels'}]}/>);
  fireEvent.click(screen.getByRole('button',{name:'Save scenario and concern'}));
  await screen.findByText(/Could not save this scenario/);
  fireEvent.click(screen.getByRole('button',{name:'Save scenario and concern'}));
  await screen.findByRole('button',{name:'Scenario saved'});
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[0][2].uid).toBe(save.mock.calls[1][2].uid);
  expect(save.mock.calls[1][1]).toEqual(['data']);
  expect(save.mock.calls[1][2]).toMatchObject({problem:'Reviewed concern',workbench:{planSnapshot:plan}});
});
it('replays frozen persona and scenario after form edits, against the revised plan',async()=>{
  const {rerender}=render(<PersonaEvaluation {...props}/>); await explore();
  const original=JSON.parse(global.fetch.mock.calls[2][1].body);
  expect(original.scenario.mode).toBe('walkthrough');
  fireEvent.click(screen.getByRole('button', { name: 'Regenerate…' }));
  fireEvent.change(screen.getByLabelText('Specific situation to explore (optional)'),{target:{value:'Different situation'}});
  fireEvent.change(screen.getByLabelText('Goal'),{target:{value:'Different goal'}});
  rerender(<PersonaEvaluation {...props} cardsData={[{...plan[0],description:'Review historical decisions'}]}/>);
  await act(async()=>{ fireEvent.click(screen.getByRole('button',{name:'Replay with current plan'})); });
  await waitFor(()=>expect(global.fetch).toHaveBeenCalledTimes(4));
  const replay=JSON.parse(global.fetch.mock.calls[3][1].body);
  expect(replay.persona).toEqual(original.persona);expect(replay.scenario).toEqual(original.scenario);
  expect(replay.cardsData[0].description).toBe('Review historical decisions');expect(replay.previous.planSnapshot).toEqual(plan);
  await waitFor(()=>expect(screen.getByRole('button',{name:'Regenerate…'})).toBeEnabled());
});
it('restores an unsaved result after refresh and aborts when switching personas',async()=>{
  const first=render(<PersonaEvaluation {...props}/>);await explore();first.unmount();
  const second=render(<PersonaEvaluation {...props}/>);expect(screen.getByLabelText('Issue to save (editable)').value).toContain('Potential exclusion');
  fireEvent.click(screen.getByRole('button', { name: 'Regenerate…' }));
  let signal; global.fetch.mockImplementation((url,options)=>{signal=options.signal;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('Aborted'))));});
  fireEvent.click(screen.getByRole('button',{name:'Generate journey'}));
  await act(async()=>{ second.rerender(<PersonaEvaluation {...props} selectedPersona={[{...persona,uid:'other'}]}/>); });
  expect(signal.aborted).toBe(true);expect(screen.queryByText('Potential exclusion')).not.toBeInTheDocument();
});
it('keeps coverage separate from resolution approval and requires recorded evidence',()=>{
  const e={personaId:'p',workbench:{scenario:{id:'s'}},resolutionStatus:'resolved'};
  expect(coverageStatus([e],'p','s')).toBe('Scenario saved');
  expect(coverageStatus([{...e,scenarioReview:{status:'evidence',evidence:''}}],'p','s')).toBe('Scenario saved');
  expect(coverageStatus([{...e,scenarioReview:{status:'evidence',evidence:'Interview excerpt'}}],'p','s')).toBe('Evidence recorded');
});
it('selects a temporal focus, shows saved counts and preserves optional input',()=>{
  useMyStore.getState().evaluations=[{uid:'saved',personaId:persona.uid,workbench:{planSnapshot:plan,scenario:{id:'outcome',title:'Outcome'}},scenarioReview:{status:'reviewed'}}];
  render(<PersonaEvaluation {...props}/>);
  const outcome=screen.getByRole('button',{name:/^Outcome/});
  expect(outcome).toHaveTextContent('1 saved');
  fireEvent.click(outcome);
  expect(outcome).toHaveAttribute('aria-pressed','true');
  expect(screen.getByText('What happens when this person receives or experiences the result?')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Generate journey'})).toBeEnabled();
  fireEvent.change(screen.getByLabelText('Specific situation to explore (optional)'),{target:{value:'A specific rejection'}});
  fireEvent.click(screen.getByRole('button',{name:/^After/}));
  expect(screen.getByLabelText('Specific situation to explore (optional)')).toHaveValue('A specific rejection');
});

it('requests every stage, retains parsed trace and renders playback controls',async()=>{
  const response=output();response.result.stageTrace=[{cardId:'data',status:'no_additional_concern',stakeholderExperience:'An outcome is received',analysis:'Historical decisions examined',comment:'No additional concern identified',relatedBlockIds:[],planEvidence:[],assumptions:[],unknowns:[],validation:'Review actual outcomes'}];
  global.fetch.mockResolvedValue({ok:true,json:async()=>response});
  render(<PersonaEvaluation {...props}/>);
  fireEvent.click(screen.getByRole('button', { name: /Lifecycle impacts Every/ }));
  fireEvent.click(screen.getByRole('button',{name:'Run lifecycle trace'}));
  await screen.findByText('Potential exclusion');
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).scenario.stageScope).toBe('all');
  fireEvent.click(screen.getByRole('button',{name:'Save scenario and concern'}));
  await screen.findByRole('button',{name:'Scenario saved'});
  expect(useMyStore.getState().addEvaluation.mock.calls[0][2].workbench.result.stageTrace).toEqual(response.result.stageTrace);
});
it('hands off to the canvas immediately and displays partial comments before verification',async()=>{
 const util=require('util');global.TextDecoder=util.TextDecoder;
 let push; const chunks=[];let waiter;
 const reader={read:jest.fn(()=>new Promise(resolve=>{if(chunks.length)resolve(chunks.shift());else waiter=resolve;})),releaseLock:jest.fn()};
 push=event=>{const chunk=event?{value:Buffer.from(JSON.stringify(event)+'\n'),done:false}:{done:true};if(waiter){const resolve=waiter;waiter=null;resolve(chunk);}else chunks.push(chunk);};
 global.fetch.mockResolvedValue({ok:true,json:async()=>output()}).mockResolvedValueOnce({ok:true,headers:{get:()=> 'application/x-ndjson'},body:{getReader:()=>reader}});
 render(<PersonaEvaluation {...props}/>);
 fireEvent.click(screen.getByRole('button', { name: /Lifecycle impacts Every/ }));
  fireEvent.click(screen.getByRole('button',{name:'Run lifecycle trace'}));
 expect(useMyStore.setState).toHaveBeenLastCalledWith({scenarioPlayback:expect.objectContaining({generating:true,index:0,entries:[expect.objectContaining({cardId:'data',comment:''})]})});
 await act(async()=>{push({type:'progress',entries:[{cardId:'data',comment:'Historical labels may',pending:true}]});});
 expect(useMyStore.setState).toHaveBeenLastCalledWith({scenarioPlayback:expect.objectContaining({entries:[expect.objectContaining({comment:'Historical labels may'})]})});
 await act(async()=>{push({type:'complete',...output()});push(null);});
 await screen.findByText('Potential exclusion');
 expect(useMyStore.setState).toHaveBeenLastCalledWith({scenarioPlayback:null});
 expect(useMyStore.getState().addEvaluation).not.toHaveBeenCalled();
});
it('requests branching and preserves both alternatives and the selected path on save',async()=>{
 const data=output();data.result.branches=['review','leave'].map(id=>({id,title:id,choice:`I could ${id}`,afterStep:1,steps:[{observation:'I read my result',action:`I ${id}`,response:'I do not know what happens next',assumption:''}],outcome:'I may need time',visits:[{cardId:'data',stakeholderExperience:`I choose ${id}`}],assumptions:[],unknowns:[]}));
 global.fetch.mockResolvedValue({ok:true,json:async()=>data});
 const view=render(<PersonaEvaluation {...props}/>);await explore();
 expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({branching:true,links:[]});
 fireEvent.click(screen.getByRole('button',{name:'review',exact:true}));expect(screen.getByText('I could review')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Save scenario and concern'}));await screen.findByRole('button',{name:'Scenario saved'});
 expect(useMyStore.getState().addEvaluation.mock.calls[0][2].workbench).toMatchObject({selectedBranchId:'review',linksSnapshot:[],result:{branches:data.result.branches}});
 view.unmount();render(<PersonaEvaluation {...props}/>);expect(screen.getByRole('button',{name:'review',exact:true})).toHaveAttribute('aria-pressed','true');
});
it('keeps branch playback stable when the parent rerenders for canvas updates',async()=>{
 const data=output();data.result.stageTrace=[{cardId:'data',status:'concern',stakeholderExperience:'I want my skills considered',analysis:'Labels matter',relatedBlockIds:[],planEvidence:[{cardId:'data',quote:'Historical decisions'}],assumptions:[],unknowns:[],validation:'Check errors'}];
 data.result.branches=['review','leave'].map(id=>({id,title:id,choice:`I could ${id}`,afterStep:1,steps:[{observation:'I read my result',action:`I ${id}`,response:'I do not know what happens next',assumption:''}],outcome:'I may need time',visits:[{cardId:'data',stakeholderExperience:`I choose ${id}`}],assumptions:[],unknowns:[]}));
 global.fetch.mockResolvedValue({ok:true,json:async()=>data});
 const view=render(<PersonaEvaluation {...props}/>);await explore();
 fireEvent.click(screen.getByRole('button',{name:'review',exact:true}));
 fireEvent.click(screen.getByRole('button',{name:'Play trace',exact:true}));
 const writes=useMyStore.setState.mock.calls.length;
 view.rerender(<PersonaEvaluation {...props}/>);
 expect(useMyStore.setState.mock.calls).toHaveLength(writes);
 expect(useMyStore.setState).toHaveBeenLastCalledWith({scenarioPlayback:expect.objectContaining({index:0,entries:[expect.objectContaining({stakeholderExperience:'I choose review'})]})});
});

it('explores all three moments and retains drafts for timeline inspection and refresh', async () => {
  const view = render(<PersonaEvaluation {...props}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Generate journey' }));
  await screen.findByText('Before, Outcome, and After are ready. Select a moment to inspect or save its result.');
  expect(global.fetch).toHaveBeenCalledTimes(3);
  const inputs = global.fetch.mock.calls.map(([, options]) => JSON.parse(options.body));
  expect(inputs.map(input => input.scenario.id)).toEqual(['before', 'outcome', 'after']);
  expect(inputs.every(input => JSON.stringify(input.cardsData) === JSON.stringify(inputs[0].cardsData))).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /Before Draft ready/ }));
  expect(screen.getByRole('heading', { name: 'Scenario result · Before' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Issue to save (editable)'), { target: { value: 'Edited before concern' } });
  fireEvent.click(screen.getByRole('button', { name: /Outcome Draft ready/ }));
  fireEvent.click(screen.getByRole('button', { name: /Before Draft ready/ }));
  expect(screen.getByLabelText('Issue to save (editable)')).toHaveValue('Edited before concern');
  view.unmount();
  render(<PersonaEvaluation {...props}/>);
  fireEvent.click(screen.getByRole('button', { name: /After Draft ready/ }));
  expect(screen.getByRole('heading', { name: 'Scenario result · After' })).toBeInTheDocument();
});
it('stops a journey after failure while retaining completed moments', async () => {
  global.fetch.mockResolvedValueOnce({ ok: true, json: async () => output() }).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Try again later' }) });
  render(<PersonaEvaluation {...props}/>);
  fireEvent.click(screen.getByRole('button', { name: 'Generate journey' }));
  await screen.findByRole('alert');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(screen.getByRole('button', { name: /Before Draft ready/ })).toBeEnabled();
  expect(screen.getByRole('heading', { name: 'Scenario result · Before' })).toBeInTheDocument();
});
it('sends the selected model and keeps it when switching evaluation modes', async () => {
  render(<PersonaEvaluation {...props}/>);
  expect(screen.getByRole('switch', { name: 'Use GPT-6.1 Sol' })).toBeChecked();
  fireEvent.click(screen.getByRole('switch', { name: 'Use GPT-6.1 Sol' }));
  await explore();
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).model).toBe('gpt-4');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Scenario workbench' }));
  expect(screen.getByRole('switch', { name: 'Use GPT-6.1 Sol' })).not.toBeChecked();
});

it('hides generation settings on trigger and reveals retained inputs through regenerate', async () => {
  render(<PersonaEvaluation {...props}/>);
  fireEvent.change(screen.getByLabelText('Assumption to explore (optional)'), { target: { value: 'Limited time' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate journey' }));
  expect(screen.queryByLabelText('Specific situation to explore (optional)')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Run lifecycle trace' })).not.toBeInTheDocument();
  await screen.findByRole('button', { name: 'Regenerate…' });
  expect(screen.getByRole('group', { name: 'Moment in the stakeholder experience' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Regenerate…' }));
  expect(screen.getByLabelText('Assumption to explore (optional)')).toHaveValue('Limited time');
  expect(screen.getByRole('button', { name: 'Generate journey' })).toBeEnabled();
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

it('keeps lifecycle tracing separate from the three-moment journey', async () => {
  render(<PersonaEvaluation {...props}/>);
  expect(screen.queryByRole('checkbox', { name: 'Examine every stage' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Outcome Not explored/ }));
  fireEvent.click(screen.getByRole('button', { name: /Lifecycle impacts Every/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Run lifecycle trace' }));
  await screen.findByRole('button', { name: 'Regenerate…' });
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('group', { name: 'Moment in the stakeholder experience' })).not.toBeInTheDocument();
  expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({ scenario: { id: 'lifecycle-impacts', stageScope: 'all' }, stream: true, branching: false });
});

it('shows stage comments without journey paths for an existing lifecycle trace', async () => {
  const data = output();
  data.result.stageTrace = [{ cardId: 'data', status: 'no_additional_concern', stakeholderExperience: 'I wonder how my experience is represented.', analysis: 'Inspect labels', relatedBlockIds: [], planEvidence: [], assumptions: [], unknowns: [], validation: '' }];
  data.result.branches = ['review', 'leave'].map(id => ({ id, title: id, choice: `I could ${id}`, afterStep: 1, steps: [], outcome: 'Possible outcome', visits: [], assumptions: [], unknowns: [] }));
  global.fetch.mockResolvedValue({ ok: true, json: async () => data });
  render(<PersonaEvaluation {...props}/>);
  fireEvent.click(screen.getByRole('button', { name: /Lifecycle impacts Every/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Run lifecycle trace' }));
  await screen.findByRole('heading', { name: 'Lifecycle impacts' });
  expect(screen.queryByRole('region', { name: 'Branching stakeholder experiences' })).not.toBeInTheDocument();
  expect(screen.queryByText('Encounter 1')).not.toBeInTheDocument();
  expect(screen.getByText('I wonder how my experience is represented.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Play trace' })).toBeEnabled();
});

it('switches analysis views without generating and restores each draft', async () => {
  render(<PersonaEvaluation {...props}/>);
  await explore();
  fireEvent.click(screen.getByRole('button', { name: /Lifecycle impacts Every/ }));
  expect(screen.queryByRole('group', { name: 'Moment in the stakeholder experience' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Run lifecycle trace' })).toBeEnabled();
  expect(global.fetch).toHaveBeenCalledTimes(3);
  fireEvent.click(screen.getByRole('button', { name: /Stakeholder journey Before/ }));
  expect(screen.getByRole('heading', { name: 'Scenario result · After' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Regenerate…' })).toBeInTheDocument();
});
it('holds a previous stage while new streaming entries arrive and resumes following live', async () => {
  global.TextDecoder = require('util').TextDecoder;
  let waiter; const chunks = [];
  const push = event => { const chunk = { value: Buffer.from(JSON.stringify(event) + '\n'), done: false }; if (waiter) { const resolve = waiter; waiter = null; resolve(chunk); } else chunks.push(chunk); };
  const reader = { read: () => new Promise(resolve => { if (chunks.length) resolve(chunks.shift()); else waiter = resolve; }), releaseLock: jest.fn() };
  global.fetch.mockResolvedValue({ ok: true, headers: { get: () => 'application/x-ndjson' }, body: { getReader: () => reader } });
  const view = render(<PersonaEvaluation {...props} cardsData={[...plan, { uid: 'test', stage: 'test', description: 'Review errors' }]}/>);
  fireEvent.click(screen.getByRole('button', { name: /Lifecycle impacts Every/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Run lifecycle trace' }));
  await act(async () => push({ type: 'progress', entries: [{ cardId: 'data', stakeholderExperience: 'First' }, { cardId: 'test', stakeholderExperience: 'Second' }] }));
  const playback = () => useMyStore.setState.mock.calls.at(-1)[0].scenarioPlayback;
  expect(playback().index).toBe(1);
  act(() => playback().onPrevious());
  expect(playback().index).toBe(0);
  await act(async () => push({ type: 'progress', entries: [{ cardId: 'test', stakeholderExperience: 'Second updated' }] }));
  expect(playback().index).toBe(0);
  expect(playback().playing).toBe(false);
  expect(playback().entries[1].stakeholderExperience).toBe('Second updated');
  act(() => playback().onPlay());
  expect(playback().index).toBe(1);
  expect(playback().playing).toBe(true);
  view.unmount();
});
