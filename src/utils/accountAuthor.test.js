jest.mock('../firebase',()=>({auth:{currentUser:{uid:'ux',email:'ux@example.com'}},db:{}}));
jest.mock('firebase/firestore',()=>({doc:(_db,kind,id)=>`${kind}/${id}`,getDoc:jest.fn()}));
import { getDoc } from 'firebase/firestore';
import { accountAuthor } from './accountAuthor';
it('attributes submissions to the account profile even without an Auth display name',async()=>{
  getDoc.mockResolvedValue({data:()=>({fullName:'Sam',occupation:'UI/UX Designer',avatarSeed:'saved'})});
  expect(await accountAuthor('Anonymous',false)).toEqual({uid:'ux',name:'Sam',occupation:'UI/UX Designer',avatarSeed:'saved',profile_picture:''});
});
it('uses account identity when profile access fails and avoids account data in guest demos',async()=>{
  getDoc.mockRejectedValue(new Error('denied'));
  expect((await accountAuthor('Anonymous',false)).name).toBe('ux@example.com');
  getDoc.mockClear();
  expect((await accountAuthor('Visitor',true)).name).toBe('Visitor');
  expect(getDoc).not.toHaveBeenCalled();
});
