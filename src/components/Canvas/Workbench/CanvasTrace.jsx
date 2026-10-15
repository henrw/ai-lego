import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { traceExperience } from '../../../utils/workbench';
import useMyStore from '../../../contexts/projectContext';
import { tracePlacement } from './tracePlacement';
import { BOARD_TOP, BRICK_WIDTH, connectorPoints } from '../brickGeometry';

const noLinks = [];

export default function CanvasTrace({ cards, zoom = 1 }) {
  const overlayRef = useRef(null);
  const travelerRef = useRef(null);
  const toolbarRef = useRef(null);
  const [placement, setPlacement] = useState(null);
  const [dockPlacement, setDockPlacement] = useState(null);
  const links = useMyStore(s => s.links) || noLinks;
  const playback = useMyStore(s => s.scenarioPlayback);
  const active = playback?.entries[playback.index];
  const card = cards.find(c => c.uid === active?.cardId);
  const activeId = card?.uid;
  const index = playback?.index;
  const runId = playback?.runId;
  const reducedMotion = playback?.reducedMotion;
  useEffect(() => {
    if (!activeId) return;
    const element = document.getElementById(activeId);
    element?.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center', inline: 'center' });
  }, [activeId, index, runId, reducedMotion]);
  const comment = traceExperience(active);
  const hasPlayback = !!playback;
  useLayoutEffect(() => {
    if (!card || !hasPlayback) return;
    let frame;
    const measure = () => {
      const canvas = overlayRef.current?.parentElement?.getBoundingClientRect();
      const origin = { x: (canvas?.left || 0) / zoom, y: (canvas?.top || 0) / zoom };
      const obstacles = cards.map(c => ({ x: c.position.x, y: c.position.y + BOARD_TOP, width: c.width || BRICK_WIDTH, height: c.height || 110 }));
      const target = obstacles[cards.findIndex(c => c.uid === card.uid)];
      links.forEach(link => {
        const start = cards.find(c => c.uid === link.start), end = cards.find(c => c.uid === link.end);
        if (!start || !end) return;
        const points = connectorPoints(start, end, cards);
        points.slice(1).forEach((point, i) => {
          const previous = points[i];
          obstacles.push({ x: Math.min(point.x, previous.x) - 10, y: Math.min(point.y, previous.y) + BOARD_TOP - 10,
            width: Math.abs(point.x - previous.x) + 20, height: Math.abs(point.y - previous.y) + 20 });
        });
      });
      const traveler = travelerRef.current;
      const size = { width: Math.min(290, (window.innerWidth - 32) / zoom), height: Math.max(100, traveler?.querySelector('.trace-speech')?.offsetHeight || 140) };
      const toolbar = toolbarRef.current?.getBoundingClientRect();
      const top = Math.max(64, document.querySelector('nav')?.getBoundingClientRect().bottom || 0);
      const fullViewport = { x: 16 / zoom - origin.x, y: (top + 12) / zoom - origin.y, width: (window.innerWidth - 32) / zoom, height: Math.max(0, (window.innerHeight - top - 28) / zoom) };
      let dock = null;
      const controlsWidth = (toolbarRef.current?.querySelector('.trace-controls-row')?.scrollWidth || 650) + 24;
      for (const width of [Math.min(controlsWidth, fullViewport.width)]) {
        const height = toolbar && Math.abs(toolbar.width / zoom - width) < 2 ? toolbar.height / zoom : 130;
        dock = tracePlacement(target, obstacles, { width, height }, fullViewport);
        if (dock) break;
      }
      setDockPlacement(current => current?.x === dock?.x && current?.y === dock?.y && current?.width === dock?.width && current?.screenX === origin.x && current?.screenY === origin.y ? current : dock && { ...dock, screenX: origin.x, screenY: origin.y });
      // The persona may cover other blocks and connectors, but keep the active
      // specification and playback controls readable.
      const personaObstacles = [target, ...(dock ? [dock] : [])];
      const bottom = !dock && toolbar?.top > 0 ? (toolbar.top - 12) / zoom : (window.innerHeight - 16) / zoom;
      const viewport = { ...fullViewport, height: Math.max(0, bottom - (top + 12) / zoom) };
      let next = tracePlacement(target, personaObstacles, size, viewport);
      if (!next) {
        const avatar = tracePlacement(target, personaObstacles, { width: 28, height: 52 }, viewport, 2);
        if (avatar) next = { ...avatar, dock: true };
      }
      setPlacement(current => current?.x === next?.x && current?.y === next?.y && current?.width === next?.width && current?.dock === next?.dock ? current : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    if (travelerRef.current) observer?.observe(travelerRef.current);
    if (toolbarRef.current) observer?.observe(toolbarRef.current);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [card, cards, links, activeId, index, comment, hasPlayback, zoom]);
  if (!playback) return null;
  return <div ref={overlayRef} className="canvas-stage-trace" aria-label="Persona trace playback">
    <div ref={toolbarRef} style={dockPlacement ? { left: dockPlacement.x + dockPlacement.screenX, top: dockPlacement.y + dockPlacement.screenY, bottom: 'auto', transform: 'none', width: dockPlacement.width } : undefined} className="trace-playback-toolbar" role="group" aria-label="Canvas trace controls">
      {card && (!placement || placement.dock) && <div className="trace-dock-comment">{!placement && <img src={playback.persona.imgUrl || 'https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%205.png?alt=media'} alt=""/>}<p aria-live="polite"><strong>{card.stage}: </strong>{traceExperience(active) || 'Examining this stage…'}<small>{playback.generating ? 'Draft · streaming · not yet verified' : 'Draft · playback'}</small></p></div>}
      <div className="trace-controls-row">
      <span>{card?.stage || 'Block no longer on canvas'} · {playback.index + 1}/{playback.entries.length} · {playback.generating ? playback.playing ? 'Generating live…' : 'Holding stage · generating…' : playback.playing ? 'Playing' : 'Paused'}</span>
      <button onClick={playback.playing ? playback.onPause : playback.onPlay}>{playback.generating ? playback.playing ? 'Hold stage' : 'Follow live' : playback.playing ? 'Pause trace' : 'Play trace'}</button>
      <button disabled={playback.index <= 0} onClick={playback.onPrevious}>Previous stage</button>
      <button disabled={playback.index >= (playback.lastAvailableIndex ?? playback.entries.length - 1)} onClick={playback.onNext}>Next stage</button>
      {playback.generating && <button onClick={playback.onStop}>Stop generation</button>}
      <button onClick={playback.onClear}>Return to results</button>
      </div>
    </div>
    {card && <div className="trace-active-outline" aria-hidden="true" style={{ left: card.position.x - 4, top: card.position.y + BOARD_TOP - 4, width: (card.width || BRICK_WIDTH) + 8, height: (card.height || 110) + 8 }}/>} 
    {card && <div ref={travelerRef} className={`trace-traveler ${playback.reducedMotion ? 'trace-no-motion' : ''} ${placement?.dock ? 'trace-avatar-only' : ''}`} style={{ left: placement?.x ?? card.position.x, top: placement?.y ?? card.position.y + BOARD_TOP, width: placement?.width || Math.min(290, (window.innerWidth - 32) / zoom), visibility: placement ? 'visible' : 'hidden' }}>
      <img src={playback.persona.imgUrl || 'https://firebasestorage.googleapis.com/v0/b/ai-lego.appspot.com/o/persona_pictures%2FSubject%205.png?alt=media'} alt={playback.persona.description}/>
      <div className="trace-speech"><strong>{card.stage} · {playback.index + 1}/{playback.entries.length}</strong><p aria-live="polite">{traceExperience(active) || 'Examining this stage…'}{playback.generating && <span className="trace-stream-cursor" aria-hidden="true">▍</span>}</p><small>{playback.generating ? 'Draft · streaming · not yet verified' : 'Draft · playback'}</small></div>
    </div>}
  </div>;
}
