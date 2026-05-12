// Renders the canvas. Reads world state, never mutates.
// Z-order: bg → walls → magnetic field → obstacles → collectibles → plasma → particles → wall warning.

import { CONFIG } from '../config.js';
import { THEME } from '../theme.js';

export function createRenderer(ctx, world) {
  return {
    render() {
      const W = CONFIG.canvas.width;
      const H = CONFIG.canvas.height;

      ctx.fillStyle = THEME.colors.bg;
      ctx.fillRect(0, 0, W, H);

      drawMagneticGrid(ctx, world, W, H);
      drawWalls(ctx, W, H);

      for (const ob of world.obstacles) ob.render(ctx);
      for (const c of world.collectibles) if (!c.collected) c.render(ctx);

      if (world.status === 'playing' && world.plasma.alive) {
        drawWallWarning(ctx, world, W, H);
        world.plasma.render(ctx);
      } else if (world.status === 'dead') {
        drawDeathFlash(ctx, world);
      }

      for (const p of world.particles) drawParticle(ctx, p);
    },
  };
}

function drawMagneticGrid(ctx, world, W, H) {
  // Subtle horizontal field lines that drift left, sells the "tokamak cross-section" feel.
  const offset = (world.elapsed * 30) % 40;
  ctx.strokeStyle = THEME.colors.bgGrid;
  ctx.lineWidth = 1;
  for (let y = 60; y < H; y += 40) {
    ctx.beginPath();
    for (let x = -offset; x < W; x += 6) {
      const wave = Math.sin((x + world.elapsed * 60) * 0.02 + y * 0.05) * 4;
      if (x === -offset) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function drawWalls(ctx, W, H) {
  const m = CONFIG.obstacle.wallMargin;
  ctx.fillStyle = THEME.colors.wall;
  ctx.fillRect(0, 0, W, m);
  ctx.fillRect(0, H - m, W, m);

  ctx.fillStyle = THEME.colors.wallEdge;
  ctx.fillRect(0, m - 2, W, 2);
  ctx.fillRect(0, H - m, W, 2);
}

function drawWallWarning(ctx, world, W, H) {
  const p = world.plasma;
  const m = CONFIG.obstacle.wallMargin;
  const warn = CONFIG.plasma.wallWarningDistance;
  const distTop = p.pos.y - p.radius - m;
  const distBot = (H - m) - (p.pos.y + p.radius);

  if (distTop < warn) {
    const t = 1 - distTop / warn;
    ctx.fillStyle = THEME.colors.wallWarning;
    ctx.globalAlpha = Math.max(0, t) * (0.5 + 0.5 * Math.sin(world.elapsed * 12));
    ctx.fillRect(0, m, W, 24);
    ctx.globalAlpha = 1;
  }
  if (distBot < warn) {
    const t = 1 - distBot / warn;
    ctx.fillStyle = THEME.colors.wallWarning;
    ctx.globalAlpha = Math.max(0, t) * (0.5 + 0.5 * Math.sin(world.elapsed * 12));
    ctx.fillRect(0, H - m - 24, W, 24);
    ctx.globalAlpha = 1;
  }
}

function drawDeathFlash(ctx, world) {
  // brief expanding red ring at last plasma position
  const p = world.plasma;
  const t = Math.min(1, world.elapsed % 1);
  ctx.strokeStyle = THEME.colors.danger;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, 30 + t * 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawParticle(ctx, p) {
  const alpha = Math.max(0, p.life / p.maxLife);
  ctx.globalAlpha = alpha;

  if (p.kind === 'fusion') {
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = THEME.colors.text;
    ctx.font = THEME.font.particleLabel;
    ctx.textAlign = 'left';
    ctx.fillText(p.text, p.pos.x + 8, p.pos.y - 4);
  } else if (p.kind === 'text') {
    ctx.fillStyle = p.color;
    ctx.font = p.font;
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.pos.x, p.pos.y);
  }

  ctx.globalAlpha = 1;
}
