// Applies drift to plasma, consumes pulse impulses, scrolls all moving entities.
// Only acts during 'playing' status.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function lerpBySpeed(world, baseValue, highSpeedValue, highSpeedAt) {
  const speedRange = Math.max(1, highSpeedAt - CONFIG.scroll.baseSpeed);
  const t = clamp((world.scrollSpeed - CONFIG.scroll.baseSpeed) / speedRange, 0, 1);
  return baseValue + (highSpeedValue - baseValue) * t;
}

function getPulseImpulse(world) {
  const { pulseImpulse, pulseImpulseHighSpeed, pulseImpulseHighSpeedAt } = CONFIG.plasma;
  return lerpBySpeed(world, pulseImpulse, pulseImpulseHighSpeed, pulseImpulseHighSpeedAt);
}

function getDrift(world) {
  const { drift, driftHighSpeed, driftHighSpeedAt } = CONFIG.plasma;
  return lerpBySpeed(world, drift, driftHighSpeed, driftHighSpeedAt);
}

export function createPhysicsSystem(eventBus, world) {
  let pendingPulse = false;

  eventBus.on(EV.INPUT_PULSE, () => {
    if (world.status !== 'playing') return;
    if (world.plasma.pulseCooldown <= 0) {
      pendingPulse = true;
    }
  });

  eventBus.on(EV.GAME_RESET, () => { pendingPulse = false; });

  return {
    update(dt) {
      if (world.status !== 'playing') return;
      const p = world.plasma;

      if (pendingPulse) {
        p.vel.y = getPulseImpulse(world);
        p.pulseCooldown = CONFIG.plasma.pulseCooldownTime;
        p.pulseFlashT = 1;
        pendingPulse = false;
      }
      if (p.pulseCooldown > 0) p.pulseCooldown = Math.max(0, p.pulseCooldown - dt);
      if (p.pulseFlashT > 0) p.pulseFlashT = Math.max(0, p.pulseFlashT - dt * 3);
      if (world.redFlashT > 0) world.redFlashT = Math.max(0, world.redFlashT - dt);
      if (world.nbiGlowT > 0) world.nbiGlowT = Math.max(0, world.nbiGlowT - dt);

      p.vel.y += getDrift(world) * dt;
      if (p.vel.y > CONFIG.plasma.maxFallSpeed) p.vel.y = CONFIG.plasma.maxFallSpeed;
      if (p.vel.y < CONFIG.plasma.maxRiseSpeed) p.vel.y = CONFIG.plasma.maxRiseSpeed;
      p.pos.y += p.vel.y * dt;

      // trail history
      p.trail.push({ x: p.pos.x, y: p.pos.y });
      if (p.trail.length > CONFIG.plasma.trailLength) p.trail.shift();

      // scroll obstacles and collectibles
      const dx = -world.scrollSpeed * dt;
      for (const ob of world.obstacles) ob.move(dx);
      for (const h of world.hazards) h.move(dx);
      for (const c of world.collectibles) c.move(dx);
      for (const e of world.particleStream) e.move(dx);
      for (const b of world.boosts) b.move(dx);
    },
  };
}
