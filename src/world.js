// World is the only mutable state container.
// Systems read/write it; renderer/HUD read only.
// Mutate in place — never reassign — so all references stay valid across resets.

import { CONFIG } from './config.js';
import { createPlasma } from './entities/plasma.js';

export function createWorld() {
  const world = {};
  resetWorld(world);
  world.status = 'menu';
  return world;
}

export function resetWorld(world) {
  world.status = 'playing';
  world.elapsed = 0;
  world.score = 0;
  world.temperature = CONFIG.temperature.start;
  world.maxTemperature = CONFIG.temperature.start;
  world.tempStep = 0;
  world.phase = 'IGNITION_PREP';
  world.scrollSpeed = CONFIG.scroll.baseSpeed;
  world.obstaclesPassed = 0;
  world.fusionCount = 0;
  world.maxCombo = 0;
  world.collectedD = 0;
  world.collectedT = 0;
  world.combo = { count: 0, lastTime: -Infinity, window: CONFIG.combo.window };
  world.fusionBurst = { active: false, remaining: 0 };
  world.ignitionPhase = { active: false, elapsed: 0, entered: false, elapsedAtDeath: 0 };
  world.selfSustained = false;
  world.timeScale = 1;
  world.screenFx = {
    phaseGlow: {
      from: 'deep',
      to: 'deep',
      t: 1,
      duration: 0.5,
    },
    cornerGlowT: 0,
    radialPulseT: 0,
    radialPulseDuration: CONFIG.combo.screenFx.pulseDuration,
    whiteFlashT: 0,
    whiteFlashDuration: CONFIG.combo.screenFx.whiteFlashDuration,
    shakeT: 0,
    shakeDuration: 0,
    shakeAmplitude: 0,
    shakeX: 0,
    shakeY: 0,
    ignitionEntryT: 0,
    ignitionEntryDuration: CONFIG.ignitionPhase.enterFreezeDuration,
    selfSustainBurstT: 0,
    selfSustainVignetteT: 0,
    burstParticles: [],
  };
  world.deathCause = null;
  world.spawnDistance = 0;
  world.lastGapY = CONFIG.canvas.height / 2;
  world.lastParticleStreamY = NaN;
  world.lastWasInstability = false;
  world.wallTouchTimer = 0;
  world.redFlashT = 0;
  world.nbiGlowT = 0;
  if (world.inputBlocked === undefined) world.inputBlocked = false;

  world.plasma = createPlasma();
  world.obstacles = [];
  world.hazards = [];
  world.collectibles = [];
  world.particleStream = [];
  world.boosts = [];
  world.particles = [];
}
