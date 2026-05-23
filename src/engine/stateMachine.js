// Top-level status: menu / playing / dead.
// Listens to INPUT_PULSE for menu→playing and dead→playing transitions.
// Listens to PLASMA_DEAD for playing→dead transition.

import { EV } from './events.js';
import { resetWorld } from '../world.js';

export function createStateMachine(eventBus, world) {
  function transitionTo(next) {
    if (world.status === next) return;
    const prev = world.status;
    if (next === 'playing') {
      resetWorld(world);
      eventBus.emit(EV.GAME_RESET);
    } else {
      world.status = next;
    }
    eventBus.emit(EV.STATE_CHANGED, { from: prev, to: next });
  }

  eventBus.on(EV.INPUT_PULSE, () => {
    if (world.status === 'menu' || (world.status === 'dead' && !world.leaderboardPending)) {
      transitionTo('playing');
    }
  });

  eventBus.on(EV.PLASMA_DEAD, ({ cause } = {}) => {
    if (world.status === 'playing') {
      world.deathCause = cause || 'wall';
      transitionTo('dead');
    }
  });

  return {
    update(_dt) {},
  };
}
