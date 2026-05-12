import { CONFIG } from '../config.js';
import { THEME } from '../theme.js';

export function createPlasma() {
  const p = {
    pos: { x: CONFIG.plasma.startX, y: CONFIG.plasma.startY },
    vel: { x: 0, y: 0 },
    alive: true,
    trail: [],
    pulseCooldown: 0,
    radius: CONFIG.plasma.radius,
    pulseFlashT: 0,
  };
  p.render = (ctx) => drawPlasma(ctx, p);
  return p;
}

function drawPlasma(ctx, p) {
  // trail (oldest first → faintest)
  for (let i = 0; i < p.trail.length; i++) {
    const t = p.trail[i];
    const age = i / p.trail.length;
    ctx.globalAlpha = 0.4 * age;
    ctx.fillStyle = THEME.colors.plasma;
    ctx.beginPath();
    ctx.arc(t.x, t.y, p.radius * 0.6 * age, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // glow
  const glowR = p.radius * THEME.size.plasmaGlow * (1 + p.pulseFlashT * 0.4);
  const grad = ctx.createRadialGradient(p.pos.x, p.pos.y, 0, p.pos.x, p.pos.y, glowR);
  grad.addColorStop(0, THEME.colors.plasmaCore);
  grad.addColorStop(0.4, THEME.colors.plasma);
  grad.addColorStop(1, 'rgba(255, 68, 170, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // core
  ctx.fillStyle = THEME.colors.plasmaCore;
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.radius * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // pulse ripple (青色磁力线波纹)
  if (p.pulseFlashT > 0) {
    ctx.strokeStyle = THEME.colors.magneticLine;
    ctx.globalAlpha = p.pulseFlashT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.pos.x, p.pos.y, p.radius * (1.2 + (1 - p.pulseFlashT) * 1.5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
