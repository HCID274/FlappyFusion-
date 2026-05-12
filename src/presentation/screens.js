// DOM overlays: Menu, Death card, Learn-more modal.
// Subscribes to STATE_CHANGED to show/hide. All text comes from content.js.

import { ui, tutorial, getDeathTitle, getDeathBody, formatTemperature, learnMore } from '../content.js';
import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

export function createScreens(eventBus, world) {
  const menu = document.getElementById('screen-menu');
  const death = document.getElementById('screen-death');
  const modal = document.getElementById('screen-learn');

  // populate static text
  document.getElementById('menu-title').textContent = ui.title;
  document.getElementById('menu-subtitle').textContent = ui.subtitle;
  document.getElementById('menu-tutorial').innerText = tutorial;
  document.getElementById('menu-start').textContent = ui.startHint;
  document.getElementById('menu-lab').textContent = ui.lab;
  document.getElementById('death-restart').textContent = ui.restartHint;
  document.getElementById('death-learnmore').textContent = ui.btnLearnMore;
  document.getElementById('learn-close').textContent = ui.btnClose;

  show(menu); hide(death); hide(modal);

  let deathTimer = null;
  let learnIdx = 0;

  function showDeathCard() {
    const seconds = Math.floor(world.elapsed);
    const cause = world.deathCause || 'wall';
    const maxTemp = world.maxTemperature;
    const { body, footer } = getDeathBody({ seconds, fusionCount: world.fusionCount, maxTemp });

    document.getElementById('death-title').textContent = '💥 ' + getDeathTitle(cause);
    document.getElementById('death-stats').innerText =
      `你坚持了 ${seconds} 秒,达到了 ${formatTemperature(maxTemp)}\n完成 ${world.fusionCount} 次聚变反应`;
    document.getElementById('death-body').innerText = body;
    const footEl = document.getElementById('death-footer');
    if (footer) {
      footEl.innerText = footer;
      footEl.style.display = '';
    } else {
      footEl.style.display = 'none';
    }
    show(death);
  }

  function renderLearnPage() {
    const page = learnMore[learnIdx];
    document.getElementById('learn-heading').textContent = page.heading;
    document.getElementById('learn-body').innerText = page.body;
    document.getElementById('learn-prev').disabled = learnIdx === 0;
    document.getElementById('learn-next').disabled = learnIdx === learnMore.length - 1;
    document.getElementById('learn-page').textContent = `${learnIdx + 1} / ${learnMore.length}`;
  }

  eventBus.on(EV.STATE_CHANGED, ({ to }) => {
    if (deathTimer) { clearTimeout(deathTimer); deathTimer = null; }
    if (to === 'menu') {
      show(menu); hide(death); hide(modal);
    } else if (to === 'playing') {
      hide(menu); hide(death); hide(modal);
    } else if (to === 'dead') {
      deathTimer = setTimeout(showDeathCard, CONFIG.deathCardDelaySec * 1000);
    }
  });

  document.getElementById('death-learnmore-btn').addEventListener('click', () => {
    learnIdx = 0;
    renderLearnPage();
    world.inputBlocked = true;
    show(modal);
  });
  document.getElementById('learn-close-btn').addEventListener('click', () => {
    hide(modal);
    world.inputBlocked = false;
  });
  document.getElementById('learn-prev').addEventListener('click', () => {
    if (learnIdx > 0) { learnIdx--; renderLearnPage(); }
  });
  document.getElementById('learn-next').addEventListener('click', () => {
    if (learnIdx < learnMore.length - 1) { learnIdx++; renderLearnPage(); }
  });

  return {};
}

function show(el) { el.style.display = 'flex'; }
function hide(el) { el.style.display = 'none'; }
