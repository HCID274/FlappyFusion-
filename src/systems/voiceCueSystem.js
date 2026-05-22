// Converts high-level gameplay moments into short narration cues.
// The audio layer decides whether matching voice assets are available.

import { CONFIG } from '../config.js';
import { EV } from '../engine/events.js';

const COMBO_CUE_LEVELS = new Set([3, 5]);

export function createVoiceCueSystem(eventBus, world) {
  let iterAnnounced = false;
  let ignitionAnnounced = false;
  let selfSustainAnnounced = false;

  function emit(id, detail = {}) {
    eventBus.emit(EV.VOICE_CUE, { id, ...detail });
  }

  eventBus.on(EV.TEMP_CHANGED, ({ temperature }) => {
    if (iterAnnounced || temperature < CONFIG.phases.thresholds.RECORD) return;
    iterAnnounced = true;
    emit('iter');
  });

  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    if (ignitionAnnounced || to !== 'IGNITION_BURST') return;
    ignitionAnnounced = true;
    emit('ignition');
  });

  eventBus.on(EV.COMBO_INCREMENT, ({ combo }) => {
    if (!COMBO_CUE_LEVELS.has(combo)) return;
    emit(`combo${combo}`, { combo });
  });

  eventBus.on(EV.SELF_SUSTAIN_ACHIEVED, () => {
    if (selfSustainAnnounced) return;
    selfSustainAnnounced = true;
    emit('self-sustain');
  });

  eventBus.on(EV.GAME_RESET, () => {
    iterAnnounced = false;
    ignitionAnnounced = false;
    selfSustainAnnounced = false;
  });

  return { update(_dt) {} };
}
