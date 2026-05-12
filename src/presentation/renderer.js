// Renders the canvas. Reads world state, never mutates.
// Z-order: background → phase glow → parallax field → playfield → foreground particles → screen overlays.

import { CONFIG } from '../config.js';
import { THEME } from '../theme.js';
import { getImage } from '../assetLoader.js';
import {
  getComboLabel,
  getIgnitionIntroText,
  getIgnitionMilestoneText,
  getPhaseText,
  getSelfSustainText,
  onLocaleChange,
} from '../content.js';

export function createRenderer(ctx, world) {
  scheduleTextSpritePrewarm();
  onLocaleChange(() => {
    textSpriteCache.clear();
    scheduleTextSpritePrewarm();
  });

  return {
    render() {
      const W = CONFIG.canvas.width;
      const H = CONFIG.canvas.height;
      const fx = world.screenFx;

      ctx.fillStyle = THEME.colors.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      if (fx) ctx.translate(fx.shakeX || 0, fx.shakeY || 0);

      drawBackgroundPanel(ctx, world, W, H);
      drawPhaseGlow(ctx, world, W, H);
      drawParallaxMagneticLines(ctx, world, W, H);
      drawWalls(ctx, W, H);

      for (const ob of world.obstacles) ob.render(ctx);
      for (const e of world.particleStream) if (!e.collected) drawStreamParticle(ctx, e, world);
      for (const c of world.collectibles) if (!c.collected) c.render(ctx);
      for (const b of world.boosts) b.render(ctx);
      for (const h of world.hazards) h.render(ctx);

      if (world.status === 'playing' && world.plasma.alive) {
        drawWallWarning(ctx, world, W, H);
        drawNbiGlow(ctx, world);
        world.plasma.render(ctx);
      } else if (world.status === 'dead') {
        drawDeathFlash(ctx, world);
      }

      drawScreenBurstParticles(ctx, world);
      for (const p of world.particles) drawParticle(ctx, p);
      ctx.restore();

      drawRedFlash(ctx, world, W, H);
      drawScreenFxOverlay(ctx, world, W, H);
    },
  };
}

function drawBackgroundPanel(ctx, world, W, H) {
  const bg = getImage('backgroundTokamak');
  if (!bg) {
    ctx.fillStyle = THEME.colors.bg;
    ctx.fillRect(-12, -12, W + 24, H + 24);
    drawFallbackMagneticLines(ctx, W, H);
    return;
  }

  const scale = Math.max((W + 28) / bg.width, (H + 28) / bg.height);
  const dw = bg.width * scale;
  const dh = bg.height * scale;
  const x = (W - dw) / 2 - 6;
  const y = (H - dh) / 2 - 4;
  ctx.drawImage(bg, x, y, dw, dh);

  const scan = ctx.createLinearGradient(0, 0, W, H);
  scan.addColorStop(0, 'rgba(3, 8, 24, 0.12)');
  scan.addColorStop(0.5, 'rgba(3, 8, 24, 0.34)');
  scan.addColorStop(1, 'rgba(3, 8, 24, 0.18)');
  ctx.fillStyle = scan;
  ctx.fillRect(-12, -12, W + 24, H + 24);

  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.46, 60, W * 0.5, H * 0.48, W * 0.72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.52)');
  ctx.fillStyle = vignette;
  ctx.fillRect(-12, -12, W + 24, H + 24);
}

