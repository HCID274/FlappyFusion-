// Single source of truth for all tunable numerical values.
// See docs/game-design.md §11 for design rationale.

export const CONFIG = {
  canvas: { width: 800, height: 600, renderScale: 2 },

  plasma: {
    startX: 200,
    startY: 300,
    drift: 140,
    driftHighSpeed: 170,
    driftHighSpeedAt: 230,
    pulseImpulse: -150,
    pulseImpulseHighSpeed: -105,
    pulseImpulseHighSpeedAt: 230,
    pulseCooldownTime: 0,
    radius: 14,
    trailLength: 10,
    wallWarningDistance: 30,
    maxFallSpeed: 230,
    maxRiseSpeed: -240,
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
    baseSpeed: 110,
    speedPerTempStep: 8,
  },

  temperature: {
    start: 10,
    stepEveryNObstacles: 4,
    increment: 10,
  },

  score: {
    perObstacle: 1,
    perCollectible: 1,
    perLithium: 2,
    perParticle: 1,
    perFusionBase: 5,
    selfSustainBonus: 200,
  },

  fusion: {
    requires: { D: 1, T: 1 },
    fuelBayDisplay: { spreadCount: 3, overlapPx: 14 },
    burstWindow: 3.0,
    burstDtSpawnChance: 0.9,
    burstParticleMultiplier: 2.0,
    impactTimeScale: 0.80,
    impactDuration: 0.15,
    impactRingDuration: 0.30,
    impactRingMaxRadius: 54,
    impactParticleCount: 6,
    impactBurstParticleCount: 12,
    impactBurstMaxActiveBursts: 3,
    impactBurstLifetime: 0.32,
  },

  hazards: {
    tungsten: {
      tempStepPenalty: 1,
      redFlashDuration: 0.3,
      displaySize: 64,
      hitBoxSize: 51.2,
    },
  },

  boosts: {
    nbi: {
      tempStepBonus: 1,
      glowDuration: 0.5,
      width: 240,
      height: 72,
      hitBoxPaddingX: 20,
      hitBoxPaddingY: 16,
      yMargin: 120,
    },
  },

  combo: {
    window: 2.0,
    scoreTable: [5, 10, 25, 50, 100],
    maxCount: 99,
    timerRingDiameter: 48,
    timerRingRadius: 18,
    screenFx: {
      glowDuration: 0.45,
      pulseDuration: 0.42,
      shakeDuration4: 0.10,
      shakeDuration5: 0.20,
      shakeAmplitude4: 3,
      shakeAmplitude5: 5,
      whiteFlashDuration: 0.05,
      whiteFlashAlpha: 0.08,
      whiteFlashLimitWindow: 5,
      whiteFlashLimitCount: 4,
    },
  },

  collectible: {
    spawnChance: 0.7,
    typeWeights: { D: 0.45, T: 0.45, Li6: 0.10 },
    dtBalanceWindow: 10,
    dtMaxStreak: 3,
    fuelCatchUpThreshold: 1,
    radius: 8,
    hitRadius: 24,
    yJitter: 40,
  },

  particleStream: {
    enabled: true,
    burstIntervalMin: 0.25,
    burstIntervalMax: 0.45,
    particlesPerBurstMin: 3,
    particlesPerBurstMax: 6,
    radius: 4,
    patterns: ['arc', 'wave', 'diagonal', 'line'],
    yMargin: 80,
    yJitterBetweenBursts: 80,
    avoidObstacleLookahead: 200,
    avoidObstacleYOffset: 60,
  },

  phases: {
    thresholds: {
      IGNITION_PREP: 10,
      HEATING: 30,
      CRITICAL: 80,
      IGNITION_BURST: 100,
      RECORD: 150,
    },
    rules: {
      IGNITION_PREP: { obstacleSpacingMul: 1.0, particleRateMul: 1.0, dtSpawnChance: 0.7, comboWindow: 2.0, scoreMul: 1, tungstenSpawn: 0, nbiSpawn: 0, glow: 'deep' },
      HEATING: { obstacleSpacingMul: 1.0, particleRateMul: 1.0, dtSpawnChance: 0.7, comboWindow: 2.0, scoreMul: 1, tungstenSpawn: 0.08, nbiSpawn: 0.05, glow: 'magenta' },
      CRITICAL: { obstacleSpacingMul: 0.9, particleRateMul: 1.5, dtSpawnChance: 0.7, comboWindow: 2.0, scoreMul: 1, tungstenSpawn: 0.08, nbiSpawn: 0.05, glow: 'redOrange' },
      IGNITION_BURST: { obstacleSpacingMul: 0.75, particleRateMul: 3.0, dtSpawnChance: 0.9, comboWindow: 4.0, scoreMul: 2, tungstenSpawn: 0, nbiSpawn: 0.10, glow: 'gold' },
      RECORD: { obstacleSpacingMul: 0.8, particleRateMul: 2.0, dtSpawnChance: 0.7, comboWindow: 2.5, scoreMul: 1.5, tungstenSpawn: 0.05, nbiSpawn: 0.05, glow: 'whiteHot' },
    },
  },

  ignitionPhase: {
    duration: 20,
    enterFreezeDuration: 0.6,
    enterFlashDuration: 0.15,
    enterSlowTimeScale: 0.7,
    progressMilestones: [5, 10, 15],
    progressBar: {
      width: 480,
      height: 18,
      bottomMargin: 24,
      slideInDuration: 0.3,
    },
    exitBurstParticleCount: 200,
    selfSustainSlowTimeScale: 0.4,
    selfSustainSlowDuration: 0.5,
    selfSustainVignetteDuration: 3.0,
  },

  particle: {
    fusionLifetime: 1.5,
    fusionLabelFastDuration: 0.18,
    fusionLabelHoldDuration: 0.50,
    fusionLabelFastShare: 0.37,
    fusionLabelHoldShare: 0.04,
    milestoneLifetime: 1.5,
    instabilityLabelLifetime: 0.8,
    sceneTextLifetime: 0.75,
    scoreTextLifetime: 0.52,
    scoreTextDistance: 42,
    textMotionFastDuration: 0.15,
    textMotionSlowDuration: 0.15,
    textMotionFastShare: 0.42,
    textMotionSlowShare: 0.10,
  },

  deathCardDelaySec: 0.6,

  difficulty: {
    default: 'easy',
    presets: {
      easy: { gapMul: 1.0, speedMul: 1.0, hazardMul: 1.0, thresholdMul: 1.0 },
      normal: { gapMul: 0.85, speedMul: 1.15, hazardMul: 1.3, thresholdMul: 1.2 },
      hard: { gapMul: 0.7, speedMul: 1.3, hazardMul: 1.6, thresholdMul: 1.5 },
    },
  },
};
