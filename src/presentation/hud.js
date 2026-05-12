// DOM-based HUD. Updates via events for changes; reads world.elapsed each refresh for time.

import { getIgnitionProgressText, hud, onLocaleChange } from '../content.js';
import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { THEME } from '../theme.js';
import { getImage } from '../assetLoader.js';

export function createHUD(eventBus, world) {
  const el = {
    temp: document.getElementById('hud-temp'),
    fuelBay: document.getElementById('hud-fuel-bay'),
    comboRing: document.getElementById('hud-combo-ring'),
    score: document.getElementById('hud-score'),
    time: document.getElementById('hud-time'),
    pulseRing: document.getElementById('hud-pulse-ring'),
    ignitionBar: document.getElementById('hud-ignition-bar'),
    ignitionLabel: document.getElementById('hud-ignition-label'),
    ignitionFill: document.getElementById('hud-ignition-fill'),
  };
  let suppressNextCollectibleRefresh = false;
  const ringCircumference = 2 * Math.PI * 14;

  function refreshTemp() { el.temp.textContent = hud.temperature(world.temperature); }
  function refreshScore() { el.score.textContent = hud.score(world.score); }
  function refreshTime() { el.time.textContent = hud.time(world.elapsed); }
  function refreshComboRing() {
    if (!el.comboRing) return;
    const progressEl = el.comboRing.querySelector('.ring-progress');
    const countEl = el.comboRing.querySelector('.ring-count');
    if (!progressEl || !countEl) return;

    progressEl.style.strokeDasharray = `${ringCircumference}`;
    const comboCount = world.combo?.count || 0;
    if (comboCount < 2) {
      el.comboRing.classList.remove('active', 'urgent');
      progressEl.style.strokeDashoffset = `${ringCircumference}`;
      countEl.textContent = '';
      return;
    }

    const elapsed = world.elapsed - world.combo.lastTime;
    const comboWindow = world.combo.window || CONFIG.combo.window;
    const remaining = Math.max(0, comboWindow - elapsed);
    const progress = Math.max(0, Math.min(1, remaining / comboWindow));
    const spec = THEME.combo[Math.min(comboCount, THEME.combo.length) - 1];
    el.comboRing.style.setProperty('--combo-color', spec.color);
    progressEl.style.strokeDashoffset = `${ringCircumference * (1 - progress)}`;
    countEl.textContent = String(Math.min(comboCount, CONFIG.combo.maxCount));
    el.comboRing.classList.add('active');
    el.comboRing.classList.toggle('urgent', remaining <= 0.4);
  }
  function refreshIgnitionBar() {
    if (!el.ignitionBar || !el.ignitionFill || !el.ignitionLabel) return;
    if (!world.ignitionPhase?.active) {
      if (el.ignitionBar.classList.contains('complete')) return;
      el.ignitionBar.classList.remove('active', 'bump');
      el.ignitionFill.style.width = '0%';
      el.ignitionLabel.textContent = '';
      return;
    }

    const elapsed = Math.min(CONFIG.ignitionPhase.duration, world.ignitionPhase.elapsed);
    const progress = Math.max(0, Math.min(1, elapsed / CONFIG.ignitionPhase.duration));
    el.ignitionBar.classList.add('active');
    el.ignitionFill.style.width = `${progress * 100}%`;
    el.ignitionLabel.textContent = getIgnitionProgressText(elapsed);
  }
  function refreshFuelBay(snapshot = world) {
    if (!el.fuelBay) return;
    el.fuelBay.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'fuel-title';
    const label = document.createElement('span');
    label.textContent = hud.fuelBayLabel();
    const he4 = document.createElement('span');
    he4.className = 'fuel-he4';
    he4.textContent = hud.he4(snapshot.fusionCount);
    title.append(label, he4);
    el.fuelBay.append(title);

    el.fuelBay.append(makeFuelRow('D', snapshot.collectedD, 'atomD'));
    el.fuelBay.append(makeFuelRow('T', snapshot.collectedT, 'atomT'));

    const ready = document.createElement('div');
    ready.className = `fusion-ready${snapshot.collectedD >= 1 && snapshot.collectedT >= 1 ? ' active' : ''}`;
    ready.textContent = hud.fusionReady();
    el.fuelBay.append(ready);
  }

  function makeFuelRow(type, count, imageKey) {
    const row = document.createElement('div');
    row.className = 'fuel-row';
    const label = document.createElement('span');
    label.className = 'fuel-label';
    label.textContent = type;
    const slots = document.createElement('div');
    slots.className = 'fuel-slots';

    for (let i = 0; i < count; i++) {
      const slot = document.createElement('span');
      slot.className = `fuel-slot filled ${type.toLowerCase()}`;
      slot.style.left = `${getFuelSlotX(i)}px`;
      slot.style.zIndex = String(100 - i);
      const img = getImage(imageKey);
      if (img) {
        const icon = document.createElement('img');
        icon.src = img.src;
        icon.alt = '';
        slot.append(icon);
      } else {
        const fallback = document.createElement('span');
        fallback.className = 'fuel-fallback';
        fallback.textContent = type;
        slot.append(fallback);
      }
      slots.append(slot);
    }

    slots.style.width = `${getFuelStackWidth(count)}px`;

    row.append(label, slots);
    return row;
  }

  function getFuelSlotX(index) {
    const slotSize = 28;
    const gap = 6;
    const { spreadCount, overlapPx } = CONFIG.fusion.fuelBayDisplay;
    if (index < spreadCount) return index * (slotSize + gap);
    return (spreadCount - 1) * (slotSize + gap) + (index - spreadCount + 1) * overlapPx;
  }

  function getFuelStackWidth(count) {
    if (count <= 0) return 1;
    return getFuelSlotX(count - 1) + 28;
  }

  function animateSlots(className) {
    if (!el.fuelBay) return;
    const filled = el.fuelBay.querySelectorAll('.fuel-slot.filled');
    filled.forEach((slot) => {
      slot.classList.remove(className);
      void slot.offsetWidth;
      slot.classList.add(className);
    });
  }

  eventBus.on(EV.TEMP_CHANGED, refreshTemp);
  eventBus.on(EV.SCORE_CHANGED, refreshScore);
  eventBus.on(EV.COLLECTIBLE_HIT, () => {
    if (suppressNextCollectibleRefresh) {
      suppressNextCollectibleRefresh = false;
      return;
    }
    refreshFuelBay();
    animateSlots('pop');
  });
  eventBus.on(EV.FUSION_TRIGGERED, () => {
    const need = CONFIG.fusion.requires;
    suppressNextCollectibleRefresh = true;
    refreshFuelBay({
      collectedD: world.collectedD + need.D,
      collectedT: world.collectedT + need.T,
      fusionCount: Math.max(0, world.fusionCount - 1),
    });
    animateSlots('burst');
    window.setTimeout(() => {
      refreshFuelBay();
      const he4 = el.fuelBay?.querySelector('.fuel-he4');
      if (he4) {
        he4.classList.remove('bump');
        void he4.offsetWidth;
        he4.classList.add('bump');
      }
    }, 300);
  });
  eventBus.on(EV.COMBO_INCREMENT, ({ combo }) => {
    if (!el.comboRing || combo < 2) return;
    el.comboRing.classList.remove('bump');
    void el.comboRing.offsetWidth;
    el.comboRing.classList.add('bump');
    refreshComboRing();
  });
  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    if (!el.ignitionBar) return;
    if (to === 'IGNITION_BURST') {
      el.ignitionBar.classList.remove('complete');
      refreshIgnitionBar();
      el.ignitionBar.classList.add('active');
    } else {
      el.ignitionBar.classList.remove('active');
    }
  });
  eventBus.on(EV.IGNITION_TICK, ({ milestone }) => {
    refreshIgnitionBar();
    if (milestone && el.ignitionBar) {
      el.ignitionBar.classList.remove('bump');
      void el.ignitionBar.offsetWidth;
      el.ignitionBar.classList.add('bump');
    }
  });
  eventBus.on(EV.SELF_SUSTAIN_ACHIEVED, () => {
    if (!el.ignitionBar) return;
    el.ignitionBar.classList.remove('bump');
    el.ignitionBar.classList.add('complete');
    window.setTimeout(() => {
      el.ignitionBar.classList.remove('active', 'complete');
      refreshIgnitionBar();
    }, 320);
  });
  eventBus.on(EV.GAME_RESET, () => {
    refreshTemp(); refreshFuelBay(); refreshScore(); refreshTime(); refreshComboRing(); refreshIgnitionBar();
  });
  onLocaleChange(() => {
    refreshTemp(); refreshFuelBay(); refreshScore(); refreshTime(); refreshComboRing(); refreshIgnitionBar();
  });
  eventBus.on(EV.INPUT_PULSE, () => {
    if (!el.pulseRing) return;
    el.pulseRing.classList.remove('active');
    void el.pulseRing.offsetWidth;
    el.pulseRing.classList.add('active');
  });

  // initial paint
  refreshTemp(); refreshFuelBay(); refreshScore(); refreshTime(); refreshComboRing(); refreshIgnitionBar();

  return {
    refresh() { refreshTime(); refreshComboRing(); refreshIgnitionBar(); },
  };
}
