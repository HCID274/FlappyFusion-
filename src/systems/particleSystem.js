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

function makeFloatingText(x, y, text, life, color, font) {
  return {
    id: `pt${nextId++}`,
    kind: 'text',
    pos: { x, y },
    vel: { x: 0, y: -30 },
    life,
    maxLife: life,
    text,
    color,
    font: font || THEME.font.floatLg,
  };
}

function makeParticleScoreText(x, y, score) {
  return {
    id: `pt${nextId++}`,
    kind: 'text',
    pos: { x, y: y + (Math.random() - 0.5) * 16 },
    vel: { x: 0, y: -75 },
    life: 0.4,
    maxLife: 0.4,
    text: `+${score}`,
    color: THEME.colors.electron,
    font: 'bold 20px ui-monospace, "SF Mono", Menlo, monospace',
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
    pos: { x: CONFIG.canvas.width / 2, y: CONFIG.canvas.height * 0.34 },
    vel: { x: 0, y: 0 },
    life: 2.5,
    maxLife: 2.5,
    title: text.title,
    subtitle: text.subtitle,
    footnote: text.footnote,
  };
}

function makeFusionParticle(x, y, label, color, vx, vy) {
  return {
    id: `pt${nextId++}`,
    kind: 'fusion',
    pos: { x, y },
    vel: { x: vx, y: vy },
    life: CONFIG.particle.fusionLifetime,
    maxLife: CONFIG.particle.fusionLifetime,
    text: label,
    color,
    radius: 4,
  };
}

export function createParticleSystem(eventBus, world) {
  eventBus.on(EV.COMBO_INCREMENT, ({ x, y, combo, score }) => {
    world.particles.push(makeComboText(x, y - 30, combo, score));
  });

  eventBus.on(EV.FUSION_TRIGGERED, ({ x, y }) => {
    world.particles.push(makeFusionParticle(x, y, getParticleLabel('he4'), THEME.colors.he4, -90, 60));
    world.particles.push(makeFusionParticle(x, y, getParticleLabel('neutron'), THEME.colors.neutron, 120, -80));
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
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        p.life -= dt;
        if (p.life <= 0) world.particles.splice(i, 1);
      }
    },
  };
}
