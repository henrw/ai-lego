import React from "react";
import { BOARD_TOP, beamStuds, connectorPoints, clipControlPoint, connectorDragPoints } from "./brickGeometry";

export default function BrickConnections({ cards, links, onRemove, readOnly = false, preview = null }) {
  const byId = new Map(cards.map(card => [card.uid, card]));
  const source = preview && byId.get(preview.sourceId);
  const previewPoints = source ? connectorDragPoints(source, preview.point, byId.get(preview.targetId), cards) : null;
  return <div className="brick-connections" style={{ top: BOARD_TOP }} aria-label="Lifecycle connections">
    <svg className="brick-beams" aria-hidden="true">
      {previewPoints && !readOnly && <svg className="brick-beams brick-connection-preview" aria-hidden="true"><polyline points={previewPoints.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={preview.targetId ? undefined : '8 5'}/><circle cx={previewPoints.at(-1).x} cy={previewPoints.at(-1).y} r="6" fill="#dbeafe" stroke="#2563eb" strokeWidth="2"/></svg>}
    {links.map(link => {
        const start = byId.get(link.start), end = byId.get(link.end);
        if (!start || !end) return null;
        const points = connectorPoints(start, end, cards);
        const line = points.map(point => `${point.x},${point.y}`).join(" ");
        return <g key={`${link.start}-${link.end}`}>
          <polyline points={line} fill="none" stroke="#647785" strokeWidth="18" strokeLinejoin="round" />
          <polyline points={line} fill="none" stroke="#b8c8d1" strokeWidth="13" strokeLinejoin="round" />
          {beamStuds(points).map((point, i) => <circle key={i} cx={point.x} cy={point.y} r="4" fill="#dce5e9" stroke="#8c9faa" strokeWidth="1" />)}
          <path d={`M ${points[0].x + 3} ${points[0].y - 4} l 4 4 l -4 4`} fill="none" stroke="#526571" strokeWidth="2" />
        </g>;
      })}
    </svg>
    {links.map(link => {
      const start = byId.get(link.start), end = byId.get(link.end);
      if (!start || !end) return null;
      const points = connectorPoints(start, end, cards);
      const clip = clipControlPoint(points);
      return <button key={`${link.start}-${link.end}`} className="brick-unclip no-drag" disabled={readOnly} style={{ left: clip.x - 8, top: clip.y - 12 }}
        title={`Unclip ${start.stage} → ${end.stage}`} aria-label={`Disconnect ${start.stage} from ${end.stage}`}
        onClick={event => { event.stopPropagation(); onRemove(link); }}>×</button>;
    })}
  </div>;
}
