import { useCallback, useEffect, useState } from "react";

// Preserve persona-dialog state through refresh, scoped to its project.
export default function useSessionState(key, initial) {
  const read = () => {
    try { return JSON.parse(sessionStorage.getItem(key)) ?? initial; }
    catch { return initial; }
  };
  const [value, setValue] = useState(read);
  useEffect(() => { setValue(read()); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = useCallback(next => {
    setValue(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* Keep working in memory. */ }
  }, [key]);
  return [value, update];
}
