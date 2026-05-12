// Captures keyboard, emits abstract input events.
// State machine and physics each interpret EV.INPUT_PULSE per their context.
// Honors world.inputBlocked so modal/overlay screens can suppress input.

import { EV } from '../engine/events.js';

export function createInputSystem(eventBus, world) {
  let queued = false;

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      if (world.inputBlocked) return;
      e.preventDefault();
      queued = true;
    }
  });

  return {
    update(_dt) {
      if (queued) {
        eventBus.emit(EV.INPUT_PULSE);
        queued = false;
      }
    },
  };
}
