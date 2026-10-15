import React, { useRef, useState } from "react";
import useMyStore from "../../../contexts/projectContext";

export default function ProjectName() {
  const name = useMyStore(store => store.projectName);
  const save = useMyStore(store => store.setProjectName);
  const [draft, setDraft] = useState(null);
  const cancelled = useRef(false);
  const commit = () => {
    if (cancelled.current) { cancelled.current = false; return; }
    const value = draft?.trim();
    setDraft(null);
    if (value && value !== name) save(value);
  };
  return <input
    type="text"
    aria-label="Project name"
    title="Edit project name. Press Enter to save or Escape to cancel."
    className="flex-1 min-w-0 py-2 pl-2 pr-1 border-2"
    value={draft ?? name}
    placeholder="Untitled project"
    onFocus={event => { setDraft(name); event.target.select(); }}
    onChange={event => setDraft(event.target.value)}
    onBlur={commit}
    onKeyDown={event => {
      if (event.key === "Enter" && !event.nativeEvent.isComposing) {
        event.preventDefault(); event.currentTarget.blur();
      } else if (event.key === "Escape") {
        cancelled.current = true; setDraft(null); event.currentTarget.blur();
      }
    }}
  />;
}
