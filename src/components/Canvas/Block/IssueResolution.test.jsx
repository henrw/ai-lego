import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IssueResolution from './IssueResolution';
import useMyStore from '../../../contexts/projectContext';
jest.mock('../../../contexts/projectContext',()=>{
 const state={projectId:'team',cards:[{uid:'data',stage:'data',description:'Audit training labels'}],reviewIssue:jest.fn()};
 const hook=selector=>selector(state);hook.getState=()=>state;
 return {__esModule:true,default:hook};
});
const issue={uid:'issue',cardIds:['data'],type:'stage',problem:'Biased labels',by:'Sam',specificationBaseline:[{uid:'data',stage:'data',description:'Historical labels'}]};
const pending={...issue,resolutionStatus:'pending',resolution:{uid:'proposal',summary:'Added a bias audit',submittedBy:{name:'Alex'},changes:[{cardId:'data',stage:'data',before:'Historical labels',after:'Audit training labels',kind:'updated',beforeKnown:true}]}};
beforeEach(()=>{jest.clearAllMocks();sessionStorage.clear();useMyStore.getState().cards=[{uid:'data',stage:'data',description:'Audit training labels'}];});
it('captures changed specifications without any AI request, summary or popup',async()=>{
 const oldFetch=global.fetch;const fetchMock=jest.fn();global.fetch=fetchMock;
 const save=useMyStore.getState().reviewIssue;save.mockResolvedValue({ok:true});
 render(<IssueResolution issue={issue} role="ai"/>);
 fireEvent.click(screen.getByRole('button',{name:'Address issue'}));
 await waitFor(()=>expect(save).toHaveBeenCalledWith('evaluations','issue','submit',expect.objectContaining({cardIds:['data'],expectedSpecifications:[{uid:'data',stage:'data',description:'Audit training labels'}]})));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Address issue'})).toBeEnabled());
 expect(save.mock.calls[0][3].summary).toBeUndefined();
 expect(fetchMock).not.toHaveBeenCalled();global.fetch=oldFetch;
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('keeps the issue open when specifications are unchanged',async()=>{
 useMyStore.getState().cards=issue.specificationBaseline;
 const save=useMyStore.getState().reviewIssue;
 render(<IssueResolution issue={issue} role="ai"/>);
 fireEvent.click(screen.getByRole('button',{name:'Address issue'}));
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Update a specification'));
 expect(save).not.toHaveBeenCalled();
});
it('shows PM/UX the proposal and allows approval or a request for more work',async()=>{
 const save=useMyStore.getState().reviewIssue;save.mockResolvedValue({ok:true});
 render(<IssueResolution issue={pending} role="reviewer"/>);
 expect(screen.getByText('Historical labels')).toBeVisible();
 expect(screen.getByText('Audit training labels')).toBeVisible();
 expect(screen.queryByText('Added a bias audit')).not.toBeInTheDocument();
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Approve resolution'})).toBeEnabled();
 expect(screen.getByRole('button',{name:'Request changes'})).toBeDisabled();
 fireEvent.change(screen.getByRole('textbox',{name:'Review comment'}),{target:{value:'Check disability-related bias too'}});
 fireEvent.click(screen.getByRole('button',{name:'Request changes'}));
 await waitFor(()=>expect(screen.getByRole('button',{name:'Approve resolution'})).toBeEnabled());
 expect(save).toHaveBeenCalledWith('evaluations','issue','request_changes',expect.objectContaining({note:'Check disability-related bias too',resolutionId:'proposal'}));
});
it('does not allow stale specifications to be approved or AI to approve itself',()=>{
 useMyStore.getState().cards=[{uid:'data',stage:'data',description:'Changed after proposal'}];
 const {rerender}=render(<IssueResolution issue={pending} role="reviewer"/>);
 expect(screen.getByRole('button',{name:'Approve resolution'})).toBeDisabled();
 expect(screen.getByText(/changed or been removed/)).toBeVisible();
 rerender(<IssueResolution issue={pending} role="ai"/>);
 expect(screen.queryByRole('button',{name:'Approve resolution'})).not.toBeInTheDocument();
});

it('moves approved issues into collapsed review history with the original comment and changes',()=>{
 const resolved={...pending,resolutionStatus:'resolved',resolutionHistory:[{action:'submitted',changes:pending.resolution.changes,comment:{problem:'Biased labels',by:'Sam'}},{action:'approved',reviewedBy:{name:'Jo'},comment:{problem:'Biased labels',by:'Sam'}}]};
 render(<IssueResolution issue={resolved} role="reviewer"/>);
 expect(screen.queryByText('Resolved')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Approve resolution'})).not.toBeInTheDocument();
 expect(screen.getByText('Review history (1)')).toBeVisible();
 expect(screen.getAllByText('Biased labels')[0]).not.toBeVisible();
 fireEvent.click(screen.getByText('Review history (1)'));
 expect(screen.getAllByText('Biased labels')[0]).toBeVisible();
 expect(screen.getByText('Historical labels')).toBeVisible();
 expect(screen.getByText('Audit training labels')).toBeVisible();
 expect(screen.getByText('Approved')).toBeVisible();
});

it('does not count an unreviewed submission as review history',()=>{
 render(<IssueResolution issue={{...pending,resolutionHistory:[{action:'submitted',uid:'proposal',changes:pending.resolution.changes}]}} role="reviewer"/>);
 expect(screen.queryByText(/Review history/)).not.toBeInTheDocument();
});
