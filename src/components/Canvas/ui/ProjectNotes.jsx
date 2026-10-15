import React, { useEffect, useRef, useState } from "react";
import useMyStore from "../../../contexts/projectContext";
import useSessionState from "../../../utils/useSessionState";

export default function ProjectNotes() {
  const notes = useMyStore(store => store.notes);
  const projectId = useMyStore(store => store.projectId);
  const isDemo = useMyStore(store => store.isDemo);
  const draftKey = `project-notes-draft-${projectId}`;
  const readDraft = () => { try { return sessionStorage.getItem(draftKey); } catch { return null; } };
  const [text, setText] = useState(() => readDraft() ?? notes);
  const [expanded, setExpanded] = useSessionState(`project-notes-expanded-${projectId}`, false);
  const dirty = useRef(readDraft() !== null);
  const latest = useRef(text);
  const timer = useRef(null);
  const save = async value => {
    const store = useMyStore.getState();
    if (store.projectId !== projectId) return;
    const ok = await store.setProjectNotes(value);
    if (ok && latest.current === value) {
      dirty.current = false;
      try { sessionStorage.removeItem(draftKey); } catch {}
    }
  };
  useEffect(() => {
    if (dirty.current) save(latest.current);
    return () => clearTimeout(timer.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!dirty.current) { setText(notes); latest.current = notes; }
  }, [notes]);
  const change = value => {
    dirty.current = true; latest.current = value; setText(value);
    try { sessionStorage.setItem(draftKey, value); } catch {}
    clearTimeout(timer.current);
    if (isDemo) save(value); else timer.current = setTimeout(() => save(value), 400);
  };
  return <div className={`project-notes ${expanded ? "project-notes-expanded" : ""}`}>
    <div className="project-notes-editor">
      <textarea id={`project-notes-${projectId}`} aria-label="Project notes" value={text}
        placeholder="Notes" rows={expanded ? 7 : 1}
        onChange={event => change(event.target.value)}
        onBlur={() => { clearTimeout(timer.current); if (dirty.current) save(latest.current); }} />
      <button type="button" aria-expanded={expanded} aria-controls={`project-notes-${projectId}`}
        aria-label={expanded ? "Collapse project notes" : "Expand project notes"}
        title={expanded ? "Collapse notes" : "Expand notes"} onClick={() => setExpanded(!expanded)}>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={expanded ? "M19 5 5 19M5 9v10h10" : "M5 19 19 5M9 5h10v10"} />
        </svg>
      </button>
    </div>
  </div>;
}
