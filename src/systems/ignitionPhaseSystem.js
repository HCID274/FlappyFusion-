// Runs the 20 second ignition burst timer and emits progress events.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

function clampIgnitionElapsed(value) {
  return Math.max(0, Math.min(CONFIG.ignitionPhase.duration, value));
}

export function createIgnitionPhaseSystem(eventBus, world) {
  let nextMilestoneIndex = 0;

  function resetLocal() {
    nextMilestoneIndex = 0;
  }

  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    if (to !== 'IGNITION_BURST' || world.ignitionPhase.entered) return;
    world.ignitionPhase.active = true;
    world.ignitionPhase.entered = true;
    world.ignitionPhase.elapsed = 0;
    world.ignitionPhase.elapsedAtDeath = 0;
    resetLocal();
    eventBus.emit(EV.IGNITION_TICK, { elapsed: 0, progress: 0 });
  });

  eventBus.on(EV.PLASMA_DEAD, () => {
    if (world.ignitionPhase.active) {
      world.ignitionPhase.elapsedAtDeath = clampIgnitionElapsed(world.ignitionPhase.elapsed);
    }
    world.ignitionPhase.active = false;
  });

  eventBus.on(EV.GAME_RESET, resetLocal);

  return {
    update(dt) {
      if (world.status !== 'playing' || !world.ignitionPhase.active || world.selfSustained) return;

      world.ignitionPhase.elapsed = clampIgnitionElapsed(world.ignitionPhase.elapsed + dt);
      const elapsed = world.ignitionPhase.elapsed;
      const progress = elapsed / CONFIG.ignitionPhase.duration;
      eventBus.emit(EV.IGNITION_TICK, { elapsed, progress });

      const milestones = CONFIG.ignitionPhase.progressMilestones;
      while (nextMilestoneIndex < milestones.length && elapsed >= milestones[nextMilestoneIndex]) {
        const milestone = milestones[nextMilestoneIndex];
        nextMilestoneIndex += 1;
        eventBus.emit(EV.IGNITION_TICK, { elapsed, progress, milestone });
      }

      if (elapsed >= CONFIG.ignitionPhase.duration) {
        world.ignitionPhase.active = false;
        world.ignitionPhase.elapsedAtDeath = CONFIG.ignitionPhase.duration;
        world.selfSustained = true;
        eventBus.emit(EV.SELF_SUSTAIN_ACHIEVED, {
          elapsed: CONFIG.ignitionPhase.duration,
          score: CONFIG.score.selfSustainBonus,
        });
      }
    },
  };
}
