import { render, screen, fireEvent } from '@testing-library/react';
import PersonaIcon from './Persona';
import useMyStore from '../../../contexts/projectContext';
jest.mock('../Block/Evaluation',()=>({__esModule:true,default:({evaluationData})=><div>{evaluationData.problem}</div>}));
jest.mock('../../../contexts/projectContext',()=>{
 const state={evaluations:[]};const hook=selector=>selector(state);hook.getState=()=>state;
 return {__esModule:true,default:hook};
});
it('excludes approved persona issues from the badge without rendering a zero-count badge',()=>{
 const props={personaId:'persona',description:'Applicant',toggleFunction:jest.fn()};
 useMyStore.getState().evaluations=[{uid:'open',personaId:'persona',problem:'Open concern'},{uid:'old',personaId:'persona',problem:'Archived concern',resolutionStatus:'resolved'}];
 const {rerender}=render(<PersonaIcon {...props}/>);
 expect(screen.getByRole('button',{name:'View persona concerns'})).toHaveTextContent('1');
 useMyStore.getState().evaluations=useMyStore.getState().evaluations.map(issue=>({...issue,resolutionStatus:'resolved'}));
 rerender(<PersonaIcon {...props}/>);
 expect(screen.queryByRole('button',{name:'View persona concerns'})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'History'})).toBeVisible();
});

it('offers a visible evaluate signifier and keyboard activation for UX/PM reviewers', () => {
 useMyStore.getState().evaluations=[];
 const toggle=jest.fn();
 render(<PersonaIcon personaId="p" description="Applicant" accountRole="reviewer" toggleFunction={toggle} idx={2}/>);
 const action=screen.getByRole('button',{name:'Evaluate persona: Applicant'});
 expect(screen.getByText('Evaluate')).toBeVisible();
 fireEvent.click(action); expect(toggle).toHaveBeenCalledWith(2);
 fireEvent.keyDown(action,{key:'Enter'}); expect(toggle).toHaveBeenCalledTimes(2);
});
