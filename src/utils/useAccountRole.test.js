import { renderHook, act } from '@testing-library/react';
import { onSnapshot } from 'firebase/firestore';
import useAccountRole from './useAccountRole';
jest.mock('../firebase',()=>({db:{}}));
jest.mock('firebase/firestore',()=>({doc:(_db,kind,id)=>`${kind}/${id}`,onSnapshot:jest.fn()}));
it('waits for the account role, updates live, and cleans up on account changes',()=>{
 const watchers=new Map();
 onSnapshot.mockImplementation((id,callback,error)=>{const stop=jest.fn();watchers.set(id,{callback,error,stop});return stop;});
 const {result,rerender,unmount}=renderHook(({uid})=>useAccountRole({uid},false),{initialProps:{uid:'ai'}});
 expect(result.current.roleLoading).toBe(true);
 act(()=>watchers.get('users/ai').callback({data:()=>({occupation:'AI Developer'})}));
 expect(result.current.showEvaluation).toBe(false);
 act(()=>watchers.get('users/ai').callback({data:()=>({occupation:'Admin'})}));
 expect(result.current.showEvaluation).toBe(true);
 rerender({uid:'ux'});
 expect(result.current.roleLoading).toBe(true);
 expect(watchers.get('users/ai').stop).toHaveBeenCalled();
 act(()=>watchers.get('users/ux').callback({data:()=>({occupation:'UI/UX Designer'})}));
 expect(result.current.evaluationSide).toBe('right');
 act(()=>watchers.get('users/ux').error(new Error('denied')));
 expect(result.current.roleError).toContain('Could not load your role');
 unmount();expect(watchers.get('users/ux').stop).toHaveBeenCalled();
});
it('keeps the public demo layout without reading any account profile',()=>{
 onSnapshot.mockClear();
 const {result}=renderHook(()=>useAccountRole({uid:'ai'},true));
 expect(result.current.showLifecycle).toBe(true);expect(result.current.showEvaluation).toBe(true);
 expect(onSnapshot).not.toHaveBeenCalled();
});
