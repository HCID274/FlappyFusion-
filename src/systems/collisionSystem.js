// Plasma vs walls, obstacles, and collectibles. Generic AABB-vs-circle.
// Doesn't know obstacle subtypes — relies on duck-typed hitBoxes.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

function circleHitsAABB(cx, cy, cr, b) {
  const closestX = Math.max(b.x, Math.min(cx, b.x + b.w));
  const closestY = Math.max(b.y, Math.min(cy, b.y + b.h));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < cr * cr;
}

export function createCollisionSystem(eventBus, world) {
  return {
    update(_dt) {
      if (world.status !== 'playing') return;
      const p = world.plasma;
      if (!p.alive) return;

      const margin = CONFIG.obstacle.wallMargin;
      const H = CONFIG.canvas.height;
      if (p.pos.y - p.radius < margin || p.pos.y + p.radius > H - margin) {
        p.alive = false;
        eventBus.emit(EV.PLASMA_DEAD, { cause: 'wall' });
        return;
      }

      // obstacles
      for (const ob of world.obstacles) {
        for (const hb of ob.hitBoxes) {
          if (circleHitsAABB(p.pos.x, p.pos.y, p.radius, hb)) {
            p.alive = false;
            const cause = ob.type === 'instability' ? 'instability' : 'divertor';
            eventBus.emit(EV.PLASMA_DEAD, { cause });
            return;
          }
        }
        // pass scoring (only for divertor; instability also counts)
        if (!ob.passed && ob.x + (ob.w || ob.radius * 2) < p.pos.x) {
          ob.passed = true;
          world.obstaclesPassed += 1;
          eventBus.emit(EV.OBSTACLE_PASSED, { obstacle: ob });
        }
      }

      // collectibles
      for (const c of world.collectibles) {
        if (c.collected) continue;
        if (circleHitsAABB(p.pos.x, p.pos.y, p.radius, c.hitBox)) {
          c.collected = true;
          eventBus.emit(EV.COLLECTIBLE_HIT, { collectible: c });
        }
      }
    },
  };
}
