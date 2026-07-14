import React, { useId, useState } from "react";

export default function OpenAIKeyField({ value, onChange }) {
  const [showKey, setShowKey] = useState(false);
  const inputId = useId();
  const privacyId = useId();

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
      <label htmlFor={inputId} className="font-semibold text-gray-800">
        Your OpenAI API key
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id={inputId}
          type={showKey ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value.trim())}
          placeholder="sk-..."
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-2 font-mono text-sm"
          aria-describedby={privacyId}
        />
        <button
          type="button"
          onClick={() => setShowKey((current) => !current)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-100"
          aria-label={showKey ? "Hide API key" : "Show API key"}
        >
          {showKey ? "Hide" : "Show"}
        </button>
      </div>
      <p id={privacyId} className="mt-2 text-xs leading-5 text-gray-600">
        Your key is kept only in this browser tab's memory. It is sent securely over HTTPS
        for each OpenAI request and is never saved to your project, browser storage, or our server.
        Closing or refreshing this tab clears it.
      </p>
    </div>
  );
}
