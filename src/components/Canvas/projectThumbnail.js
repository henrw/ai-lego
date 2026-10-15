import { connectorPoints } from './brickGeometry';
const colors = { problem:'#cddfd6', task:'#fffbd7', data:'#e5cf92', model:'#e69b7d', train:'#a5efd0', test:'#7bc2d7', deploy:'#baa6d9', feedback:'#a8c58f' };

// Render a project overview without cloning or scrolling the live document.
export function projectThumbnail(cards, links) {
  const width = Math.max(640, ...cards.map(c => c.position.x + (c.width || 240) + 40));
  const height = Math.max(360, ...cards.map(c => c.position.y + (c.height || 180) + 40));
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1600 / width, 1000 / height);
  canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext('2d');
  context.scale(scale, scale);
  context.fillStyle = '#f7f7f5'; context.fillRect(0, 0, width, height);
  context.strokeStyle = '#a0b0ba'; context.lineWidth = 6;
  for (const link of links) {
    const start = cards.find(c => c.uid === link.start), end = cards.find(c => c.uid === link.end);
    if (!start || !end) continue;
    const points = connectorPoints(start, end, cards);
    context.beginPath(); points.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y)); context.stroke();
  }
  for (const card of cards) {
    const { x, y } = card.position, w = card.width || 240, h = card.height || 180;
    context.fillStyle = '#fff'; context.fillRect(x, y, w, h);
    context.strokeStyle = '#d8d8d8'; context.lineWidth = 1; context.strokeRect(x, y, w, h);
    context.fillStyle = colors[card.stage] || '#ddd'; context.fillRect(x, y, w, 40);
    context.fillStyle = '#252525'; context.font = 'bold 18px monospace';
    context.fillText(card.stage.charAt(0).toUpperCase() + card.stage.slice(1), x + 10, y + 27);
    context.font = '14px sans-serif';
    let line = '', row = y + 61;
    for (const word of (card.description || '').split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width > w - 20 && line) {
        context.fillText(line, x + 10, row); row += 20; line = word;
        if (row > y + h - 10) break;
      } else line = next;
    }
    if (row <= y + h - 10) context.fillText(line, x + 10, row);
  }
  return canvas.toDataURL('image/png');
}
