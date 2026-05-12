// DOM-based HUD. Updates via events for changes; reads world.elapsed each refresh for time.

import { hud, onLocaleChange } from '../content.js';
import { EV } from '../engine/events.js';

export function createHUD(eventBus, world) {
  const el = {
    temp: document.getElementById('hud-temp'),
    inv: document.getElementById('hud-inv'),
    score: document.getElementById('hud-score'),
    time: document.getElementById('hud-time'),
    pulseRing: document.getElementById('hud-pulse-ring'),
  };

  function refreshTemp() { el.temp.textContent = hud.temperature(world.temperature); }
  function refreshInv() { el.inv.textContent = hud.inventory(world.collectedD, world.collectedT); }
  function refreshScore() { el.score.textContent = hud.score(world.score); }
  function refreshTime() { el.time.textContent = hud.time(world.elapsed); }

  eventBus.on(EV.TEMP_CHANGED, refreshTemp);
  eventBus.on(EV.SCORE_CHANGED, refreshScore);
  eventBus.on(EV.COLLECTIBLE_HIT, refreshInv);
  eventBus.on(EV.FUSION_TRIGGERED, refreshInv);
  eventBus.on(EV.GAME_RESET, () => {
    refreshTemp(); refreshInv(); refreshScore(); refreshTime();
  });
  onLocaleChange(() => {
    refreshTemp(); refreshInv(); refreshScore(); refreshTime();
  });
  eventBus.on(EV.INPUT_PULSE, () => {
    if (!el.pulseRing) return;
    el.pulseRing.classList.remove('active');
    void el.pulseRing.offsetWidth;
    el.pulseRing.classList.add('active');
  });

  // initial paint
  refreshTemp(); refreshInv(); refreshScore(); refreshTime();

  return {
    refresh() { refreshTime(); },
  };
}
