// Spawns and ages all visual particles: fusion ejecta, milestone text, instability labels.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { THEME } from '../theme.js';
import { getParticleLabel } from '../content.js';

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
  eventBus.on(EV.FUSION_TRIGGERED, ({ x, y }) => {
    world.particles.push(makeFusionParticle(x, y, getParticleLabel('he4'), THEME.colors.he4, -90, 60));
    world.particles.push(makeFusionParticle(x, y, getParticleLabel('neutron'), THEME.colors.neutron, 120, -80));
    world.particles.push(makeFloatingText(x, y - 30, getParticleLabel('fusionScore'), 0.8, THEME.colors.fusionGold, THEME.font.floatSm));
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
