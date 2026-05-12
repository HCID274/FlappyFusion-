import { CONFIG } from '../../config.js';
import { THEME } from '../../theme.js';

let nextId = 0;

// MHD instability region: a roiling red cloud of blobs above and below a passable gap.
// Approximated as 2 stacked AABB hitboxes with the gap in between.
// `ob.x` is the LEFT edge of the bounding box, matching the convention used by Divertor.

export function createInstability(leftX, centerY) {
  const r = THEME.size.instabilityR;
  const margin = CONFIG.obstacle.wallMargin;
  const H = CONFIG.canvas.height;
  const gap = 220;
  const w = r * 2;

  const ob = {
    id: `mhd${nextId++}`,
    type: 'instability',
    x: leftX,
    centerY,
    radius: r,
    w,
    passed: false,
    rot: 0,
    blobs: [
      { dx: 0,        dy: -gap / 2 - r * 0.5, r: r * 1.0 },
      { dx: r * 0.4,  dy: -gap / 2 - r * 1.4, r: r * 0.7 },
      { dx: 0,        dy:  gap / 2 + r * 0.5, r: r * 1.0 },
      { dx: -r * 0.4, dy:  gap / 2 + r * 1.4, r: r * 0.7 },
    ],
    hitBoxes: [
      { x: leftX, y: margin, w, h: Math.max(0, centerY - gap / 2 - margin) },
      { x: leftX, y: centerY + gap / 2, w, h: Math.max(0, H - margin - (centerY + gap / 2)) },
    ],
  };
  ob.move = (dx) => {
    ob.x += dx;
    ob.hitBoxes[0].x += dx;
    ob.hitBoxes[1].x += dx;
  };
  ob.render = (ctx) => drawInstability(ctx, ob);
  return ob;
}

function drawInstability(ctx, ob) {
  ob.rot += 0.03;
  const cx0 = ob.x + ob.radius;
  for (const b of ob.blobs) {
    const cx = cx0 + b.dx + Math.sin(ob.rot + b.dy) * 3;
    const cy = ob.centerY + b.dy + Math.cos(ob.rot + b.dx) * 3;
    const r = b.r * (1 + Math.sin(ob.rot * 1.7) * 0.06);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, THEME.colors.instability);
    grad.addColorStop(0.6, 'rgba(255, 85, 68, 0.5)');
    grad.addColorStop(1, 'rgba(255, 85, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
