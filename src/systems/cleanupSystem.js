// Removes off-screen obstacles and collectibles to keep arrays small.

import { CONFIG } from '../config.js';

const CULL_X = -150;

export function createCleanupSystem(_eventBus, world) {
  return {
    update(_dt) {
      if (world.status !== 'playing') return;
      for (let i = world.obstacles.length - 1; i >= 0; i--) {
        const ob = world.obstacles[i];
        const rightEdge = ob.x + (ob.w || ob.radius * 2);
        if (rightEdge < CULL_X) world.obstacles.splice(i, 1);
      }
      for (let i = world.collectibles.length - 1; i >= 0; i--) {
        const c = world.collectibles[i];
        if (c.collected || c.pos.x + c.radius < CULL_X) {
          world.collectibles.splice(i, 1);
        }
      }
      for (let i = world.hazards.length - 1; i >= 0; i--) {
        const h = world.hazards[i];
        if (h.pos.x + h.radius < CULL_X) world.hazards.splice(i, 1);
      }
      for (let i = world.boosts.length - 1; i >= 0; i--) {
        const b = world.boosts[i];
        if (b.pos.x + b.radius < CULL_X) world.boosts.splice(i, 1);
      }
    },
  };
}
