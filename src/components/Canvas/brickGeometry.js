export const STUD = 20;
export const BRICK_WIDTH = 240;
export const CLIP_GAP = STUD;
export const PORT_Y = 70;
export const BOARD_TOP = 160;
export const STUD_CENTER = STUD / 2;
const nearestStudCenter = value => Math.round((value - STUD_CENTER) / STUD) * STUD + STUD_CENTER;

export function snapPosition(position) {
  return { x: Math.max(0, Math.round(position.x / STUD) * STUD), y: Math.max(0, Math.round(position.y / STUD) * STUD) };
}

// Side clips only dock when both bricks fit; notes are never lifecycle connectors.
export function findDock(id, position, cards) {
  const moving = cards.find(card => card.uid === id);
  if (!moving || moving.stage === "note") return null;
  const options = [];
  for (const target of cards) {
    if (target.uid === id || target.stage === "note") continue;
    const base = snapPosition(target.position);
    for (const side of ["right", "left"]) {
      const candidate = { x: base.x + (side === "right" ? BRICK_WIDTH + CLIP_GAP : -BRICK_WIDTH - CLIP_GAP), y: base.y };
      const distance = Math.hypot(candidate.x - position.x, candidate.y - position.y);
      if (candidate.x < 0 || distance > STUD * 2) continue;
      const occupied = cards.some(other => {
        if (other.uid === id || other.uid === target.uid) return false;
        const p = snapPosition(other.position);
        const width = other.stage === "note" ? 700 : BRICK_WIDTH;
        return candidate.x < p.x + width && candidate.x + BRICK_WIDTH > p.x && candidate.y < p.y + (other.height || 110) && candidate.y + (moving.height || 110) > p.y;
      });
      if (!occupied) options.push({ position: candidate, height: moving.height || 110, distance, targetId: target.uid, link: side === "right" ? { start: target.uid, end: id } : { start: id, end: target.uid } });
    }
  }
  return options.sort((a, b) => a.distance - b.distance)[0] || null;
}

export function connectorPoints(start, end, cards = [start, end]) {
  const a = { x: start.position.x + BRICK_WIDTH, y: start.position.y + PORT_Y };
  const b = { x: end.position.x, y: end.position.y + PORT_Y };
  if (b.x >= a.x + CLIP_GAP) {
    const middle = nearestStudCenter((a.x + b.x) / 2);
    return [a, { x: middle, y: a.y }, { x: middle, y: b.y }, b];
  }
  const right = a.x + STUD + STUD_CENTER;
  const left = b.x - STUD - STUD_CENTER;
  const above = y => Math.floor((y - STUD - STUD_CENTER) / STUD) * STUD + STUD_CENTER;
  const gap = above(end.position.y);
  const wrap = y => [a, { x: right, y: a.y }, { x: right, y }, { x: left, y }, { x: left, y: b.y }, b];
  const clear = points => points.slice(1).every((q, i) => {
    const p = points[i];
    return cards.every(card => {
      // The short entry and exit segments meet their own block's socket.
      if ((i === 0 && card === start) || (i === points.length - 2 && card === end)) return true;
      const x = card.position.x, y = card.position.y;
      const width = card.width || (card.stage === 'note' ? 700 : BRICK_WIDTH);
      const height = card.height || 110;
      return p.y === q.y
        ? !(p.y > y - 9 && p.y < y + height + 9 && Math.max(p.x, q.x) > x - 9 && Math.min(p.x, q.x) < x + width + 9)
        : !(p.x > x - 9 && p.x < x + width + 9 && Math.max(p.y, q.y) > y - 9 && Math.min(p.y, q.y) < y + height + 9);
    });
  });
  // Prefer the destination row's upper gap. If the source extends into it,
  // pass above the source first, then descend along its left side to the gap.
  const sourceTop = above(start.position.y);
  const sourceLeft = start.position.x - STUD - STUD_CENTER;
  const aroundSource = [a, { x: right, y: a.y }, { x: right, y: sourceTop }, { x: sourceLeft, y: sourceTop }, { x: sourceLeft, y: gap }, { x: left, y: gap }, { x: left, y: b.y }, b];
  const top = above(Math.min(...cards.map(card => card.position.y)));
  for (const candidate of [wrap(gap), aroundSource, wrap(top)]) {
    if (clear(candidate)) return candidate;
  }
  const bottom = Math.ceil(Math.max(...cards.map(card => card.position.y + (card.height || 110))) / STUD) * STUD + STUD + STUD_CENTER;
  return wrap(bottom);
}

export function beamStuds(points) {
  const studs = [];
  const seen = new Set();
  points.slice(1).forEach((end, index) => {
    const start = points[index];
    const horizontal = start.y === end.y;
    const axis = horizontal ? "x" : "y";
    const low = Math.min(start[axis], end[axis]), high = Math.max(start[axis], end[axis]);
    const first = Math.ceil((low - STUD_CENTER) / STUD) * STUD + STUD_CENTER;
    for (let value = first; value <= high; value += STUD) {
      const point = horizontal ? { x: value, y: start.y } : { x: start.x, y: value };
      const key = `${point.x},${point.y}`;
      if (!seen.has(key)) { studs.push(point); seen.add(key); }
    }
  });
  return studs;
}

export function clipControlPoint(points) {
  const segments = points.slice(1).map((end, i) => ({ start: points[i], end, length: Math.hypot(end.x - points[i].x, end.y - points[i].y) }));
  const segment = segments.sort((a, b) => b.length - a.length)[0];
  const horizontal = segment.start.y === segment.end.y;
  return horizontal
    ? { x: nearestStudCenter((segment.start.x + segment.end.x) / 2), y: segment.start.y }
    : { x: segment.start.x, y: nearestStudCenter((segment.start.y + segment.end.y) / 2) };
}

export function connectorDragPoints(start, point, target, cards) {
  if (target) return connectorPoints(start, target, cards);
  const a = { x: start.position.x + BRICK_WIDTH, y: start.position.y + PORT_Y };
  const middle = nearestStudCenter(Math.max(a.x + STUD, (a.x + point.x) / 2));
  return [a, { x: middle, y: a.y }, { x: middle, y: point.y }, point];
}

// Reflow visual rows without changing the team's saved manual coordinates.
// Starting from saved coordinates also lets rows return when content collapses.
export function reflowBricks(cards) {
  const rows = new Map();
  cards.forEach(card => {
    const position = snapPosition(card.position);
    if (!rows.has(position.y)) rows.set(position.y, []);
    rows.get(position.y).push({ ...card, position });
  });
  const placed = [];
  [...rows.entries()].sort(([a], [b]) => a - b).forEach(([baseY, row]) => {
    let y = baseY;
    row.forEach(card => {
      const width = card.width || (card.stage === 'note' ? 700 : BRICK_WIDTH);
      placed.forEach(other => {
        const otherWidth = other.width || (other.stage === 'note' ? 700 : BRICK_WIDTH);
        if (card.position.x < other.position.x + otherWidth && card.position.x + width > other.position.x) {
          y = Math.max(y, Math.ceil((other.position.y + (other.height || 110) + STUD) / STUD) * STUD);
        }
      });
    });
    row.forEach(card => placed.push({ ...card, position: { ...card.position, y } }));
  });
  const byId = new Map(placed.map(card => [card.uid, card]));
  return cards.map(card => byId.get(card.uid));
}
