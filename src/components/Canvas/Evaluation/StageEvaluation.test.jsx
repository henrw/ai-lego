import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StageEvaluation from './StageEvaluation';
import useMyStore from '../../../contexts/projectContext';
jest.mock('../../../authentication/UserAuthContext',()=>({useUserAuth:()=>({user:{displayName:'Sam'}})}));
jest.mock('../../../contexts/projectContext',()=>{
 const state={projectId:'team',addEvaluation:jest.fn()};
 return {__esModule:true,default:selector=>selector(state),colorClasses:{data:'data',model:'model'},stageEvaluationPrompts:{},state};
});
const props={side:'left',showLauncher:false,draftPerStage:true,isExpanded:true,setIsExpanded:jest.fn(),selectedCardIds:['data'],cardsData:[{uid:'data',stage:'data'},{uid:'model',stage:'model'}],cardId2number:{data:0,model:0}};
beforeEach(()=>sessionStorage.clear());
it('retains independent stage drafts and submits to the clicked stage',async()=>{
 const save=useMyStore(state=>state.addEvaluation);save.mockResolvedValue(true);
 const {rerender}=render(<StageEvaluation {...props}/>);
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Data bias concern'}});
 rerender(<StageEvaluation {...props} selectedCardIds={['model']}/>);
 expect(screen.getByRole('textbox')).toHaveValue('');
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Model transparency concern'}});
 rerender(<StageEvaluation {...props}/>);
 expect(screen.getByRole('textbox')).toHaveValue('Data bias concern');
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith('Sam',['data'],expect.objectContaining({type:'stage',problem:'Data bias concern'})));
 await waitFor(()=>expect(screen.getByRole('textbox')).toHaveValue(''));
 rerender(<StageEvaluation {...props} selectedCardIds={['model']}/>);
 expect(screen.getByRole('textbox')).toHaveValue('Model transparency concern');
});
it('shows no launcher or collapsed placeholder in reviewer mode',()=>{
 render(<StageEvaluation {...props} isExpanded={false}/>);
 expect(screen.queryByRole('button')).not.toBeInTheDocument();
 expect(document.querySelector('.expandable-panel')).not.toBeVisible();
});

it('limits legacy multi-selection to the most recently selected block', async()=>{
 const save=useMyStore(state=>state.addEvaluation);save.mockClear();save.mockResolvedValue(true);
 render(<StageEvaluation {...props} selectedCardIds={['data','model']}/>);
 expect(screen.getByRole('region',{name:'Selected lifecycle block'})).toHaveTextContent('Model');
 fireEvent.change(screen.getByRole('textbox'),{target:{value:'Only model issue'}});
 fireEvent.click(screen.getByRole('button',{name:'Submit'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith('Sam',['model'],expect.objectContaining({problem:'Only model issue'})));
});
it('disables editing and submission until one valid stage is selected',()=>{
 render(<StageEvaluation {...props} selectedCardIds={['removed']}/>);
 expect(screen.getByRole('textbox')).toBeDisabled();
 expect(screen.getByRole('button',{name:'Submit'})).toBeDisabled();
});
