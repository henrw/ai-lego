import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Canvas from './index';
import useMyStore from '../../contexts/projectContext';
import { roleLayout } from '../../utils/accountRole';
let mockOccupation = 'Admin';
jest.mock('firebase/storage',()=>({ref:jest.fn(),uploadBytes:jest.fn(),getDownloadURL:jest.fn()}));
jest.mock('firebase/firestore',()=>({doc:jest.fn(),collection:jest.fn(),onSnapshot:jest.fn(),arrayUnion:jest.fn(),arrayRemove:jest.fn(),serverTimestamp:jest.fn(),writeBatch:jest.fn(),updateDoc:jest.fn(),runTransaction:jest.fn(),getDoc:jest.fn()}));
jest.mock('../../firebase',()=>({db:{},storage:{}}));
jest.mock('../../authentication/UserAuthContext',()=>({useUserAuth:()=>({user:{uid:'test'},loading:false})}));
jest.mock('../../utils/useAccountRole',()=>({__esModule:true,default:()=>({...require('../../utils/accountRole').roleLayout(mockOccupation),roleLoading:false,roleError:''})}));
jest.mock('./Block',()=>({__esModule:true,default:({stage,id,changeSelectedCardIds,reviewMode})=><div data-testid="plan-block" data-review={reviewMode} onClick={()=>changeSelectedCardIds(id)}>{stage} plan</div>}));
jest.mock('./BrickConnections',()=>()=>null);
jest.mock('./ui/MiniMap',()=>()=>null);
jest.mock('./ui/ProjectNotes',()=>()=>null);
jest.mock('./ui/CollaboratorModal',()=>()=>null);
jest.mock('./Evaluation/StageEvaluation',()=>({__esModule:true,default:({side,isExpanded,showLauncher,selectedCardIds})=><div data-testid="stage-evaluation" data-side={side} data-expanded={isExpanded} data-launcher={showLauncher} data-cards={selectedCardIds.join(",")}>Stage evaluation controls</div>}));
jest.mock('./Evaluation/PersonaEvaluation',()=>({__esModule:true,default:({side,isExpanded,showLauncher,selectedPersona})=><div data-testid="persona-evaluation" data-side={side} data-expanded={isExpanded} data-launcher={showLauncher} data-persona={selectedPersona[0]?.uid}>Persona evaluation controls</div>}));
function show(role){
 mockOccupation=role;
 useMyStore.setState({projectId:'team',projectName:'Team plan',cards:[{uid:'data',stage:'data',position:{x:180,y:60}}],links:[],personas:[{uid:"applicant",description:"Career changer",imgUrl:"avatar.svg"}],evaluations:[],canvasScale:{x:1,y:1},loadingProject:false,loadError:'',saveError:'',openProject:()=>()=>{}});
 return render(<MemoryRouter initialEntries={['/project/team']}><Routes><Route path="/project/:projectId" element={<Canvas/>}/></Routes></MemoryRouter>);
}
it('retains the full Admin interface',()=>{
 show('Admin');
 expect(screen.getByText('Lifecycle Blocks')).toBeInTheDocument();
 expect(screen.getByText('Personas')).toBeInTheDocument();
 expect(screen.getByTestId('stage-evaluation')).toHaveAttribute('data-side','right');
});
it('shows only lifecycle authoring controls to AI while retaining the shared plan',()=>{
 show('AI Developer');
 expect(screen.getByText('Lifecycle Blocks')).toBeInTheDocument();
 expect(screen.queryByTestId('stage-evaluation')).not.toBeInTheDocument();
 expect(screen.queryByText('Personas')).not.toBeInTheDocument();
 expect(screen.getByTestId('plan-block')).toBeInTheDocument();
});
it.each(['Product Manager','UI/UX Designer'])('puts %s evaluation panels on the right without the creation palette',role=>{
 show(role);
 expect(screen.queryByText('Lifecycle Blocks')).not.toBeInTheDocument();
 expect(screen.getByTestId('stage-evaluation')).toHaveAttribute('data-side','right');
 expect(screen.getByTestId('persona-evaluation')).toHaveAttribute('data-side','right');
 expect(screen.getByText('Personas').parentElement.parentElement).toHaveClass('bottom-4', 'left-4');
 expect(screen.getByTestId('plan-block')).toBeInTheDocument();
});
it('preserves the layout for existing accounts without a recognized role',()=>{
 expect(roleLayout('')).toMatchObject({role:'admin',showLifecycle:true,showEvaluation:true});
 expect(roleLayout('Researcher')).toMatchObject({role:'admin',showLifecycle:true,showEvaluation:true});
});

it.each(['Product Manager','UI/UX Designer'])('opens drafts directly for %s',role=>{
 show(role);
 expect(screen.queryByText('Evaluation:')).not.toBeInTheDocument();
 expect(screen.getByTestId('stage-evaluation')).toHaveAttribute('data-launcher','false');
 expect(screen.getByTestId('persona-evaluation')).toHaveAttribute('data-launcher','false');
 expect(screen.getByTestId('plan-block')).toHaveAttribute('data-review','true');
 fireEvent.click(screen.getByTestId('plan-block'));
 expect(screen.getByTestId('stage-evaluation')).toHaveAttribute('data-expanded','true');
 expect(screen.getByTestId('stage-evaluation')).toHaveAttribute('data-cards','data');
 fireEvent.click(screen.getByTestId('plan-block'));
 expect(screen.getByTestId('stage-evaluation')).toHaveAttribute('data-cards','data');
 fireEvent.click(screen.getByRole('button',{name:'Evaluate persona: Career changer'}));
 expect(screen.getByTestId('stage-evaluation')).toHaveAttribute('data-expanded','false');
 expect(screen.getByTestId('persona-evaluation')).toHaveAttribute('data-expanded','true');
 expect(screen.getByTestId('persona-evaluation')).toHaveAttribute('data-persona','applicant');
 fireEvent.click(screen.getByTestId('plan-block'));
 expect(screen.getByTestId('persona-evaluation')).toHaveAttribute('data-expanded','false');
});
