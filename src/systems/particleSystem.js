// Spawns and ages all visual particles: fusion ejecta, milestone text, instability labels.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { THEME } from '../theme.js';
import { scoreForPhase } from '../scoreMath.js';
import {
  getComboLabel,
  getIgnitionIntroText,
  getIgnitionMilestoneText,
  getParticleLabel,
  getPhaseText,
  getSelfSustainText,
} from '../content.js';

let nextId = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t) {
  return t * t * t;
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function makeTextMotion(x, y, dx, dy) {
  return {
    type: 'breathingFloat',
    originX: x,
    originY: y,
    dx,
    dy,
  };
}

function segmentedMotionProgress(age, maxLife, motion) {
  const fastDuration = Math.min(motion.fastDuration, maxLife * motion.fastMaxRatio);
  const slowDuration = Math.min(motion.slowDuration, Math.max(0, maxLife - fastDuration) * motion.slowMaxRatio);
  const fastShare = motion.fastShare;
  const slowShare = motion.slowShare;

  if (age <= fastDuration) {
    return fastShare * easeOutCubic(clamp(age / Math.max(0.001, fastDuration), 0, 1));
  }

  if (age <= fastDuration + slowDuration) {
    const t = clamp((age - fastDuration) / Math.max(0.001, slowDuration), 0, 1);
    return fastShare + slowShare * easeInOutSine(t);
  }

  const t = clamp((age - fastDuration - slowDuration) / Math.max(0.001, maxLife - fastDuration - slowDuration), 0, 1);
  return fastShare + slowShare + (1 - fastShare - slowShare) * easeInCubic(t);
}

function breathingTextProgress(age, maxLife) {
  const cfg = CONFIG.particle;
  return segmentedMotionProgress(age, maxLife, {
    fastDuration: cfg.textMotionFastDuration,
    slowDuration: cfg.textMotionSlowDuration,
    fastShare: cfg.textMotionFastShare,
    slowShare: cfg.textMotionSlowShare,
    fastMaxRatio: 0.45,
    slowMaxRatio: 0.7,
  });
}

function fusionLabelProgress(age, maxLife) {
  const cfg = CONFIG.particle;
  return segmentedMotionProgress(age, maxLife, {
    fastDuration: cfg.fusionLabelFastDuration,
    slowDuration: cfg.fusionLabelHoldDuration,
    fastShare: cfg.fusionLabelFastShare,
    slowShare: cfg.fusionLabelHoldShare,
    fastMaxRatio: 0.35,
    slowMaxRatio: 0.75,
  });
}

function makeFloatingText(x, y, text, life, color, font) {
  const distance = Math.max(34, life * 30);
  return {
    id: `pt${nextId++}`,
    kind: 'text',
    pos: { x, y },
    life,
    maxLife: life,
    text,
    color,
    font: font || THEME.font.floatLg,
    strokeStyle: 'rgba(0, 0, 0, 0.68)',
    strokeWidth: 3,
    shadowColor: color,
    shadowBlur: 7,
    motion: makeTextMotion(x, y, 0, -distance),
  };
}

function makeParticleScoreText(x, y, score) {
  const startY = y + (Math.random() - 0.5) * 16;
  return {
    id: `pt${nextId++}`,
    kind: 'text',
    pos: { x, y: startY },
    life: CONFIG.particle.scoreTextLifetime,
    maxLife: CONFIG.particle.scoreTextLifetime,
    text: `+${score}`,
    color: THEME.colors.electron,
    font: 'bold 24px ui-monospace, "SF Mono", Menlo, monospace',
    strokeStyle: 'rgba(0, 8, 18, 0.82)',
    strokeWidth: 3,
    shadowColor: THEME.colors.electron,
    shadowBlur: 10,
    motion: makeTextMotion(x, startY, 0, -CONFIG.particle.scoreTextDistance),
  };
}

function makeComboText(x, y, combo, score) {
  return {
    id: `pt${nextId++}`,
    kind: 'comboText',
    pos: { x, y },
    vel: { x: 0, y: 0 },
    life: 1.35,
    maxLife: 1.35,
    text: getComboLabel(combo, score),
    combo,
    score,
  };
}

function estimateComboSpriteHalfHeight(spec) {
  return spec.fontSize * 0.65 + spec.strokeWidth + spec.shadowBlur + 6;
}

function getComboTextPosition(world, combo) {
  const plasma = world.plasma?.pos || { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height / 2 };
  const inLowerHalf = plasma.y >= CONFIG.canvas.height / 2;
  const comboTier = Math.min(Math.max(combo, 1), THEME.combo.length);
  const spec = THEME.combo[comboTier - 1];
  const floatUpDistance = 80;
  const halfTextWidth = comboTier >= 5 ? 260 : 190;
  const halfTextHeight = estimateComboSpriteHalfHeight(spec);
  const maxVisualHalfHeight = halfTextHeight * spec.overshoot;
  const topHudBottom = 82;
  const ignitionTop = world.ignitionPhase?.active ? CONFIG.canvas.height - 112 : CONFIG.canvas.height - 48;
  const targetY = inLowerHalf ? 150 : 450;
  const followX = CONFIG.canvas.width / 2 + clamp((plasma.x - CONFIG.canvas.width / 2) * 0.18, -72, 72);

  return {
    x: clamp(followX, halfTextWidth, CONFIG.canvas.width - halfTextWidth),
    y: clamp(
      targetY,
      topHudBottom + floatUpDistance + halfTextHeight,
      ignitionTop - maxVisualHalfHeight,
    ),
  };
}

function makePhaseText(phase) {
  const text = getPhaseText(phase);
  return {
    id: `pt${nextId++}`,
    kind: 'phaseText',
    pos: { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height * 0.3 },
    vel: { x: 0, y: 0 },
    life: 1.8,
    maxLife: 1.8,
    title: text.title,
    subtitle: text.subtitle,
    color: THEME.phase[phase] || THEME.colors.fusionGold,
  };
}

function makeIgnitionIntroText() {
  const text = getIgnitionIntroText();
  return {
    id: `pt${nextId++}`,
    kind: 'ignitionIntroText',
    pos: { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height * 0.34 },
    vel: { x: 0, y: 0 },
    life: 1.7,
    maxLife: 1.7,
    title: text.title,
    subtitle: text.subtitle,
  };
}

function makeIgnitionMilestoneText(milestone) {
  const text = getIgnitionMilestoneText(milestone);
  if (!text) return null;
  return {
    id: `pt${nextId++}`,
    kind: 'ignitionMilestoneText',
    pos: { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height - 78 },
    vel: { x: 0, y: -8 },
    life: 1.3,
    maxLife: 1.3,
    text,
    milestone,
    color: milestone >= 15 ? THEME.colors.text : THEME.colors.fusionGold,
  };
}

function makeSelfSustainText() {
  const text = getSelfSustainText();
  return {
    id: `pt${nextId++}`,
    kind: 'selfSustainText',
    pos: { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height * 0.24 },
    vel: { x: 0, y: 0 },
    life: 2.5,
    maxLife: 2.5,
    title: text.title,
    subtitle: text.subtitle,
    footnote: text.footnote,
  };
}

function makeFusionParticle(x, y, label, color, vx, vy, radius = 4, life = CONFIG.particle.fusionLifetime) {
  const particle = {
    id: `pt${nextId++}`,
    kind: 'fusion',
    pos: { x, y },
    life,
    maxLife: life,
    text: label,
    color,
    radius,
  };

  if (label) {
    particle.motion = {
      type: 'fusionLabel',
      originX: x,
      originY: y,
      dx: vx * life * 0.82,
      dy: vy * life * 0.82,
    };
  } else {
    particle.vel = { x: vx, y: vy };
  }

  return particle;
}

function makeFusionSpark(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 85 + Math.random() * 115;
  const radius = 1.8 + Math.random() * 2.2;
  const life = 0.32 + Math.random() * 0.18;
  const color = Math.random() < 0.5 ? THEME.colors.fusionGold : THEME.colors.text;
  return makeFusionParticle(
    x,
    y,
    '',
    color,
    Math.cos(angle) * speed,
    Math.sin(angle) * speed,
    radius,
    life,
  );
}

export function createParticleSystem(eventBus, world) {
  eventBus.on(EV.COMBO_INCREMENT, ({ combo, score }) => {
    const pos = getComboTextPosition(world, combo);
    world.particles.push(makeComboText(pos.x, pos.y, combo, score));
  });

  eventBus.on(EV.FUSION_TRIGGERED, ({ x, y }) => {
    const fx = Number.isFinite(x) ? x : CONFIG.canvas.width / 2;
    const fy = Number.isFinite(y) ? y : CONFIG.canvas.height / 2;
    world.particles.push(makeFusionParticle(fx, fy, getParticleLabel('he4'), THEME.colors.he4, -90, 60));
    world.particles.push(makeFusionParticle(fx, fy, getParticleLabel('neutron'), THEME.colors.neutron, 120, -80));
    for (let i = 0; i < CONFIG.fusion.impactParticleCount; i++) {
      world.particles.push(makeFusionSpark(fx, fy));
    }
  });

  eventBus.on(EV.PARTICLE_COLLECTED, ({ x, y }) => {
    world.particles.push(makeParticleScoreText(x, y, scoreForPhase(CONFIG.score.perParticle, world.phase)));
  });

  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    if (to === 'IGNITION_PREP') return;
    if (to === 'RECORD' && world.selfSustained) return;
    if (to === 'IGNITION_BURST') {
      world.particles.push(makeIgnitionIntroText());
      return;
    }
    world.particles.push(makePhaseText(to));
  });

  eventBus.on(EV.IGNITION_TICK, ({ milestone }) => {
    if (!milestone) return;
    const p = makeIgnitionMilestoneText(milestone);
    if (p) world.particles.push(p);
  });

  eventBus.on(EV.SELF_SUSTAIN_ACHIEVED, () => {
    world.particles.push(makeSelfSustainText());
  });

  eventBus.on(EV.TEMP_MILESTONE, ({ text }) => {
    world.particles.push(makeFloatingText(
      CONFIG.canvas.width / 2,
      CONFIG.canvas.height * 0.32,
      text,
      CONFIG.particle.milestoneLifetime,
      THEME.colors.fusionGold,
    ));
  });

  eventBus.on(EV.INSTABILITY_SPAWNED, ({ name }) => {
    world.particles.push(makeFloatingText(
      CONFIG.canvas.width / 2,
      CONFIG.canvas.height * 0.42,
      name,
      CONFIG.particle.instabilityLabelLifetime,
      THEME.colors.danger,
      THEME.font.floatSm,
    ));
  });

  eventBus.on(EV.COLLECTIBLE_HIT, ({ collectible }) => {
    if (collectible.type !== 'Li6') return;
    world.particles.push(makeFloatingText(
      CONFIG.canvas.width / 2,
      CONFIG.canvas.height * 0.36,
      getParticleLabel('lithiumBreeding', { score: scoreForPhase(CONFIG.score.perLithium, world.phase) }),
      CONFIG.particle.sceneTextLifetime,
      THEME.colors.lithium6,
      THEME.font.floatSm,
    ));
  });

  eventBus.on(EV.HAZARD_HIT, ({ type }) => {
    if (type !== 'tungsten') return;
    world.particles.push(makeFloatingText(
      CONFIG.canvas.width / 2,
      CONFIG.canvas.height * 0.36,
      getParticleLabel('tungstenCooling'),
      CONFIG.particle.sceneTextLifetime,
      THEME.colors.tungsten,
      THEME.font.floatSm,
    ));
  });

  eventBus.on(EV.BOOST_TRIGGERED, ({ type }) => {
    if (type !== 'nbi') return;
    world.particles.push(makeFloatingText(
      CONFIG.canvas.width / 2,
      CONFIG.canvas.height * 0.36,
      getParticleLabel('nbiHeating'),
      CONFIG.particle.sceneTextLifetime,
      THEME.colors.fusionGold,
      THEME.font.floatSm,
    ));
  });

  return {
    update(dt) {
      for (let i = world.particles.length - 1; i >= 0; i--) {
        const p = world.particles[i];
        if (p.motion?.type === 'breathingFloat') {
          const age = p.maxLife - p.life + dt;
          const progress = breathingTextProgress(age, p.maxLife);
          p.pos.x = p.motion.originX + p.motion.dx * progress;
          p.pos.y = p.motion.originY + p.motion.dy * progress;
        } else if (p.motion?.type === 'fusionLabel') {
          const age = p.maxLife - p.life + dt;
          const progress = fusionLabelProgress(age, p.maxLife);
          p.pos.x = p.motion.originX + p.motion.dx * progress;
          p.pos.y = p.motion.originY + p.motion.dy * progress;
        } else {
          p.pos.x += (p.vel?.x || 0) * dt;
          p.pos.y += (p.vel?.y || 0) * dt;
        }
        p.life -= dt;
        if (p.life <= 0) world.particles.splice(i, 1);
      }
    },
  };
}
