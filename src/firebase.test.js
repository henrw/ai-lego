jest.mock('firebase/app',()=>({initializeApp:jest.fn(()=>({name:'test-app'}))}));
jest.mock('firebase/auth',()=>({initializeAuth:jest.fn(()=>({name:'tab-auth'})),browserSessionPersistence:{type:'SESSION'},browserPopupRedirectResolver:{name:'popup'}}));
jest.mock('firebase/firestore',()=>({getFirestore:jest.fn()}));
jest.mock('firebase/storage',()=>({getStorage:jest.fn()}));
import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver } from 'firebase/auth';
it('initializes Auth with tab-scoped persistence before any account is loaded',()=>{
  initializeApp.mockReturnValue({name:'test-app'});
  initializeAuth.mockReturnValue({name:'tab-auth'});
  let app, auth;
  jest.isolateModules(() => { ({ app, auth } = require('./firebase')); });
  expect(initializeAuth).toHaveBeenCalledTimes(1);
  expect(initializeAuth).toHaveBeenCalledWith(app,{persistence:browserSessionPersistence,popupRedirectResolver:browserPopupRedirectResolver});
  expect(auth).toEqual({name:'tab-auth'});
});
