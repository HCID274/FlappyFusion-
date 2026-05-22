// Spawns obstacles and (optionally) one collectible per gap.
// Uses distance-based spacing so spawn rate stays consistent across difficulty.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { createDivertor } from '../entities/obstacles/divertor.js';
import { createInstability } from '../entities/obstacles/instability.js';
import { createDeuterium } from '../entities/collectibles/deuterium.js';
import { createTritium } from '../entities/collectibles/tritium.js';
import { createLithium6 } from '../entities/collectibles/lithium6.js';
import { createTungsten } from '../entities/hazards/tungsten.js';
import { createNbi } from '../entities/boosts/nbi.js';
import { pickInstabilityName } from '../content.js';
import { createFuelTypePicker } from '../dtBalance.js';

function rand(a, b) { return a + Math.random() * (b - a); }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function chance(value) { return clamp(value, 0, 1); }

export function getHazardProgressTemperature(world) {
  const stepEvery = Math.max(1, CONFIG.temperature.stepEveryNObstacles);
  const progressInStep = (world.obstaclesPassed % stepEvery) / stepEvery;
  return world.temperature + progressInStep * CONFIG.temperature.increment;
}

export function getTungstenSpawnChance(world, phaseRules) {
  const currentChance = phaseRules.tungstenSpawn ?? 0;
  if (currentChance > 0) return currentChance;

  const earlyTungstenThreshold = CONFIG.phases.thresholds.HEATING / (world.thresholdMul || 1);
  if (world.phase === 'IGNITION_PREP' && getHazardProgressTemperature(world) >= earlyTungstenThreshold) {
    return CONFIG.phases.rules.HEATING.tungstenSpawn;
  }

  return currentChance;
}

function createCollectiblePicker() {
  const fuelTypePicker = createFuelTypePicker();

  return {
    reset() {
      fuelTypePicker.reset();
    },
    pick(cx, cy, world) {
      const type = fuelTypePicker.pick({
        collectedD: world.collectedD,
        collectedT: world.collectedT,
      });
      if (type === 'Li6') return createLithium6(cx, cy);
      return type === 'D' ? createDeuterium(cx, cy) : createTritium(cx, cy);
    },
  };
}

export function createSpawnSystem(eventBus, world) {
  let nextSpawnAt = 0; // distance counter
  let phaseRules = CONFIG.phases.rules.IGNITION_PREP;
  const collectiblePicker = createCollectiblePicker();

  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    phaseRules = CONFIG.phases.rules[to] || CONFIG.phases.rules.IGNITION_PREP;
  });

  eventBus.on(EV.GAME_RESET, () => {
    nextSpawnAt = 0;
    phaseRules = CONFIG.phases.rules.IGNITION_PREP;
    collectiblePicker.reset();
  });

  return {
    update(dt) {
      if (world.status !== 'playing') return;

      world.spawnDistance += world.scrollSpeed * dt;

      while (world.spawnDistance >= nextSpawnAt) {
        spawnOne(world, eventBus, phaseRules, collectiblePicker);
        const spacing = rand(CONFIG.obstacle.spacingMin, CONFIG.obstacle.spacingMax);
        nextSpawnAt += spacing * (phaseRules.obstacleSpacingMul ?? 1);
      }
    },
  };
}

function spawnOne(world, eventBus, phaseRules, collectiblePicker) {
  const W = CONFIG.canvas.width;
  const H = CONFIG.canvas.height;
  const margin = CONFIG.obstacle.wallMargin;
  const useInstability = !world.lastWasInstability
    && Math.random() < chance(CONFIG.obstacle.instabilityChance * world.hazardMul);

  if (useInstability) {
    const centerY = clamp(
      world.lastGapY + (Math.random() - 0.5) * CONFIG.obstacle.gapJitterMax,
      margin + 140,
      H - margin - 140,
    );
    const ob = createInstability(W + 60, centerY);
    world.obstacles.push(ob);
    world.lastGapY = centerY;
    world.lastWasInstability = true;
    eventBus.emit(EV.INSTABILITY_SPAWNED, { name: pickInstabilityName() });
  } else {
    const gap = rand(CONFIG.obstacle.gapMin, CONFIG.obstacle.gapMax) * world.gapMul;
    const gapY = clamp(
      world.lastGapY + (Math.random() - 0.5) * CONFIG.obstacle.gapJitterMax,
      margin + gap / 2 + 30,
      H - margin - gap / 2 - 30,
    );
    const ob = createDivertor(W + 60, gapY, gap);
    world.obstacles.push(ob);
    world.lastGapY = gapY;
    world.lastWasInstability = false;

    // collectible in gap
    const baseFuelSpawnChance = phaseRules.dtSpawnChance ?? CONFIG.collectible.spawnChance;
    const fuelSpawnChance = world.fusionBurst.active
      ? CONFIG.fusion.burstDtSpawnChance
      : baseFuelSpawnChance;
    if (Math.random() < fuelSpawnChance) {
      const cy = gapY + (Math.random() - 0.5) * CONFIG.collectible.yJitter;
      const cx = W + 60 + 28 + Math.random() * 20;
      world.collectibles.push(collectiblePicker.pick(cx, cy, world));
    }
  }

  if (Math.random() < chance(getTungstenSpawnChance(world, phaseRules) * world.hazardMul)) {
    const y = rand(80, H - 80);
    world.hazards.push(createTungsten(W + 120, y));
  }

  if (Math.random() < phaseRules.nbiSpawn) {
    const y = rand(CONFIG.boosts.nbi.yMargin, H - CONFIG.boosts.nbi.yMargin);
    world.boosts.push(createNbi(W + 160, y));
  }
}
