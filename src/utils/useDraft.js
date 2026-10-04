import { useEffect, useState } from "react";

// Keep unsent text through a refresh, without storing API credentials.
export default function useDraft(key, initial = "") {
  const read = () => { try { return sessionStorage.getItem(key) ?? initial; } catch { return initial; } };
  const [value, setValue] = useState(read);
  useEffect(() => { setValue(read()); /* key identifies a new document */ }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const update = next => { setValue(next); try { sessionStorage.setItem(key, next); } catch { /* Text remains available in memory. */ } };
  const clear = () => { setValue(""); try { sessionStorage.removeItem(key); } catch {} };
  return [value, update, clear];
}
