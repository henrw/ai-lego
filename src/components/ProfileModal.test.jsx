import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileModal from './ProfileModal';
jest.mock('../authentication/UserAuthContext', () => ({ useUserAuth: () => ({ user: { uid: 'new-user' } }) }));
it('asks new users for an API key in the registration profile popup', () => {
  render(<ProfileModal showModal userProfile={{ fullName: 'New user' }} fields={{ occupation: '', experienceLevel: '' }} customInputs={{}} handleFieldChange={() => jest.fn()} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Set up your AI access')).toBeInTheDocument();
  expect(screen.getByLabelText('OpenAI API key')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
});
