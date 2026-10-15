import { useEffect, useLayoutEffect, useState, useRef } from 'react';
export default function useCanvasGestures() {
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const zoomRef = useRef(1);
  const pendingAnchor = useRef(null);
  useLayoutEffect(() => {
    const anchor = pendingAnchor.current;
    zoomRef.current = zoom;
    if (anchor) {
      window.scrollTo({ left: anchor.x * zoom - anchor.clientX, top: anchor.y * zoom - anchor.clientY, behavior: 'instant' });
      pendingAnchor.current = null;
    }
  }, [zoom]);
  useEffect(() => {
    let space = false, drag = null, frame, desiredZoom = zoomRef.current, suppressClick = false;
    const editable = target => target.closest?.('input, textarea, [contenteditable="true"]');
    const onKey = event => {
      if (event.code !== 'Space' || editable(event.target)) return;
      space = event.type === 'keydown';
      if (space) event.preventDefault();
      document.body.classList.toggle('canvas-pan-ready', space);
    };
    const end = () => { drag = null; space = false; setPanning(false); document.body.classList.remove('canvas-pan-ready'); };
    const down = event => {
      if (!event.target.closest?.('#canvas') || (!space && event.button !== 1)) return;
      event.preventDefault(); event.stopPropagation();
      suppressClick = false;
      drag = { x: event.clientX, y: event.clientY, left: window.scrollX, top: window.scrollY };
      setPanning(true);
    };
    const move = event => {
      if (!drag) return;
      event.preventDefault();
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4) suppressClick = true;
      window.scrollTo({ left: drag.left + drag.x - event.clientX, top: drag.top + drag.y - event.clientY, behavior: 'instant' });
    };
    const click = event => { if (suppressClick && event.target.closest?.('#canvas')) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } };
    const wheel = event => {
      if (!event.target.closest?.('#canvas') || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault(); event.stopPropagation();
      const previous = zoomRef.current;
      desiredZoom = Math.max(.25, Math.min(2, desiredZoom * Math.exp(-event.deltaY * .005)));
      pendingAnchor.current = { x: (window.scrollX + event.clientX) / previous, y: (window.scrollY + event.clientY) / previous, clientX: event.clientX, clientY: event.clientY };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setZoom(desiredZoom));
    };
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
    document.addEventListener('mousedown', down, true); document.addEventListener('click', click, true);
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', end); window.addEventListener('blur', end);
    document.addEventListener('wheel', wheel, { passive: false, capture: true });
    return () => {
      cancelAnimationFrame(frame); end();
      window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey);
      document.removeEventListener('mousedown', down, true); document.removeEventListener('click', click, true);
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end); window.removeEventListener('blur', end);
      document.removeEventListener('wheel', wheel, true);
    };
  }, []);
  return { zoom, panning };
}
