// World is the only mutable state container.
// Systems read/write it; renderer/HUD read only.
// Mutate in place — never reassign — so all references stay valid across resets.

import { CONFIG } from './config.js';
import { createPlasma } from './entities/plasma.js';

export const DIFFICULTY_STORAGE_KEY = 'mcsc.difficulty';
export const TUTORIAL_ENABLED_STORAGE_KEY = 'mcsc.tutorialEnabled';
export const AUDIO_ENABLED_STORAGE_KEY = 'mcsc.audioEnabled';

function createFusionImpactParticlePool() {
  const size = CONFIG.fusion.impactBurstParticleCount * CONFIG.fusion.impactBurstMaxActiveBursts;
  return Array.from({ length: size }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    length: 0,
    life: 0,
    maxLife: CONFIG.fusion.impactBurstLifetime,
    color: '#ffcc44',
  }));
}

export function createWorld() {
  const world = {};
  world.difficulty = readStoredDifficulty();
  world.tutorialEnabled = readStoredTutorialEnabled();
  world.audioEnabled = readStoredAudioEnabled();
  applyDifficultyPreset(world);
  resetWorld(world);
  world.status = 'menu';
  return world;
}

export function setWorldDifficulty(world, difficulty) {
  world.difficulty = normalizeDifficulty(difficulty);
  applyDifficultyPreset(world);
}

export function resetWorld(world) {
  applyDifficultyPreset(world);
  world.status = 'playing';
  world.elapsed = 0;
  world.score = 0;
  world.temperature = CONFIG.temperature.start;
  world.maxTemperature = CONFIG.temperature.start;
  world.tempStep = 0;
  world.phase = 'IGNITION_PREP';
  world.scrollSpeed = CONFIG.scroll.baseSpeed * world.speedMul;
  world.obstaclesPassed = 0;
  world.fusionCount = 0;
  world.maxCombo = 0;
  world.collectedD = 0;
  world.collectedT = 0;
  world.combo = { count: 0, lastTime: -Infinity, window: CONFIG.combo.window };
  world.fusionBurst = { active: false, remaining: 0 };
  world.ignitionPhase = { active: false, elapsed: 0, entered: false, elapsedAtDeath: 0 };
  world.selfSustained = false;
  world.leaderboardPending = false;
  world.leaderboardSnapshot = null;
  world.timeScale = 1;
  world.tutorialPaused = false;
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
    fusionImpactSlowT: 0,
    fusionImpactT: 0,
    fusionImpactDuration: CONFIG.fusion.impactRingDuration,
    fusionImpactX: CONFIG.canvas.width / 2,
    fusionImpactY: CONFIG.canvas.height / 2,
    fusionImpactParticleCursor: 0,
    fusionImpactParticles: createFusionImpactParticlePool(),
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
  world.seenDT = false;
  if (world.inputBlocked === undefined) world.inputBlocked = false;

  world.plasma = createPlasma();
  fitPlasmaStartToCanvas(world.plasma);
  world.obstacles = [];
  world.hazards = [];
  world.collectibles = [];
  world.particleStream = [];
  world.boosts = [];
  world.particles = [];
}

function fitPlasmaStartToCanvas(plasma) {
  const margin = CONFIG.obstacle.wallMargin;
  const minX = plasma.radius;
  const maxX = Math.max(minX, CONFIG.canvas.width - plasma.radius);
  const minY = margin + plasma.radius + 1;
  const maxY = Math.max(minY, CONFIG.canvas.height - margin - plasma.radius - 1);

  if (plasma.pos.x < minX || plasma.pos.x > maxX) {
    plasma.pos.x = (minX + maxX) / 2;
  }
  if (plasma.pos.y < minY || plasma.pos.y > maxY) {
    plasma.pos.y = (minY + maxY) / 2;
  }
}

function applyDifficultyPreset(world) {
  const difficulty = normalizeDifficulty(world.difficulty);
  const preset = CONFIG.difficulty.presets[difficulty];

  world.difficulty = difficulty;
  world.gapMul = preset.gapMul;
  world.speedMul = preset.speedMul;
  world.hazardMul = preset.hazardMul;
  world.thresholdMul = preset.thresholdMul;
}

function readStoredDifficulty() {
  if (typeof window === 'undefined') return CONFIG.difficulty.default;
  return normalizeDifficulty(window.localStorage?.getItem(DIFFICULTY_STORAGE_KEY));
}

function readStoredTutorialEnabled() {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage?.getItem(TUTORIAL_ENABLED_STORAGE_KEY);
  return stored === null ? true : stored !== 'false';
}

function readStoredAudioEnabled() {
  if (typeof window === 'undefined') return true;
  const stored = window.localStorage?.getItem(AUDIO_ENABLED_STORAGE_KEY);
  return stored === null ? true : stored !== 'false';
}

function normalizeDifficulty(difficulty) {
  return Object.prototype.hasOwnProperty.call(CONFIG.difficulty.presets, difficulty)
    ? difficulty
    : CONFIG.difficulty.default;
}
