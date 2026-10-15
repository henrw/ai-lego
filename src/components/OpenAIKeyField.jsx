import React, { useState } from 'react';
import { useUserAuth } from '../authentication/UserAuthContext';
import { readOpenAIKey, saveOpenAIKey } from '../utils/openAIKey';

export default function OpenAIKeyField() {
  const { user } = useUserAuth();
  return <KeyField key={user?.uid || 'guest'} uid={user?.uid} />;
}
function KeyField({ uid }) {
  const [value, setValue] = useState(() => readOpenAIKey(uid));
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = () => {
    setError(''); setMessage('');
    try {
      saveOpenAIKey(uid, value);
      setValue(value.trim());
      setMessage(value.trim() ? 'API key saved for this session.' : 'API key removed.');
    } catch (err) { setError(err.message || 'Could not save the key. Allow browser session storage and retry.'); }
  };
  return <section className="my-3" aria-label="OpenAI API key settings">
    <label className="block text-sm font-semibold" htmlFor="openai-api-key">OpenAI API key</label>
    <p id="openai-key-help" className="text-xs text-gray-500 my-2">Paste your key to use AI features. Kept only in this browser tab’s session and sent to our server for OpenAI requests.</p>
    <input id="openai-api-key" type={visible ? 'text' : 'password'} value={value}
      autoComplete="off" spellCheck={false} aria-describedby="openai-key-help"
      placeholder="sk-…" className="w-full border rounded p-2 text-sm"
      onChange={event => { setValue(event.target.value); setMessage(''); setError(''); }} />
    <div className="flex gap-3 mt-2">
      <button type="button" className="text-sm text-blue-600" onClick={() => setVisible(!visible)}>{visible ? 'Hide key' : 'Show key'}</button>
      <button type="button" className="text-sm text-blue-600" onClick={save}>Save key</button>
      <button type="button" className="text-sm text-gray-600" onClick={() => {
        try { saveOpenAIKey(uid, ''); setValue(''); setError(''); setMessage('API key removed.'); }
        catch { setError('Could not remove the key. Please retry.'); }
      }}>Remove key</button>
    </div>
    {message && <p role="status" className="text-xs text-green-700 mt-2">{message}</p>}
    {error && <p role="alert" className="text-xs text-red-600 mt-2">{error}</p>}
  </section>;
}
