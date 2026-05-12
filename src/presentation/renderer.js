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
  } else if (p.kind === 'phaseText') {
    drawPhaseText(ctx, p);
  } else if (p.kind === 'ignitionIntroText') {
    drawIgnitionIntroText(ctx, p);
  } else if (p.kind === 'ignitionMilestoneText') {
    drawIgnitionMilestoneText(ctx, p);
  } else if (p.kind === 'selfSustainText') {
    drawSelfSustainText(ctx, p);
  }

  ctx.globalAlpha = 1;
}

const DISPLAY_FONT = '"Inter", "Space Grotesk", "Noto Sans SC", "Noto Sans JP", "PingFang SC", "Hiragino Sans", system-ui, sans-serif';

function drawComboText(ctx, p) {
  const age = p.maxLife - p.life;
  const spec = THEME.combo[Math.min(Math.max(p.combo, 1), 5) - 1];
  const progressOut = clamp((age - 0.85) / 0.5, 0, 1);
  const y = p.pos.y - easeOutCubic(progressOut) * 80;
  const scale = getComboScale(age, spec.overshoot);
  const alpha = age < 0.85 ? 1 : 1 - easeInQuad(progressOut);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.pos.x, y);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${spec.weight} ${spec.fontSize}px ${DISPLAY_FONT}`;
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

function drawPhaseText(ctx, p) {
  const age = p.maxLife - p.life;
  const fadeIn = clamp(age / 0.25, 0, 1);
  const fadeOut = clamp((age - 1.45) / 0.35, 0, 1);
  const alpha = fadeIn * (1 - fadeOut);
  const scale = age < 0.25
    ? lerp(1.1, 1, easeOutBack(age / 0.25))
    : lerp(1, 0.95, easeOutCubic(fadeOut));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.pos.x, p.pos.y);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.font = `900 60px ${DISPLAY_FONT}`;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
  ctx.lineWidth = 4;
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 18;
  ctx.strokeText(p.title, 0, 0);
  ctx.fillStyle = p.color;
  ctx.fillText(p.title, 0, 0);

  if (p.subtitle) {
    ctx.shadowBlur = 0;
    ctx.font = `600 22px ${DISPLAY_FONT}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(p.subtitle, 0, 54);
  }
  ctx.restore();
}

function drawIgnitionIntroText(ctx, p) {
  const age = p.maxLife - p.life;
  const out = clamp((age - 1.4) / 0.3, 0, 1);
  const y = p.pos.y - easeOutCubic(out) * 60;
  const alpha = (1 - out) * clamp(age / 0.18, 0, 1);
  let scale = 1;
  if (age < 0.4) scale = lerp(0.5, 1.25, easeOutBack(age / 0.4));
  else if (age < 0.62) scale = lerp(1.25, 1, easeOutCubic((age - 0.4) / 0.22));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.pos.x, y);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 72px ${DISPLAY_FONT}`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.lineWidth = 5;
  ctx.shadowColor = THEME.colors.fusionGold;
  ctx.shadowBlur = 26;
  ctx.strokeText(p.title, 0, 0);
  ctx.fillStyle = THEME.colors.fusionGold;
  ctx.fillText(p.title, 0, 0);

  const subtitleAlpha = clamp((age - 0.3) / 0.3, 0, 1) * (1 - out);
  ctx.globalAlpha = subtitleAlpha;
  ctx.shadowBlur = 8;
  ctx.font = `800 36px ${DISPLAY_FONT}`;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText(p.subtitle, 0, 62);
  ctx.fillStyle = THEME.colors.text;
  ctx.fillText(p.subtitle, 0, 62);
  ctx.restore();
}

function drawIgnitionMilestoneText(ctx, p) {
  const age = p.maxLife - p.life;
  const out = clamp((age - 1) / 0.3, 0, 1);
  const scale = age < 0.3 ? lerp(1.4, 1, easeOutBack(age / 0.3)) : 1;
  const fontSize = p.milestone >= 15 ? 24 : p.milestone >= 10 ? 22 : 20;

  ctx.save();
  ctx.globalAlpha = 1 - out;
  ctx.translate(p.pos.x, p.pos.y);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${fontSize}px ${DISPLAY_FONT}`;
  ctx.strokeStyle = p.milestone >= 15 ? THEME.colors.fusionGold : 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = p.milestone >= 15 ? 3 : 2;
  ctx.shadowColor = THEME.colors.fusionGold;
  ctx.shadowBlur = 14;
  ctx.strokeText(p.text, 0, 0);
  ctx.fillStyle = p.color;
  ctx.fillText(p.text, 0, 0);
  ctx.restore();
}

function drawSelfSustainText(ctx, p) {
  const age = p.maxLife - p.life;
  const out = clamp((age - 2) / 0.5, 0, 1);
  const y = p.pos.y - easeOutCubic(out) * 100;
  const alpha = (1 - out) * clamp(age / 0.2, 0, 1);
  let titleScale = 1;
  if (age < 0.5) titleScale = lerp(0.3, 1.4, easeOutBack(age / 0.5));
  else if (age < 0.75) titleScale = lerp(1.4, 1, easeOutCubic((age - 0.5) / 0.25));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.translate(p.pos.x, y);
  ctx.scale(titleScale, titleScale);
  ctx.font = `900 96px ${DISPLAY_FONT}`;
  ctx.strokeStyle = THEME.colors.fusionGold;
  ctx.lineWidth = 4;
  ctx.shadowColor = THEME.colors.text;
  ctx.shadowBlur = 28;
  ctx.strokeText(p.title, 0, 0);
  ctx.fillStyle = THEME.colors.text;
  ctx.fillText(p.title, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha * clamp((age - 0.4) / 0.3, 0, 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 64px ${DISPLAY_FONT}`;
  ctx.shadowColor = THEME.colors.fusionGold;
  ctx.shadowBlur = 18;
  ctx.fillStyle = THEME.colors.fusionGold;
  ctx.fillText(p.subtitle, p.pos.x, y + 78);
  ctx.globalAlpha = alpha * 0.7 * clamp((age - 0.8) / 0.3, 0, 1);
  ctx.font = `700 18px ${DISPLAY_FONT}`;
  ctx.fillStyle = THEME.colors.text;
  ctx.fillText(p.footnote, p.pos.x, y + 122);
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
