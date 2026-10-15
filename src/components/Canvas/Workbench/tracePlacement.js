const overlap = (a, b, gap = 10) => a.x < b.x + b.width + gap && a.x + a.width > b.x - gap && a.y < b.y + b.height + gap && a.y + a.height > b.y - gap;

// Search whitespace near the active block, then the rest of the visible canvas.
// Return null on crowded screens rather than cover a lifecycle specification.
export function tracePlacement(active, obstacles, size, viewport, clearance = 10) {
  const gap = clearance + 8;
  const xs = [active.x, active.x + active.width + gap, active.x - size.width - gap, viewport.x];
  const ys = [active.y - size.height - gap, active.y + active.height + gap, active.y, viewport.y];
  obstacles.forEach(rect => {
    xs.push(rect.x - size.width - gap, rect.x + rect.width + gap);
    ys.push(rect.y - size.height - gap, rect.y + rect.height + gap);
  });
  const candidates = [];
  for (const x of xs) for (const y of ys) {
    const rect = { x, y, ...size };
    if (x < viewport.x || y < viewport.y || x + size.width > viewport.x + viewport.width || y + size.height > viewport.y + viewport.height) continue;
    if (obstacles.some(obstacle => overlap(rect, obstacle, clearance))) continue;
    const dx = Math.max(active.x - (x + size.width), x - (active.x + active.width), 0);
    const dy = Math.max(active.y - (y + size.height), y - (active.y + active.height), 0);
    candidates.push({ ...rect, score: Math.hypot(dx, dy) + Math.hypot(x - active.x, y - active.y) * .05 });
  }
  return candidates.sort((a, b) => a.score - b.score)[0] || null;
}
