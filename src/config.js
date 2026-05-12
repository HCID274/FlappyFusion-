// Single source of truth for all tunable numerical values.
// See docs/game-design.md §11 for design rationale.

export const CONFIG = {
  canvas: { width: 800, height: 600 },

  plasma: {
    startX: 200,
    startY: 300,
    drift: 70,
    pulseImpulse: -75,
    pulseCooldownTime: 0,
    radius: 14,
    trailLength: 10,
    wallWarningDistance: 30,
    maxFallSpeed: 115,
    maxRiseSpeed: -120,
  },

  obstacle: {
    gapMin: 200,
    gapMax: 240,
    spacingMin: 300,
    spacingMax: 360,
    gapJitterMax: 100,
    instabilityChance: 0.12,
    instabilityNoConsecutive: true,
    width: 56,
    wallMargin: 40,
  },

  scroll: {
    baseSpeed: 55,
    speedPerTempStep: 4,
  },

  temperature: {
    start: 10,
    stepEveryNObstacles: 2,
    increment: 10,
  },

  score: {
    perObstacle: 1,
    perCollectible: 1,
    perFusion: 5,
  },

  fusion: {
    requires: { D: 1, T: 1 },
  },

  collectible: {
    spawnChance: 0.7,
    radius: 10,
    yJitter: 40,
  },

  particle: {
    fusionLifetime: 1.5,
    milestoneLifetime: 1.5,
    instabilityLabelLifetime: 0.8,
  },

  deathCardDelaySec: 0.6,
};
