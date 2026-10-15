import { specificationSnapshot, specificationChanges, resolutionIsCurrent, resolutionTransition, captureIssueChanges, completedReviews } from './issueResolution';
const before=[{uid:'data',stage:'data',description:'Historical labels'},{uid:'train',stage:'train',description:'Train model'}];
const after=[{uid:'data',stage:'data',description:'Audit labels for bias'},{uid:'train',stage:'train',description:'Train model'},{uid:'fairness',stage:'test',description:'Test fairness by group'}];
const issue={specificationBaseline:specificationSnapshot(before)};
const ai={role:'ai',author:{name:'Alex',occupation:'AI Developer'}},ux={role:'reviewer',author:{name:'Sam',occupation:'UI/UX Designer'}};
const input={uid:'proposal',summary:'Audited labels and added a fairness gate.',cardIds:['data','train','fairness']};
it('captures only linked changes, distinguishing new blocks from edited specifications',()=>{
 const changes=specificationChanges(issue,after,input.cardIds);
 expect(changes).toHaveLength(2);
 expect(changes[0]).toMatchObject({cardId:'data',before:'Historical labels',after:'Audit labels for bias',kind:'updated'});
 expect(changes[1]).toMatchObject({cardId:'fairness',kind:'added'});
});
it('requires reviewer approval before an addressed issue becomes resolved',()=>{
 const pending={...issue,...resolutionTransition(issue,'submit',ai,after,input,'time')};
 expect(pending.resolutionStatus).toBe('pending');
 expect(()=>resolutionTransition(pending,'approve',ai,after,{resolutionId:'proposal'},'time')).toThrow('PM/UX');
 const resolved=resolutionTransition(pending,'approve',ux,after,{resolutionId:'proposal'},'time');
 expect(resolved.resolutionStatus).toBe('resolved');expect(resolved.resolutionHistory.map(item=>item.action)).toEqual(['submitted','approved']);
 expect(()=>resolutionTransition(issue,'submit',ux,after,input,'time')).toThrow('AI developers');
});
it('rejects unchanged proposals, stale approvals and decisions on superseded proposals',()=>{
 expect(()=>resolutionTransition(issue,'submit',ai,before,input,'time')).toThrow('updated or new');
 const pending={...issue,...resolutionTransition(issue,'submit',ai,after,input,'time')};
 const changed=after.map(card=>card.uid==='data'?{...card,description:'Changed again'}:card);
 expect(resolutionIsCurrent(pending.resolution,changed)).toBe(false);
 expect(()=>resolutionTransition(pending,'approve',ux,changed,{resolutionId:'proposal'},'time')).toThrow('changed after');
 expect(()=>resolutionTransition(pending,'approve',ux,after,{resolutionId:'old'},'time')).toThrow('proposal has changed');
});
it('reopens issues with reviewer feedback and preserves review history on resubmission',()=>{
 const pending={...issue,...resolutionTransition(issue,'submit',ai,after,input,'time')};
 const reopened={...pending,...resolutionTransition(pending,'request_changes',ux,after,{resolutionId:'proposal',note:'Include disability-related bias.'},'time')};
 expect(reopened.resolutionStatus).toBe('open');
 expect(reopened.resolutionReview.note).toContain('disability');
 const next=resolutionTransition(reopened,'submit',ai,after,{...input,uid:'proposal2'},'later');
 expect(next.resolutionHistory.map(entry=>entry.action)).toEqual(['submitted','changes_requested','submitted']);
});
it('handles legacy issues without inventing old specification text',()=>{
 expect(specificationChanges({},after,['data'])[0]).toMatchObject({beforeKnown:false,kind:'existing'});
});
it('rejects specification edits made while submission was running',()=>{
 expect(()=>resolutionTransition(issue,'submit',ai,after,{...input,expectedSpecifications:[{uid:'data',stage:'data',description:'Analysis saw different text'}]},'time')).toThrow('changed while submitting');
});

it('captures edits and new blocks deterministically without requiring a summary',()=>{
 const captured=captureIssueChanges(issue,after);
 expect(captured.cardIds).toEqual(['data','fairness']);
 const patch=resolutionTransition(issue,'submit',ai,after,{...captured,uid:'direct'},'time');
 expect(patch.resolution.summary).toBeUndefined();
 expect(patch.resolution.changes).toHaveLength(2);
});
it('captures clearing existing text but ignores empty new blocks',()=>{
 const cards=[{...before[0],description:''},before[1],{uid:'empty',stage:'test',description:''}];
 expect(captureIssueChanges(issue,cards).cardIds).toEqual(['data']);
 expect(resolutionTransition(issue,'submit',ai,cards,{...captureIssueChanges(issue,cards),uid:'clear'},'time').resolution.changes[0].after).toBe('');
});

it('preserves the corresponding original comment in approval history',()=>{
 const original={...issue,uid:'comment',text:'Review biased training labels',by:'Sam',author:{name:'Sam'},impact:'Unfair screening'};
 const pending={...original,...resolutionTransition(original,'submit',ai,after,input,'submitted-time')};
 const approved=resolutionTransition(pending,'approve',ux,after,{resolutionId:'proposal'},'approved-time');
 expect(approved.resolutionHistory[0].comment).toMatchObject({uid:'comment',text:original.text,by:'Sam',impact:'Unfair screening'});
 expect(approved.resolutionHistory[1].comment).toEqual(approved.resolutionHistory[0].comment);
});

it('counts completed reviews once and pairs each decision with its own specification changes',()=>{
 const first=[{cardId:'data',before:'Old',after:'First revision'}];
 const second=[{cardId:'data',before:'Old',after:'Second revision'}];
 const history=[{action:'submitted',uid:'one',changes:first},{action:'changes_requested',resolutionId:'one',note:'Revise again'},{action:'submitted',uid:'two',changes:second}];
 expect(completedReviews({resolutionHistory:history})).toHaveLength(1);
 const reviewed=completedReviews({resolutionHistory:[...history,{action:'approved',resolutionId:'two'}]});
 expect(reviewed).toHaveLength(2);expect(reviewed[0].changes).toEqual(first);expect(reviewed[1].changes).toEqual(second);
});
