// Maps temperature changes to named gameplay phases and broadcasts transitions.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

function phaseForTemperature(world) {
  const thresholds = CONFIG.phases.thresholds;

  if (world.selfSustained) return 'RECORD';
  if (world.ignitionPhase.entered && world.ignitionPhase.active) return 'IGNITION_BURST';

  if (world.temperature >= thresholds.RECORD) return 'RECORD';
  if (world.temperature >= thresholds.IGNITION_BURST && !world.ignitionPhase.entered) return 'IGNITION_BURST';
  if (world.temperature >= thresholds.CRITICAL) return 'CRITICAL';
  if (world.temperature >= thresholds.HEATING) return 'HEATING';
  return 'IGNITION_PREP';
}

function setPhase(eventBus, world, next) {
  if (world.phase === next) return;
  const from = world.phase;
  world.phase = next;
  eventBus.emit(EV.PHASE_CHANGED, { from, to: next });
}

export function createPhaseSystem(eventBus, world) {
  eventBus.on(EV.TEMP_CHANGED, () => {
    if (world.status !== 'playing') return;
    setPhase(eventBus, world, phaseForTemperature(world));
  });

  eventBus.on(EV.SELF_SUSTAIN_ACHIEVED, () => {
    setPhase(eventBus, world, 'RECORD');
  });

  eventBus.on(EV.GAME_RESET, () => {
    world.phase = 'IGNITION_PREP';
  });

  return { update(_dt) {} };
}
