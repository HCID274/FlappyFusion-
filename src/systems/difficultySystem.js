// Maps temperature step to scrollSpeed. Single point of difficulty curve control.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

export function createDifficultySystem(eventBus, world) {
  eventBus.on(EV.TEMP_CHANGED, ({ step }) => {
    world.scrollSpeed = (CONFIG.scroll.baseSpeed + step * CONFIG.scroll.speedPerTempStep) * world.speedMul;
  });

  return { update(_dt) {} };
}