function drawFallbackMagneticLines(ctx, W, H) {
  ctx.save();
  ctx.strokeStyle = 'rgba(68, 221, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const y = 90 + i * 78;
    ctx.beginPath();
    ctx.ellipse(W * 0.5, y, W * 0.58, 34 + i * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPhaseGlow(ctx, world, W, H) {
  const fx = world.screenFx;
  const glow = fx?.phaseGlow;
  const phase = world.phase || 'IGNITION_PREP';
  const fallbackKey = CONFIG.phases.rules[phase]?.glow || 'deep';
  const from = THEME.glow[glow?.from] || THEME.glow[fallbackKey] || THEME.glow.deep;
  const to = THEME.glow[glow?.to] || THEME.glow[fallbackKey] || THEME.glow.deep;
  const t = clamp(glow?.t ?? 1, 0, 1);
  const color = mixHex(from.color, to.color, easeOutCubic(t));
  const baseAlpha = lerp(from.alpha, to.alpha, easeOutCubic(t));
  const breathe = 0.78 + Math.sin(world.elapsed * Math.PI * 2 * 0.6) * 0.22;
  const alpha = baseAlpha * breathe;

  const core = ctx.createRadialGradient(W * 0.56, H * 0.48, 30, W * 0.52, H * 0.5, W * 0.66);
  core.addColorStop(0, rgba(color, alpha));
  core.addColorStop(0.58, rgba(color, alpha * 0.42));
  core.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = core;
  ctx.fillRect(-12, -12, W + 24, H + 24);

  if (phase === 'IGNITION_BURST') {
    drawGoldVignette(ctx, W, H, 0.16 + Math.sin(world.elapsed * 3) * 0.03);
  }
}

function drawParallaxMagneticLines(ctx, world, W, H) {
  const offset = (world.elapsed * 15) % 220;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const y = 105 + i * 86;
    const alpha = 0.14 + i * 0.025;
    ctx.strokeStyle = `rgba(68, 221, 255, ${alpha})`;
    ctx.lineWidth = i === 2 ? 2 : 1;
    for (let x = -260 - offset; x < W + 260; x += 220) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 52, y - 34, x + 132, y + 34, x + 220, y);
      ctx.stroke();
    }
  }
  ctx.restore();
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

