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
  world.scrollSpeed = CONFIG.scroll.baseSpeed;
  world.obstaclesPassed = 0;
  world.fusionCount = 0;
  world.collectedD = 0;
  world.collectedT = 0;
  world.deathCause = null;
  world.spawnDistance = 0;
  world.lastGapY = CONFIG.canvas.height / 2;
  world.lastWasInstability = false;
  world.wallTouchTimer = 0;
  world.redFlashT = 0;
  world.nbiGlowT = 0;
  if (world.inputBlocked === undefined) world.inputBlocked = false;

  world.plasma = createPlasma();
  world.obstacles = [];
  world.hazards = [];
  world.collectibles = [];
  world.boosts = [];
  world.particles = [];
}
