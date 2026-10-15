import { render, screen, fireEvent } from '@testing-library/react';
import Block from './index';
import useMyStore from '../../../contexts/projectContext';
jest.mock('react-draggable',()=>({__esModule:true,default:({children})=>children}));
jest.mock('./Message',()=>({__esModule:true,default:({message})=><div>{message}</div>}));
jest.mock('./Evaluation',()=>({__esModule:true,default:({evaluationData})=><div>{evaluationData.problem}</div>}));
jest.mock('../../../contexts/projectContext',()=>{
 const state={projectId:'team',cards:[{uid:'data',stage:'data',position:{x:0,y:0}}],evaluations:[],refreshLinks:jest.fn(),setCardDraft:jest.fn(),setCardDescription:jest.fn().mockResolvedValue(true)};
 const hook=selector=>selector(state);hook.getState=()=>state;
 return {__esModule:true,default:hook,colorClasses:{data:'data'},prompts:{}};
});
const props={id:'data',stage:'data',text:'Plan',comments:[],selectedCardIds:[],changeSelectedCardIds:jest.fn()};
beforeEach(()=>{useMyStore.getState().evaluations=[];sessionStorage.clear();});
it('expands comment-only feedback by default and lets the reader collapse it',()=>{
 render(<Block {...props} comments={[{uid:'comment',text:'Consider privacy'}]}/>);
 expect(screen.getByText('Consider privacy')).toBeVisible();
 fireEvent.click(screen.getAllByRole('button',{name:'Collapse Data comments'})[0]);
 expect(screen.queryByText('Consider privacy')).not.toBeInTheDocument();
 expect(props.changeSelectedCardIds).not.toHaveBeenCalled();
 fireEvent.click(screen.getAllByRole('button',{name:'Expand Data comments'})[0]);
 expect(screen.getByText('Consider privacy')).toBeVisible();
});
it('expands evaluation-only feedback, including feedback received after mount',()=>{
 const {rerender}=render(<Block {...props}/>);
 expect(screen.queryByText('Evaluation')).not.toBeInTheDocument();
 useMyStore.getState().evaluations=[{uid:'evaluation',cardIds:['data'],problem:'Check bias'}];
 rerender(<Block {...props}/>);
 expect(screen.getByText('Check bias')).toBeVisible();
 expect(screen.getAllByRole('button',{name:'Collapse Data comments'})[0]).toHaveAttribute('aria-expanded','true');
});

it('publishes typed specifications immediately before the debounced save or blur',()=>{
 jest.useFakeTimers();
 const state=useMyStore.getState();state.setCardDraft.mockClear();state.setCardDescription.mockClear();
 const {unmount}=render(<Block {...props}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Data stage description'}),{target:{value:'Updated labels'}});
 expect(state.setCardDraft).toHaveBeenCalledWith('data','Updated labels');
 expect(state.setCardDescription).not.toHaveBeenCalled();
 expect(sessionStorage.getItem('card-draft-team-data')).toBe('Updated labels');
 unmount();jest.useRealTimers();
});

it('counts only active issues and keeps history accessible after approval',()=>{
 const comment={uid:'comment',text:'Consider privacy'};
 useMyStore.getState().evaluations=[{uid:'evaluation',cardIds:['data'],problem:'Check bias',resolutionStatus:'pending'},{uid:'archived',cardIds:['data'],problem:'Old concern',resolutionStatus:'resolved'}];
 const {rerender}=render(<Block {...props} comments={[comment]}/>);
 expect(screen.getByRole('button',{name:'Collapse Data comments'})).toHaveTextContent('2');
 useMyStore.getState().evaluations=useMyStore.getState().evaluations.map(e=>({...e,resolutionStatus:'resolved',resolutionHistory:[{action:'approved'}]}));
 rerender(<Block {...props} comments={[{...comment,resolutionStatus:'resolved',resolutionHistory:[{action:'approved'}]}]}/>);
 expect(screen.queryByText('Evaluation')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Collapse Data comments'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Expand Data comments'})).not.toBeInTheDocument();
 expect(screen.getByText('Old concern')).not.toBeVisible();
 expect(screen.getAllByText(/Review history/)).toHaveLength(1);
 fireEvent.click(screen.getByText('Review history (3)'));
 expect(screen.getByText('Old concern')).toBeVisible();
});

it('does not show an evaluation section on a block without any issues',()=>{
 render(<Block {...props}/>);
 expect(screen.queryByText('Evaluation')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Collapse Data comments'})).not.toBeInTheDocument();
});

it('starts and clears the connection preview during native connector dragging',()=>{
 const start=jest.fn(),end=jest.fn();const transfer={setData:jest.fn()};
 render(<Block {...props} onConnectorDragStart={start} onConnectorDragEnd={end}/>);
 const clip=screen.getByRole('button',{name:'Connect from Data'});
 fireEvent.dragStart(clip,{dataTransfer:transfer});
 expect(transfer.setData).toHaveBeenCalledWith('arrow','data');
 expect(start).toHaveBeenCalledWith('data',expect.anything());
 expect(transfer.effectAllowed).toBe('link');
 fireEvent.dragEnd(clip);
 expect(end).toHaveBeenCalledTimes(1);
});
it('shows older multi-linked trace notes only on their original stage in reviewer view', () => {
 useMyStore.getState().evaluations=[
  {uid:'other-trace',cardIds:['data','train'],problem:'Training comment',stageTrace:{entry:{cardId:'train'}}},
  {uid:'data-trace',cardIds:['data','train'],problem:'Data comment',stageTrace:{entry:{cardId:'data'}}},
 ];
 render(<Block {...props} reviewMode accountRole="reviewer"/>);
 expect(screen.queryByText('Training comment')).not.toBeInTheDocument();
 expect(screen.getByText('Data comment')).toBeVisible();
});

it('keeps review history visible independently of collapsed active evaluations', () => {
 useMyStore.getState().evaluations=[
  {uid:'active',cardIds:['data'],problem:'Active concern',resolutionStatus:'open'},
  {uid:'past',cardIds:['data'],problem:'Past concern',resolutionStatus:'resolved',resolutionHistory:[{action:'approved'}]},
 ];
 render(<Block {...props}/>);
 expect(screen.getByText('Evaluation')).toBeVisible();
 fireEvent.click(screen.getByRole('button',{name:'Collapse Data comments'}));
 expect(screen.queryByText('Evaluation')).not.toBeInTheDocument();
 expect(screen.getByText('Review history (1)')).toBeVisible();
 expect(screen.getByText('Past concern')).not.toBeVisible();
});
