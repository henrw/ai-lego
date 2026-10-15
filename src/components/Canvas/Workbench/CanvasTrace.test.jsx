import React from 'react';
import { render, screen } from '@testing-library/react';
import CanvasTrace from './CanvasTrace';
import useMyStore from '../../../contexts/projectContext';
jest.mock('../../../contexts/projectContext',()=>{
 const state={scenarioPlayback:null};const hook=selector=>selector(state);hook.getState=()=>state;return {__esModule:true,default:hook};
});
it('keeps the same avatar element between stages so CSS movement can animate',()=>{
 const cards=[{uid:'one',stage:'problem',position:{x:0,y:0}},{uid:'two',stage:'task',position:{x:320,y:0}}];
 const state=useMyStore.getState();
 state.scenarioPlayback={runId:'live',index:0,entries:[{cardId:'one',comment:''},{cardId:'two',comment:'Check access'}],persona:{description:'Applicant'},generating:true,onStop:jest.fn(),onClear:jest.fn()};
 const view=render(<CanvasTrace cards={cards}/>);
 const avatar=screen.getByRole('img',{name:'Applicant'});const traveler=avatar.parentElement;
 expect(screen.getByText('Examining this stage…')).toBeInTheDocument();
 state.scenarioPlayback={...state.scenarioPlayback,index:1};view.rerender(<CanvasTrace cards={cards}/>);
 expect(screen.getByRole('img',{name:'Applicant'})).toBe(avatar);
 expect(avatar.parentElement).toBe(traveler);
 expect(traveler.style.visibility).toBe('visible');
 const x = Number.parseFloat(traveler.style.left), y = Number.parseFloat(traveler.style.top);
 expect(x >= 578 || x + 290 <= 310 || y >= 288 || y + 140 <= 150).toBe(true);
 expect(screen.getByText('Check access')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Stop generation'})).toBeInTheDocument();
});
