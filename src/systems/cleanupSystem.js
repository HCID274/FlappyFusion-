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
    },
  };
}
