// Tracks D / T inventory and triggers a fusion event each time both are >= 1.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

export function createFusionSystem(eventBus, world) {
  function resetCombo() {
    world.combo.count = 0;
    world.combo.lastTime = -Infinity;
  }

  eventBus.on(EV.PLASMA_DEAD, () => {
    resetCombo();
    world.fusionBurst.active = false;
    world.fusionBurst.remaining = 0;
  });

  eventBus.on(EV.COLLECTIBLE_HIT, ({ collectible }) => {
    if (collectible.type === 'D') world.collectedD += 1;
    else if (collectible.type === 'T' || collectible.type === 'Li6') {
      world.collectedT += 1;
    }

    const need = CONFIG.fusion.requires;
    while (world.collectedD >= need.D && world.collectedT >= need.T) {
      world.collectedD -= need.D;
      world.collectedT -= need.T;
      world.fusionCount += 1;
      const withinWindow = world.elapsed - world.combo.lastTime <= CONFIG.combo.window;
      world.combo.count = withinWindow ? world.combo.count + 1 : 1;
      world.combo.lastTime = world.elapsed;
      world.maxCombo = Math.max(world.maxCombo, world.combo.count);
      world.fusionBurst.active = true;
      world.fusionBurst.remaining = CONFIG.fusion.burstWindow;
      const tableIndex = Math.min(world.combo.count, CONFIG.combo.scoreTable.length) - 1;
      const score = CONFIG.combo.scoreTable[tableIndex];
      const payload = {
        x: world.plasma.pos.x,
        y: world.plasma.pos.y,
        count: world.fusionCount,
        combo: world.combo.count,
        score,
      };
      eventBus.emit(EV.COMBO_INCREMENT, payload);
      eventBus.emit(EV.FUSION_TRIGGERED, {
        ...payload,
      });
    }
  });

  return {
    update(dt) {
      if (world.status !== 'playing') return;
      if (world.fusionBurst.active) {
        world.fusionBurst.remaining = Math.max(0, world.fusionBurst.remaining - dt);
        if (world.fusionBurst.remaining <= 0) world.fusionBurst.active = false;
      }
      if (world.combo.count > 0 && world.elapsed - world.combo.lastTime > CONFIG.combo.window) {
        resetCombo();
      }
    },
  };
}
