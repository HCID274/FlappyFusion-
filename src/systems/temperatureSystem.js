// Temperature scales with obstacles passed. Crossing thresholds emits TEMP_MILESTONE.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { getMilestoneText } from '../content.js';

export function createTemperatureSystem(eventBus, world) {
  function emitTemperature(source, upward) {
    const newTemp = CONFIG.temperature.start + world.tempStep * CONFIG.temperature.increment;
    world.temperature = newTemp;
    if (newTemp > world.maxTemperature) world.maxTemperature = newTemp;

    eventBus.emit(EV.TEMP_CHANGED, { temperature: newTemp, step: world.tempStep, source });

    if (upward) {
      const text = getMilestoneText(newTemp);
      if (text) {
        eventBus.emit(EV.TEMP_MILESTONE, { temperature: newTemp, text });
      }
    }
  }

  eventBus.on(EV.OBSTACLE_PASSED, () => {
    if (world.obstaclesPassed % CONFIG.temperature.stepEveryNObstacles !== 0) return;
    world.tempStep += 1;
    emitTemperature('obstacle', true);
  });

  eventBus.on(EV.HAZARD_HIT, ({ type }) => {
    if (type !== 'tungsten') return;
    world.redFlashT = CONFIG.hazards.tungsten.redFlashDuration;
    const nextStep = Math.max(0, world.tempStep - CONFIG.hazards.tungsten.tempStepPenalty);
    if (nextStep === world.tempStep) return;
    world.tempStep = nextStep;
    emitTemperature('hazard', false);
  });

  eventBus.on(EV.BOOST_TRIGGERED, ({ type }) => {
    if (type !== 'nbi') return;
    world.tempStep += CONFIG.boosts.nbi.tempStepBonus;
    world.nbiGlowT = CONFIG.boosts.nbi.glowDuration;
    emitTemperature('boost', true);
  });

  return { update(_dt) {} };
}
