// Tracks D / T inventory and triggers a fusion event each time both are >= 1.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

export function createFusionSystem(eventBus, world) {
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
      eventBus.emit(EV.FUSION_TRIGGERED, {
        x: world.plasma.pos.x,
        y: world.plasma.pos.y,
        count: world.fusionCount,
      });
    }
  });

  return { update(_dt) {} };
}