function drawScreenBurstParticles(ctx, world) {
  const particles = world.screenFx?.burstParticles;
  if (!particles?.length) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * (0.8 + (1 - alpha) * 0.8), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawScreenFxOverlay(ctx, world, W, H) {
  const fx = world.screenFx;
  if (!fx) return;

  if (fx.cornerGlowT > 0) {
    const alpha = easeOutCubic(fx.cornerGlowT / CONFIG.combo.screenFx.glowDuration) * 0.28;
    drawCornerGlow(ctx, W, H, alpha);
  }

  if (fx.radialPulseT > 0) {
    const progress = clamp(1 - fx.radialPulseT / Math.max(0.001, fx.radialPulseDuration), 0, 1);
    const alpha = (1 - easeOutCubic(progress)) * 0.22;
    const radius = lerp(80, W * 0.7, easeOutCubic(progress));
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.48, 0, W * 0.5, H * 0.48, radius);
    grad.addColorStop(0, `rgba(255, 204, 68, ${alpha})`);
    grad.addColorStop(0.55, `rgba(255, 136, 68, ${alpha * 0.45})`);
    grad.addColorStop(1, 'rgba(255, 204, 68, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  if (fx.ignitionEntryT > 0) {
    drawIgnitionEntryOverlay(ctx, fx, W, H);
  }

  if (fx.selfSustainBurstT > 0 || fx.selfSustainVignetteT > 0) {
    drawSelfSustainOverlay(ctx, fx, W, H);
  }

  if (fx.whiteFlashT > 0) {
    const alpha = (fx.whiteFlashT / CONFIG.combo.screenFx.whiteFlashDuration) * CONFIG.combo.screenFx.whiteFlashAlpha;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawCornerGlow(ctx, W, H, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const corners = [
    [0, 0],
    [W, 0],
    [0, H],
    [W, H],
  ];
  for (const [x, y] of corners) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 210);
    grad.addColorStop(0, `rgba(255, 204, 68, ${alpha})`);
    grad.addColorStop(1, 'rgba(255, 204, 68, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function drawIgnitionEntryOverlay(ctx, fx, W, H) {
  const age = CONFIG.ignitionPhase.enterFreezeDuration - fx.ignitionEntryT;
  const flashDur = CONFIG.ignitionPhase.enterFlashDuration;
  let whiteAlpha = 0;
  let goldAlpha = 0;

  if (age <= flashDur) {
    whiteAlpha = (age / flashDur) * 0.35;
  } else {
    const out = clamp((age - flashDur) / (CONFIG.ignitionPhase.enterFreezeDuration - flashDur), 0, 1);
    whiteAlpha = (1 - out) * 0.35;
    goldAlpha = easeOutCubic(out) * 0.25;
  }

  if (goldAlpha > 0) {
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 30, W * 0.5, H * 0.5, W * 0.72);
    grad.addColorStop(0, `rgba(255, 204, 68, ${goldAlpha})`);
    grad.addColorStop(0.7, `rgba(255, 136, 68, ${goldAlpha * 0.38})`);
    grad.addColorStop(1, 'rgba(255, 204, 68, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  if (whiteAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawSelfSustainOverlay(ctx, fx, W, H) {
  if (fx.selfSustainBurstT > 0) {
    const progress = 1 - fx.selfSustainBurstT / CONFIG.ignitionPhase.selfSustainSlowDuration;
    const alpha = progress < 0.45
      ? lerp(0, 0.6, easeOutCubic(progress / 0.45))
      : lerp(0.6, 0.2, easeOutCubic((progress - 0.45) / 0.55));
    const radius = lerp(80, W * 0.76, easeOutCubic(progress));
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, radius);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.78})`);
    grad.addColorStop(0.28, `rgba(255, 204, 68, ${alpha})`);
    grad.addColorStop(1, 'rgba(255, 204, 68, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  if (fx.selfSustainVignetteT > 0) {
    const alpha = Math.min(0.36, fx.selfSustainVignetteT / CONFIG.ignitionPhase.selfSustainVignetteDuration * 0.36);
    drawGoldVignette(ctx, W, H, alpha);
  }
}

function drawGoldVignette(ctx, W, H, alpha) {
  const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.22, W * 0.5, H * 0.5, W * 0.73);
  grad.addColorStop(0, 'rgba(255, 204, 68, 0)');
  grad.addColorStop(0.66, `rgba(255, 204, 68, ${alpha * 0.15})`);
  grad.addColorStop(1, `rgba(255, 204, 68, ${alpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
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
    drawTextParticle(ctx, p);
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
const textSpriteCache = new Map();
let measureContext = null;
let textSpritePrewarmQueued = false;

function getMeasureContext() {
  if (!measureContext) measureContext = createScratchCanvas(1, 1).getContext('2d');
  return measureContext;
}

function createScratchCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getFontSize(font) {
  const match = /(\d+(?:\.\d+)?)px/.exec(font);
  return match ? Number(match[1]) : 20;
}

function getTextSprite(key, commands) {
  const cached = textSpriteCache.get(key);
  if (cached) return cached;

  const renderScale = CONFIG.canvas.renderScale || 1;
  const measure = getMeasureContext();
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const cmd of commands) {
    measure.font = cmd.font;
    const width = measure.measureText(cmd.text).width;
    const fontSize = getFontSize(cmd.font);
    const extra = (cmd.strokeWidth || 0) + (cmd.shadowBlur || 0) + 6;
    left = Math.min(left, cmd.x - width / 2 - extra);
    right = Math.max(right, cmd.x + width / 2 + extra);
    top = Math.min(top, cmd.y - fontSize * 0.65 - extra);
    bottom = Math.max(bottom, cmd.y + fontSize * 0.65 + extra);
  }

  if (!Number.isFinite(left)) {
    return { canvas: createScratchCanvas(1, 1), x: 0, y: 0, width: 1, height: 1 };
  }

  const width = Math.max(1, Math.ceil(right - left));
  const height = Math.max(1, Math.ceil(bottom - top));
  const canvas = createScratchCanvas(
    Math.max(1, Math.ceil(width * renderScale)),
    Math.max(1, Math.ceil(height * renderScale)),
  );
  const c = canvas.getContext('2d');
  c.setTransform(renderScale, 0, 0, renderScale, -left * renderScale, -top * renderScale);

  for (const cmd of commands) {
    c.save();
    c.globalAlpha = cmd.alpha ?? 1;
    c.font = cmd.font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.shadowColor = cmd.shadowColor || 'transparent';
    c.shadowBlur = cmd.shadowBlur || 0;
    if (cmd.strokeStyle && cmd.strokeWidth > 0) {
      c.strokeStyle = cmd.strokeStyle;
      c.lineWidth = cmd.strokeWidth;
      c.strokeText(cmd.text, cmd.x, cmd.y);
    }
    if (cmd.fillStyle) {
      c.fillStyle = cmd.fillStyle;
      c.fillText(cmd.text, cmd.x, cmd.y);
    }
    c.restore();
  }

  const sprite = { canvas, x: left, y: top, width, height };
  textSpriteCache.set(key, sprite);
  return sprite;
}

function drawTextSprite(ctx, sprite) {
  ctx.drawImage(sprite.canvas, sprite.x, sprite.y, sprite.width, sprite.height);
}

function scheduleTextSpritePrewarm() {
  if (textSpritePrewarmQueued) return;
  textSpritePrewarmQueued = true;
  const run = () => {
    textSpritePrewarmQueued = false;
    prewarmTextSprites();
  };

  if (typeof globalThis.requestIdleCallback === 'function') {
    globalThis.requestIdleCallback(run, { timeout: 800 });
  } else {
    globalThis.setTimeout(run, 0);
  }
}

function prewarmTextSprites() {
  prewarmComboSprites();
  prewarmPhaseSprites();
  prewarmIgnitionSprites();
  prewarmSelfSustainSprites();
}

function prewarmComboSprites() {
  const multipliers = new Set(Object.values(CONFIG.phases.rules).map((rules) => rules.scoreMul ?? 1));
  for (let combo = 1; combo <= THEME.combo.length; combo++) {
    const tableIndex = Math.min(combo, CONFIG.combo.scoreTable.length) - 1;
    const baseScore = CONFIG.combo.scoreTable[tableIndex];
    for (const multiplier of multipliers) {
      const text = getComboLabel(combo, Math.round(baseScore * multiplier));
      getTextSprite(getComboSpriteKey(combo, text), buildComboTextCommands(combo, text));
    }
  }
}

function prewarmPhaseSprites() {
  for (const phase of Object.keys(CONFIG.phases.rules)) {
    if (phase === 'IGNITION_PREP') continue;
    const text = getPhaseText(phase);
    const color = THEME.phase[phase] || THEME.colors.fusionGold;
    getTextSprite(getPhaseSpriteKey(text.title, text.subtitle, color), buildPhaseTextCommands(text.title, text.subtitle, color));
  }
}

function prewarmIgnitionSprites() {
  const intro = getIgnitionIntroText();
  getTextSprite(getIgnitionIntroTitleKey(intro.title), buildIgnitionIntroTitleCommands(intro.title));
  getTextSprite(getIgnitionIntroSubtitleKey(intro.subtitle), buildIgnitionIntroSubtitleCommands(intro.subtitle));

  for (const milestone of CONFIG.ignitionPhase.progressMilestones) {
    const text = getIgnitionMilestoneText(milestone);
    if (!text) continue;
    const color = milestone >= 15 ? THEME.colors.text : THEME.colors.fusionGold;
    getTextSprite(getIgnitionMilestoneKey(text, milestone, color), buildIgnitionMilestoneCommands(text, milestone, color));
  }
}

function prewarmSelfSustainSprites() {
  const text = getSelfSustainText();
  for (const char of Array.from(text.title)) {
    getTextSprite(getSelfSustainTitleCharKey(char), buildSelfSustainTitleCommands(char));
  }
  getTextSprite(getSelfSustainSubtitleKey(text.subtitle), buildSelfSustainSubtitleCommands(text.subtitle));
  getTextSprite(getSelfSustainFootnoteKey(text.footnote), buildSelfSustainFootnoteCommands(text.footnote));
}

function drawTextParticle(ctx, p) {
  const lines = String(p.text).split('\n');
  const lineHeight = Math.max(18, getFontSize(p.font) * 1.15);
  const startY = -((lines.length - 1) * lineHeight) / 2;
  const commands = lines.map((line, i) => ({
    text: line,
    x: 0,
    y: startY + i * lineHeight,
    font: p.font,
    fillStyle: p.color,
  }));
  const sprite = getTextSprite(`text|${p.font}|${p.color}|${p.text}`, commands);
  ctx.save();
  ctx.translate(p.pos.x, p.pos.y);
  drawTextSprite(ctx, sprite);
  ctx.restore();
}

function drawComboText(ctx, p) {
  const age = p.maxLife - p.life;
  const comboTier = getComboTier(p.combo);
  const spec = THEME.combo[comboTier - 1];
  const progressOut = clamp((age - 0.85) / 0.5, 0, 1);
  const y = p.pos.y - easeOutCubic(progressOut) * 80;
  const scale = getComboScale(age, spec.overshoot);
  const alpha = age < 0.85 ? 1 : 1 - easeInQuad(progressOut);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(p.pos.x, y);
  ctx.scale(scale, scale);
  drawTextSprite(ctx, getTextSprite(getComboSpriteKey(comboTier, p.text), buildComboTextCommands(comboTier, p.text)));
  ctx.restore();
}

function getComboTier(combo) {
  return Math.min(Math.max(combo, 1), THEME.combo.length);
}

function getComboSpriteKey(comboTier, text) {
  return `combo|${comboTier}|${text}`;
}

function buildComboTextCommands(comboTier, text) {
  const spec = THEME.combo[comboTier - 1];
  const font = `${spec.weight} ${spec.fontSize}px ${DISPLAY_FONT}`;
  const commands = [
    {
      text,
      x: 0,
      y: 0,
      font,
      strokeStyle: spec.stroke,
      strokeWidth: spec.strokeWidth,
      fillStyle: spec.color,
      shadowColor: spec.color,
      shadowBlur: spec.shadowBlur,
    },
  ];
  if (comboTier >= 5) {
    commands.push({
      text,
      x: 0,
      y: 0,
      font,
      fillStyle: spec.color,
      shadowColor: THEME.colors.fusionGold,
      shadowBlur: 18,
    });
  }
  return commands;
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
  drawTextSprite(ctx, getTextSprite(getPhaseSpriteKey(p.title, p.subtitle, p.color), buildPhaseTextCommands(p.title, p.subtitle, p.color)));
  ctx.restore();
}

function getPhaseSpriteKey(title, subtitle, color) {
  return `phase|${title}|${subtitle}|${color}`;
}

function buildPhaseTextCommands(title, subtitle, color) {
  const commands = [{
    text: title,
    x: 0,
    y: 0,
    font: `900 60px ${DISPLAY_FONT}`,
    strokeStyle: 'rgba(0, 0, 0, 0.72)',
    strokeWidth: 4,
    fillStyle: color,
    shadowColor: color,
    shadowBlur: 18,
  }];
  if (subtitle) {
    commands.push({
      text: subtitle,
      x: 0,
      y: 54,
      font: `600 22px ${DISPLAY_FONT}`,
      fillStyle: 'rgba(255, 255, 255, 0.85)',
    });
  }
  return commands;
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
  const subtitleAlpha = clamp((age - 0.3) / 0.3, 0, 1) * (1 - out);
  drawTextSprite(ctx, getTextSprite(getIgnitionIntroTitleKey(p.title), buildIgnitionIntroTitleCommands(p.title)));
  ctx.globalAlpha = alpha * subtitleAlpha;
  drawTextSprite(ctx, getTextSprite(getIgnitionIntroSubtitleKey(p.subtitle), buildIgnitionIntroSubtitleCommands(p.subtitle)));
  ctx.restore();
}

function getIgnitionIntroTitleKey(title) {
  return `ignitionIntroTitle|${title}`;
}

function buildIgnitionIntroTitleCommands(title) {
  return [{
    text: title,
    x: 0,
    y: 0,
    font: `900 72px ${DISPLAY_FONT}`,
    strokeStyle: 'rgba(0, 0, 0, 0.75)',
    strokeWidth: 5,
    fillStyle: THEME.colors.fusionGold,
    shadowColor: THEME.colors.fusionGold,
    shadowBlur: 26,
  }];
}

function getIgnitionIntroSubtitleKey(subtitle) {
  return `ignitionIntroSubtitle|${subtitle}`;
}

function buildIgnitionIntroSubtitleCommands(subtitle) {
  return [{
    text: subtitle,
    x: 0,
    y: 62,
    font: `800 36px ${DISPLAY_FONT}`,
    strokeStyle: 'rgba(0, 0, 0, 0.7)',
    strokeWidth: 3,
    fillStyle: THEME.colors.text,
    shadowColor: THEME.colors.fusionGold,
    shadowBlur: 8,
  }];
}

function drawIgnitionMilestoneText(ctx, p) {
  const age = p.maxLife - p.life;
  const out = clamp((age - 1) / 0.3, 0, 1);
  const scale = age < 0.3 ? lerp(1.4, 1, easeOutBack(age / 0.3)) : 1;

  ctx.save();
  ctx.globalAlpha = 1 - out;
  ctx.translate(p.pos.x, p.pos.y);
  ctx.scale(scale, scale);
  drawTextSprite(ctx, getTextSprite(getIgnitionMilestoneKey(p.text, p.milestone, p.color), buildIgnitionMilestoneCommands(p.text, p.milestone, p.color)));
  ctx.restore();
}

function getIgnitionMilestoneKey(text, milestone, color) {
  return `ignitionMilestone|${text}|${milestone}|${color}`;
}

function buildIgnitionMilestoneCommands(text, milestone, color) {
  const fontSize = milestone >= 15 ? 24 : milestone >= 10 ? 22 : 20;
  return [{
    text,
    x: 0,
    y: 0,
    font: `800 ${fontSize}px ${DISPLAY_FONT}`,
    strokeStyle: milestone >= 15 ? THEME.colors.fusionGold : 'rgba(0, 0, 0, 0.7)',
    strokeWidth: milestone >= 15 ? 3 : 2,
    fillStyle: color,
    shadowColor: THEME.colors.fusionGold,
    shadowBlur: 14,
  }];
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
  ctx.translate(p.pos.x, y);
  ctx.scale(titleScale, titleScale);
  drawDelayedSelfSustainTitle(ctx, p.title, age);
  ctx.restore();

  ctx.save();
  ctx.translate(p.pos.x, y);
  ctx.globalAlpha = alpha * clamp((age - 0.4) / 0.3, 0, 1);
  drawTextSprite(ctx, getTextSprite(getSelfSustainSubtitleKey(p.subtitle), buildSelfSustainSubtitleCommands(p.subtitle)));
  ctx.globalAlpha = alpha * 0.7 * clamp((age - 0.8) / 0.3, 0, 1);
  drawTextSprite(ctx, getTextSprite(getSelfSustainFootnoteKey(p.footnote), buildSelfSustainFootnoteCommands(p.footnote)));
  ctx.restore();
}

function drawDelayedSelfSustainTitle(ctx, title, age) {
  const chars = Array.from(title);
  const font = `900 96px ${DISPLAY_FONT}`;
  const measure = getMeasureContext();
  measure.font = font;
  const widths = chars.map((char) => measure.measureText(char).width);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  let x = -totalWidth / 2;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const delay = i * 0.03;
    const localAlpha = clamp((age - delay) / 0.18, 0, 1);
    if (localAlpha <= 0) {
      x += widths[i];
      continue;
    }
    ctx.save();
    ctx.globalAlpha *= localAlpha;
    ctx.translate(x + widths[i] / 2, 0);
    drawTextSprite(ctx, getTextSprite(getSelfSustainTitleCharKey(char), buildSelfSustainTitleCommands(char)));
    ctx.restore();
    x += widths[i];
  }
}

function getSelfSustainTitleCharKey(char) {
  return `selfSustainTitleChar|${char}`;
}

function buildSelfSustainTitleCommands(title) {
  return [{
    text: title,
    x: 0,
    y: 0,
    font: `900 96px ${DISPLAY_FONT}`,
    strokeStyle: THEME.colors.fusionGold,
    strokeWidth: 4,
    fillStyle: THEME.colors.text,
    shadowColor: THEME.colors.text,
    shadowBlur: 28,
  }];
}

function getSelfSustainSubtitleKey(subtitle) {
  return `selfSustainSubtitle|${subtitle}`;
}

function buildSelfSustainSubtitleCommands(subtitle) {
  return [{
    text: subtitle,
    x: 0,
    y: 78,
    font: `900 64px ${DISPLAY_FONT}`,
    fillStyle: THEME.colors.fusionGold,
    shadowColor: THEME.colors.fusionGold,
    shadowBlur: 18,
  }];
}

function getSelfSustainFootnoteKey(footnote) {
  return `selfSustainFootnote|${footnote}`;
}

function buildSelfSustainFootnoteCommands(footnote) {
  return [{
    text: footnote,
    x: 0,
    y: 122,
    font: `700 18px ${DISPLAY_FONT}`,
    fillStyle: THEME.colors.text,
  }];
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

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3
    ? value.split('').map((c) => c + c).join('')
    : value;
  const n = Number.parseInt(full, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return {
    r: Math.round(lerp(ca.r, cb.r, t)),
    g: Math.round(lerp(ca.g, cb.g, t)),
    b: Math.round(lerp(ca.b, cb.b, t)),
  };
}

function rgba(color, alpha) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
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
