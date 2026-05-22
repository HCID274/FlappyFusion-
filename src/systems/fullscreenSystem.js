// Handles optional browser fullscreen and landscape orientation locking.
// Fullscreen APIs are best-effort on mobile browsers, so callers receive state
// updates instead of assuming the request succeeded.

import { EV } from '../engine/events.js';

export function createFullscreenSystem(eventBus, world, stage) {
  let lockAttempted = false;

  async function requestFullscreen() {
    if (!stage?.requestFullscreen) {
      updateFullscreenState({ hint: true });
      return;
    }

    try {
      await stage.requestFullscreen({ navigationUI: 'hide' });
      await lockLandscape();
    } catch (_err) {
      updateFullscreenState({ hint: true });
    }
  }

  async function exitFullscreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (_err) {
      updateFullscreenState({ hint: true });
    }
  }

  async function lockLandscape() {
    lockAttempted = true;
    const orientation = screen.orientation;
    if (!orientation?.lock) {
      updateFullscreenState({ hint: true });
      return;
    }

    try {
      await orientation.lock('landscape');
    } catch (_err) {
      updateFullscreenState({ hint: true });
    }
  }

  function unlockOrientation() {
    if (!lockAttempted || !screen.orientation?.unlock) return;
    try {
      screen.orientation.unlock();
    } catch (_err) {
      // Some browsers expose unlock but reject it outside installed apps.
    }
  }

  function updateFullscreenState({ hint = false } = {}) {
    const active = document.fullscreenElement === stage;
    const portrait = window.innerHeight > window.innerWidth;
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 700;
    world.isFullscreen = active;
    world.fullscreenHintVisible = hint || (portrait && smallScreen);
    stage?.classList.toggle('is-fullscreen', active);
    document.body.classList.toggle('is-fullscreen', active);
    eventBus.emit(EV.FULLSCREEN_CHANGED, {
      active,
      hintVisible: world.fullscreenHintVisible,
    });
  }

  eventBus.on(EV.FULLSCREEN_TOGGLE_REQUESTED, () => {
    if (document.fullscreenElement === stage) {
      exitFullscreen();
    } else {
      requestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement !== stage) unlockOrientation();
    updateFullscreenState();
  });
  window.addEventListener('orientationchange', () => updateFullscreenState());
  window.addEventListener('resize', () => updateFullscreenState());

  updateFullscreenState();

  return { update(_dt) {} };
}
