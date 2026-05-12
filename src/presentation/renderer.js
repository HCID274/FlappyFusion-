// Renders the canvas. Reads world state, never mutates.
// Z-order: bg → walls → magnetic field → obstacles → particle stream → collectibles → plasma → particles → wall warning.

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
      for (const b of world.boosts) b.render(ctx);
      for (const h of world.hazards) h.render(ctx);
      for (const e of world.particleStream) if (!e.collected) drawStreamParticle(ctx, e, world);
      for (const c of world.collectibles) if (!c.collected) c.render(ctx);

      if (world.status === 'playing' && world.plasma.alive) {
        drawWallWarning(ctx, world, W, H);
        drawNbiGlow(ctx, world);
        world.plasma.render(ctx);
      } else if (world.status === 'dead') {
        drawDeathFlash(ctx, world);
      }

      for (const p of world.particles) drawParticle(ctx, p);
      drawRedFlash(ctx, world, W, H);
    },
  };
}

function drawStreamParticle(ctx, p, world) {
  const wobbleY = Math.sin(world.elapsed * 8 + p.wobble) * 2;
  const x = p.pos.x;
  const y = p.pos.y + wobbleY;
  ctx.save();
  ctx.shadowColor = THEME.colors.electron;
  ctx.shadowBlur = 8;
  ctx.fillStyle = THEME.colors.electron;
  ctx.beginPath();
  ctx.arc(x, y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(170, 255, 255, 0.58)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, p.radius + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
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

function drawNbiGlow(ctx, world) {
  if (world.nbiGlowT <= 0) return;
  const p = world.plasma;
  const alpha = Math.min(0.45, world.nbiGlowT / CONFIG.boosts.nbi.glowDuration);
  const r = p.radius * 3.2;
  const grad = ctx.createRadialGradient(p.pos.x, p.pos.y, 0, p.pos.x, p.pos.y, r);
  grad.addColorStop(0, `rgba(255, 204, 68, ${alpha})`);
  grad.addColorStop(1, 'rgba(255, 204, 68, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawRedFlash(ctx, world, W, H) {
  if (world.redFlashT <= 0) return;
  ctx.fillStyle = THEME.colors.danger;
  ctx.globalAlpha = Math.min(0.28, world.redFlashT / CONFIG.hazards.tungsten.redFlashDuration * 0.28);
  ctx.fillRect(0, 0, W, H);
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
    ctx.textBaseline = 'middle';
    const lines = String(p.text).split('\n');
    const lineHeight = 20;
    const startY = p.pos.y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], p.pos.x, startY + i * lineHeight);
    }
  } else if (p.kind === 'comboText') {
    drawComboText(ctx, p);
  }

  ctx.globalAlpha = 1;
}

function drawComboText(ctx, p) {
  const age = p.maxLife - p.life;
  const spec = THEME.combo[Math.min(Math.max(p.combo, 1), 5) - 1];
  const progressOut = clamp((age - 0.85) / 0.5, 0, 1);
  const y = p.pos.y - easeOutCubic(progressOut) * 80;
  const scale = getComboScale(age, spec.overshoot);
  const alpha = age < 0.85 ? 1 : 1 - easeInQuad(progressOut);
  const fontFamily = '"Inter", "Space Grotesk", "Noto Sans SC", "Noto Sans JP", "PingFang SC", "Hiragino Sans", system-ui, sans-serif';

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.pos.x, y);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${spec.weight} ${spec.fontSize}px ${fontFamily}`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = spec.stroke;
  ctx.lineWidth = spec.strokeWidth;
  ctx.shadowColor = spec.color;
  ctx.shadowBlur = spec.shadowBlur;
  ctx.strokeText(p.text, 0, 0);
  ctx.fillStyle = spec.color;
  ctx.fillText(p.text, 0, 0);

  if (p.combo >= 5) {
    ctx.shadowColor = THEME.colors.fusionGold;
    ctx.shadowBlur = 18;
    ctx.fillText(p.text, 0, 0);
  }
  ctx.restore();
}

function getComboScale(age, overshoot) {
  if (age < 0.08) {
    return lerp(0.4, overshoot, easeOutBack(age / 0.08));
  }
  if (age < 0.16) {
    return lerp(overshoot, 1, easeOutQuad((age - 0.08) / 0.08));
  }
  if (age < 0.85) {
    return 1 + Math.sin((age - 0.16) * Math.PI * 4) * 0.04;
  }
  return lerp(1, 0.95, easeOutCubic((age - 0.85) / 0.5));
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
function easeInQuad(t) { return t * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
