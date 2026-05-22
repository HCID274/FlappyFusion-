import { EV } from '../engine/events.js';
import { resetWorld } from '../world.js';
import { clearSeenTutorials } from './tutorialSystem.js';

const IDLE_RESET_MS = 120_000;
const CHECK_INTERVAL_MS = 1_000;

export function createIdleResetSystem(eventBus, world) {
  let lastActiveAt = Date.now();
  let lastCheckedAt = lastActiveAt;

  function markActive() {
    lastActiveAt = Date.now();
  }

  window.addEventListener('keydown', markActive);
  window.addEventListener('mousemove', markActive);
  window.addEventListener('touchstart', markActive, { passive: true });

  function resetToMenu() {
    const previousStatus = world.status;
    clearSeenTutorials();
    resetWorld(world);
    eventBus.emit(EV.GAME_RESET);
    world.status = 'menu';
    world.inputBlocked = false;
    world.tutorialPaused = false;
    world.timeScale = 1;
    lastActiveAt = Date.now();
    eventBus.emit(EV.STATE_CHANGED, { from: previousStatus, to: 'menu' });
  }

  return {
    update() {
      const now = Date.now();
      if (now - lastCheckedAt < CHECK_INTERVAL_MS) return;
      lastCheckedAt = now;

      if (world.status === 'playing' && !world.tutorialPaused) return;
      if (now - lastActiveAt > IDLE_RESET_MS) resetToMenu();
    },
  };
}
