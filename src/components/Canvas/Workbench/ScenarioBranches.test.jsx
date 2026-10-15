import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import ScenarioBranches from './ScenarioBranches';
import {branchPlaybackRun,tracePlanOrder} from '../../../utils/workbench';
const run={uid:'root',personaSnapshot:{description:'Applicant'},result:{steps:[{observation:'I submit my resume.',action:'I wait.',response:'I receive a result.'}],stageTrace:[{cardId:'data',stakeholderExperience:'Shared data experience'},{cardId:'deploy',stakeholderExperience:'Shared decision experience'}],branches:[{id:'review',title:'Ask for review',choice:'I could ask for review.',afterStep:1,steps:[{observation:'I read the reasons.',action:'I request reconsideration.',response:'I do not know what happens next.'}],outcome:'I may need more time.',visits:[{cardId:'deploy',stakeholderExperience:'I want to explain my skills.'}],assumptions:[],unknowns:['Review time']},{id:'leave',title:'Apply elsewhere',choice:'I could move on.',afterStep:1,steps:[],outcome:'I try another job.',visits:[{cardId:'deploy',stakeholderExperience:'I use my time elsewhere.'}],assumptions:[],unknowns:[]}]}};
it('shows a shared encounter and selected first-person continuation',()=>{
 const choose=jest.fn();const view=render(<ScenarioBranches run={run} selected={null} onSelect={choose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Ask for review'}));expect(choose).toHaveBeenCalledWith('review');
 view.rerender(<ScenarioBranches run={run} selected="review" onSelect={choose}/>);
 expect(screen.getByText(/I submit my resume/)).toBeInTheDocument();expect(screen.getByText(/I request reconsideration/)).toBeInTheDocument();expect(screen.getByText('I try another job.')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Ask for review'})).toHaveAttribute('aria-pressed','true');
});
it('retains the common canvas prefix and gives each branch independent publication IDs',()=>{
 const played=branchPlaybackRun(run,'review');expect(played.result.stageTrace.map(e=>e.stakeholderExperience)).toEqual(['Shared data experience','I want to explain my skills.']);expect(played.uid).toBe('root-branch-review');expect(run.result.stageTrace[1].stakeholderExperience).toBe('Shared decision experience');expect(branchPlaybackRun(run,null)).toBe(run);
});
it('follows connections once through a feedback cycle',()=>{
 expect(tracePlanOrder([{uid:'p',stage:'problem'},{uid:'d',stage:'data'},{uid:'t',stage:'task'}],[{start:'p',end:'d'},{start:'d',end:'t'},{start:'t',end:'p'}]).map(c=>c.uid)).toEqual(['p','d','t']);
});
