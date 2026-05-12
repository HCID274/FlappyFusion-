// Spawns obstacles and (optionally) one collectible per gap.
// Uses distance-based spacing so spawn rate stays consistent across difficulty.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { createDivertor } from '../entities/obstacles/divertor.js';
import { createInstability } from '../entities/obstacles/instability.js';
import { createDeuterium } from '../entities/collectibles/deuterium.js';
import { createTritium } from '../entities/collectibles/tritium.js';
import { pickInstabilityName } from '../content.js';

function rand(a, b) { return a + Math.random() * (b - a); }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function createSpawnSystem(eventBus, world) {
  let nextSpawnAt = 0; // distance counter

  eventBus.on(EV.GAME_RESET, () => { nextSpawnAt = 0; });

  return {
    update(dt) {
      if (world.status !== 'playing') return;

      world.spawnDistance += world.scrollSpeed * dt;

      while (world.spawnDistance >= nextSpawnAt) {
        spawnOne(world, eventBus);
        const spacing = rand(CONFIG.obstacle.spacingMin, CONFIG.obstacle.spacingMax);
        nextSpawnAt += spacing;
      }
    },
  };
}

function spawnOne(world, eventBus) {
  const W = CONFIG.canvas.width;
  const H = CONFIG.canvas.height;
  const margin = CONFIG.obstacle.wallMargin;
  const useInstability = !world.lastWasInstability && Math.random() < CONFIG.obstacle.instabilityChance;

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
    const gap = rand(CONFIG.obstacle.gapMin, CONFIG.obstacle.gapMax);
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
    if (Math.random() < CONFIG.collectible.spawnChance) {
      const cy = gapY + (Math.random() - 0.5) * CONFIG.collectible.yJitter;
      const cx = W + 60 + 28 + Math.random() * 20;
      const c = Math.random() < 0.5 ? createDeuterium(cx, cy) : createTritium(cx, cy);
      world.collectibles.push(c);
    }
  }
}
