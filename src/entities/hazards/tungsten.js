import { CONFIG } from '../../config.js';
import { THEME } from '../../theme.js';
import { getImage } from '../../assetLoader.js';

let nextId = 0;

export function createTungsten(x, y) {
  const size = CONFIG.hazards.tungsten.hitBoxSize;
  const h = {
    id: `w${nextId++}`,
    type: 'tungsten',
    pos: { x, y },
    hitBox: { x: x - size / 2, y: y - size / 2, w: size, h: size },
    triggered: false,
    alpha: 1,
    spin: Math.random() * Math.PI * 2,
    radius: size / 2,
  };

  h.move = (dx) => {
    h.pos.x += dx;
    h.hitBox.x += dx;
  };
  h.render = (ctx) => drawTungsten(ctx, h);
  return h;
}

function drawTungsten(ctx, h) {
  h.spin += 0.03;
  if (h.triggered) h.alpha = Math.max(0.25, h.alpha - 0.08);

  ctx.save();
  ctx.globalAlpha = h.alpha;
  const img = getImage('hazardTungsten');
  if (img) {
    const size = CONFIG.hazards.tungsten.displaySize;
    ctx.translate(h.pos.x, h.pos.y);
    ctx.rotate(Math.sin(h.spin) * 0.08);
    ctx.shadowColor = THEME.colors.tungsten;
    ctx.shadowBlur = 10;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }

  ctx.translate(h.pos.x, h.pos.y);
  ctx.rotate(h.spin * 0.2);
  ctx.fillStyle = THEME.colors.tungsten;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const size = CONFIG.hazards.tungsten.displaySize;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = (i % 2 === 0 ? 0.425 : 0.2) * size;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
