import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import useMyStore from '../../../contexts/projectContext';
import { onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import CollaboratorModal, { makeShareUrl } from './CollaboratorModal';

jest.mock('../../../firebase', () => ({ db: {} }));
jest.mock('../../../authentication/UserAuthContext', () => ({ useUserAuth: () => ({user:{uid:'ai-user'}}) }));
jest.mock('firebase/firestore', () => ({
  doc: (_db, kind, id) => `${kind}/${id}`, collection: (_db, kind) => kind,
  query: jest.fn(), where: jest.fn(), arrayUnion: value => value,
  onSnapshot: jest.fn(), getDocs: jest.fn(), writeBatch: jest.fn(),
}));
let subscriptions;
beforeEach(() => {
  subscriptions = new Map();
  onSnapshot.mockImplementation((path, callback, error) => {
    const stop = jest.fn(); subscriptions.set(path, {callback,error,stop}); return stop;
  });
  useMyStore.setState({projectId:'team-project'});
});
const publish = (path, data) => act(() => subscriptions.get(path).callback({exists:()=>true,data:()=>data}));
it('preserves URL parameters without granting membership through a link', () => {
  const url = new URL(makeShareUrl('https://example.org/project/old?view=review&usp=sharing#fragment', 'new-id'));
  expect(url.pathname).toBe('/project/new-id'); expect(url.searchParams.get('view')).toBe('review');
  expect(url.searchParams.has('usp')).toBe(false); expect(url.hash).toBe('');
});
it('lists real members and live roles, handles unreadable profiles, and cleans up listeners', () => {
  const {unmount} = render(<CollaboratorModal isOpen onClose={()=>{}} />);
  publish('projects/team-project',{userIds:['ai-user','ux-user','pm-user','ux-user']});
  publish('users/ai-user',{fullName:'Alex',occupation:'AI Developer',avatarSeed:'alex'});
  publish('users/ux-user',{fullName:'Sam',occupation:'UI/UX Designer'});
  publish('users/pm-user',{fullName:'Jo',occupation:'Product Manager'});
  expect(screen.getByText('Alex (you)')).toBeInTheDocument();
  ['UX','PM','AI'].forEach(role=>expect(screen.getByText(role)).toBeInTheDocument());
  publish('users/ux-user',{fullName:'Sam',occupation:'Product Manager'});
  expect(screen.queryByText('UX')).not.toBeInTheDocument();
  act(()=>subscriptions.get('users/pm-user').error(new Error('denied')));
  expect(screen.getByText('Profile unavailable')).toBeInTheDocument();
  publish('projects/team-project',{userIds:['ai-user']});
  expect(subscriptions.get('users/ux-user').stop).toHaveBeenCalled();
  expect(screen.queryByText('Sam')).not.toBeInTheDocument();
  unmount();
  expect(subscriptions.get('projects/team-project').stop).toHaveBeenCalled();
  expect(subscriptions.get('users/ai-user').stop).toHaveBeenCalled();
});
it('invites an existing account with both membership updates and clears the email', async () => {
  const batch = {update:jest.fn(),commit:jest.fn().mockResolvedValue(undefined)};
  writeBatch.mockReturnValue(batch);
  getDocs.mockResolvedValue({empty:false,docs:[{id:'ux-user'}]});
  render(<CollaboratorModal isOpen onClose={()=>{}} />);
  fireEvent.change(screen.getByLabelText('Email Address'),{target:{value:'ux@example.com'}});
  fireEvent.click(screen.getByRole('button',{name:'Invite'}));
  await waitFor(()=>expect(screen.getByText('Collaborator added.')).toBeInTheDocument());
  expect(batch.update).toHaveBeenCalledWith('projects/team-project',{userIds:'ux-user'});
  expect(batch.update).toHaveBeenCalledWith('users/ux-user',{projectIds:'team-project'});
  expect(screen.getByLabelText('Email Address')).toHaveValue('');
});
