// Shared factory for D / T atoms. Variants differ only in color and inner-dot count.

import { CONFIG } from '../../config.js';

let nextId = 0;

export function createAtomEntity(type, x, y, color, dotCount) {
  const r = CONFIG.collectible.radius;
  const c = {
    id: `${type}${nextId++}`,
    type,
    pos: { x, y },
    hitBox: { x: x - r, y: y - r, w: r * 2, h: r * 2 },
    collected: false,
    bob: Math.random() * Math.PI * 2,
    radius: r,
  };
  c.move = (dx) => {
    c.pos.x += dx;
    c.hitBox.x += dx;
  };
  c.render = (ctx) => drawAtom(ctx, c, color, dotCount);
  return c;
}

function drawAtom(ctx, c, color, dots) {
  c.bob += 0.05;
  const yo = Math.sin(c.bob) * 3;

  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(c.pos.x, c.pos.y + yo, c.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < dots; i++) {
    const angle = (i / dots) * Math.PI * 2 + Math.PI / 2;
    const dx = dots === 1 ? 0 : Math.cos(angle) * c.radius * 0.35;
    const dy = dots === 1 ? 0 : Math.sin(angle) * c.radius * 0.35;
    ctx.beginPath();
    ctx.arc(c.pos.x + dx, c.pos.y + yo + dy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}
