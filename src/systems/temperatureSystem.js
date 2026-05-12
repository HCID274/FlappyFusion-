// Temperature scales with obstacles passed. Crossing thresholds emits TEMP_MILESTONE.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { getMilestoneText } from '../content.js';

export function createTemperatureSystem(eventBus, world) {
  eventBus.on(EV.OBSTACLE_PASSED, () => {
    const newStep = Math.floor(world.obstaclesPassed / CONFIG.temperature.stepEveryNObstacles);
    if (newStep <= world.tempStep) return;

    world.tempStep = newStep;
    const newTemp = CONFIG.temperature.start + newStep * CONFIG.temperature.increment;
    world.temperature = newTemp;
    if (newTemp > world.maxTemperature) world.maxTemperature = newTemp;

    eventBus.emit(EV.TEMP_CHANGED, { temperature: newTemp, step: newStep });

    const text = getMilestoneText(newTemp);
    if (text) {
      eventBus.emit(EV.TEMP_MILESTONE, { temperature: newTemp, text });
    }
  });

  return { update(_dt) {} };
}
