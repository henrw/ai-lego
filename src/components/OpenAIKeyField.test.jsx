import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OpenAIKeyField from './OpenAIKeyField';
import { openAIKeyHeaders, readOpenAIKey } from '../utils/openAIKey';
jest.mock('../authentication/UserAuthContext', () => ({ useUserAuth: () => ({ user: { uid: 'alex' } }) }));
beforeEach(() => { sessionStorage.clear(); });
it('saves a masked session key, attaches it only for its account, and removes it', () => {
  render(<OpenAIKeyField />);
  const field = screen.getByLabelText('OpenAI API key');
  expect(field.type).toBe('password');
  fireEvent.change(field, { target: { value: '  sk-test-personal  ' } });
  fireEvent.click(screen.getByText('Save key'));
  expect(readOpenAIKey('alex')).toBe('sk-test-personal');
  expect(openAIKeyHeaders("alex")).toEqual({ 'X-OpenAI-API-Key': 'sk-test-personal' });
  expect(openAIKeyHeaders("other")).toEqual({});
  fireEvent.click(screen.getByText('Show key'));
  expect(field.type).toBe('text');
  fireEvent.click(screen.getByText('Remove key'));
  expect(readOpenAIKey('alex')).toBe('');
});
it('rejects invalid keys without overwriting a saved key', () => {
  render(<OpenAIKeyField />);
  fireEvent.change(screen.getByLabelText('OpenAI API key'), { target: { value: 'not a key' } });
  fireEvent.click(screen.getByText('Save key'));
  expect(screen.getByRole('alert')).toHaveTextContent('valid OpenAI API key');
  expect(readOpenAIKey('alex')).toBe('');
});
