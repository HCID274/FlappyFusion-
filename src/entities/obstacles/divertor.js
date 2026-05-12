import { CONFIG } from '../../config.js';
import { THEME } from '../../theme.js';

let nextId = 0;

export function createDivertor(x, gapY, gap) {
  const w = CONFIG.obstacle.width;
  const H = CONFIG.canvas.height;
  const margin = CONFIG.obstacle.wallMargin;
  const topH = gapY - gap / 2 - margin;
  const botY = gapY + gap / 2;
  const botH = H - margin - botY;

  const ob = {
    id: `div${nextId++}`,
    type: 'divertor',
    x,
    gapY,
    gap,
    w,
    passed: false,
    hitBoxes: [
      { x, y: margin, w, h: Math.max(0, topH) },
      { x, y: botY, w, h: Math.max(0, botH) },
    ],
  };
  ob.move = (dx) => {
    ob.x += dx;
    ob.hitBoxes[0].x += dx;
    ob.hitBoxes[1].x += dx;
  };
  ob.render = (ctx) => drawDivertor(ctx, ob);
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
