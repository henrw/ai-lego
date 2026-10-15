import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import StageTrace from './StageTrace';
import useMyStore from '../../../contexts/projectContext';
jest.mock('../../../contexts/projectContext',()=>{
 const state={evaluations:[],addEvaluation:jest.fn()};
 const hook=selector=>selector(state);hook.getState=()=>state;hook.setState=jest.fn();return {__esModule:true,default:hook};
});
const entries=[{cardId:'data',status:'concern',stakeholderExperience:'Receives an outcome',analysis:'Labels may affect exclusion',comment:'Review historical labels',relatedBlockIds:['test'],planEvidence:[{cardId:'data',quote:'Historical labels'}],assumptions:['May reflect bias'],unknowns:['Error rates'],validation:'Audit labels'}, {cardId:'test',status:'no_additional_concern',stakeholderExperience:'Unknown',analysis:'No additional concern',comment:'Test specification examined',relatedBlockIds:[],planEvidence:[],assumptions:[],unknowns:[],validation:'Check test execution'}];
const run={uid:'run1',result:{stageTrace:entries},planSnapshot:[{uid:'data',stage:'data',description:'Historical labels'},{uid:'test',stage:'test',description:'Audit errors'}],personaSnapshot:{uid:'p',description:'Applicant',profile:{}},scenario:{id:'before',title:'Before'}};
beforeEach(()=>{jest.clearAllMocks();useMyStore.getState().evaluations=[];useMyStore.getState().addEvaluation.mockResolvedValue(true);});
it('plays and pauses stage visits, clears playback on unmount, and does not publish automatically',()=>{
 jest.useFakeTimers();const view=render(<StageTrace run={run} persona={{imgUrl:'image'}} author="Team"/>);
 fireEvent.click(screen.getByRole('button',{name:'Play trace'}));
 expect(useMyStore.setState).toHaveBeenLastCalledWith(expect.objectContaining({scenarioPlayback:expect.objectContaining({index:0})}));
 const clears = useMyStore.setState.mock.calls.filter(([value]) => value.scenarioPlayback === null).length;
 act(()=>jest.advanceTimersByTime(4500));
 expect(useMyStore.setState.mock.calls.filter(([value]) => value.scenarioPlayback === null)).toHaveLength(clears);
 expect(useMyStore.setState).toHaveBeenLastCalledWith(expect.objectContaining({scenarioPlayback:expect.objectContaining({index:1})}));
 fireEvent.click(screen.getByRole('button',{name:'Pause'}));
 expect(useMyStore.getState().addEvaluation).not.toHaveBeenCalled();view.unmount();
 expect(useMyStore.setState).toHaveBeenLastCalledWith({scenarioPlayback:null});jest.useRealTimers();
});
it('publishes selected stage concerns with frozen context and stable retry ids',async()=>{
 const save=useMyStore.getState().addEvaluation;save.mockResolvedValueOnce(false).mockResolvedValue(true);
 render(<StageTrace run={run} persona={{}} author="Team"/>);
 expect(screen.getAllByRole('checkbox')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'Publish selected stage comments'}));await screen.findByText(/could not be saved/);
 fireEvent.click(screen.getByRole('button',{name:'Publish selected stage comments'}));await screen.findByText(/1 stage comments published/);
 expect(save).toHaveBeenCalledTimes(2);
 expect(save.mock.calls[1]).toEqual(['Team',['data'],expect.objectContaining({uid:'trace-run1-data',problem:'Receives an outcome',stageTrace:expect.objectContaining({planSnapshot:run.planSnapshot,entry:entries[0]})})]);
});
it('shows and publishes the experience instead of a generic analyst comment',async()=>{
 const experience="I want my recent work to count, even with a career gap.";
 const updated={...run,result:{stageTrace:[{...entries[0],stakeholderExperience:experience,comment:'Task stage is clear, but potential bias not addressed'}]}};
 render(<StageTrace run={updated} persona={{}} author="Team"/>);
 expect(screen.getByText(experience)).toBeInTheDocument();
 expect(screen.queryByText('Task stage is clear, but potential bias not addressed')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Publish selected stage comments'}));await screen.findByText(/1 stage comments published/);
 expect(useMyStore.getState().addEvaluation.mock.calls[0][2].problem).toBe(experience);
});

it('publishes each stage comment only on its own block while retaining related context', async () => {
  const stageEntries = entries.map(entry => ({ ...entry, status: 'concern', relatedBlockIds: ['data', 'test'] }));
  render(<StageTrace run={{ ...run, result: { stageTrace: stageEntries } }} persona={{}} author="UX"/>);
  fireEvent.click(screen.getByRole('button', { name: 'Publish selected stage comments' }));
  await screen.findByText(/2 stage comments published/);
  expect(useMyStore.getState().addEvaluation.mock.calls.map(call => call[1])).toEqual([['data'], ['test']]);
  expect(useMyStore.getState().addEvaluation.mock.calls[0][2].stageTrace.entry.relatedBlockIds).toEqual(['data', 'test']);
});
