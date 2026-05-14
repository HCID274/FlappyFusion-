import { CONFIG } from '../../config.js';
import { THEME } from '../../theme.js';

let nextId = 0;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function layoutHitBoxes(ob) {
  const H = CONFIG.canvas.height;
  const margin = CONFIG.obstacle.wallMargin;
  const minGapY = margin + ob.gap / 2 + 30;
  const maxGapY = Math.max(minGapY, H - margin - ob.gap / 2 - 30);
  ob.gapY = clamp(ob.gapY, minGapY, maxGapY);

  const topH = ob.gapY - ob.gap / 2 - margin;
  const botY = ob.gapY + ob.gap / 2;
  const botH = H - margin - botY;

  ob.hitBoxes[0] = { x: ob.x, y: margin, w: ob.w, h: Math.max(0, topH) };
  ob.hitBoxes[1] = { x: ob.x, y: botY, w: ob.w, h: Math.max(0, botH) };
}

export function createDivertor(x, gapY, gap) {
  const w = CONFIG.obstacle.width;

  const ob = {
    id: `div${nextId++}`,
    type: 'divertor',
    x,
    gapY,
    gap,
    w,
    passed: false,
    hitBoxes: [],
  };
  ob.layout = () => layoutHitBoxes(ob);
  ob.move = (dx) => {
    ob.x += dx;
    ob.hitBoxes[0].x += dx;
    ob.hitBoxes[1].x += dx;
  };
  ob.render = (ctx) => drawDivertor(ctx, ob);
  ob.layout();
  return ob;
}

function drawDivertor(ctx, ob) {
  const margin = CONFIG.obstacle.wallMargin;
  const H = CONFIG.canvas.height;
  const topH = ob.gapY - ob.gap / 2 - margin;
  const botY = ob.gapY + ob.gap / 2;
  const botH = H - margin - botY;

  ctx.fillStyle = THEME.colors.wall;
  ctx.fillRect(ob.x, margin, ob.w, Math.max(0, topH));
  ctx.fillRect(ob.x, botY, ob.w, Math.max(0, botH));

  // edge highlights — magnetic glow at the gap-facing edges
  ctx.fillStyle = THEME.colors.magneticLine;
  ctx.fillRect(ob.x, margin + topH - 3, ob.w, 3);
  ctx.fillRect(ob.x, botY, ob.w, 3);

  // heat-fin texture
  ctx.strokeStyle = THEME.colors.wallEdge;
  ctx.lineWidth = 1;
  for (let y = margin + 8; y < margin + topH - 6; y += 8) {
    ctx.beginPath();
    ctx.moveTo(ob.x + 4, y);
    ctx.lineTo(ob.x + ob.w - 4, y);
    ctx.stroke();
  }
  for (let y = botY + 8; y < botY + botH - 6; y += 8) {
    ctx.beginPath();
    ctx.moveTo(ob.x + 4, y);
    ctx.lineTo(ob.x + ob.w - 4, y);
    ctx.stroke();
  }
}
