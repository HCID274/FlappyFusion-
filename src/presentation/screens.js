// DOM overlays: Menu, Death card, Learn-more modal.
// Subscribes to STATE_CHANGED to show/hide. All player-facing text comes from content.js.

import {
  getDeathBody,
  getDeathStats,
  getDeathTitle,
  getLearnMorePages,
  getLocale,
  onLocaleChange,
  setLocale,
  t,
} from '../content.js';
import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { DIFFICULTY_STORAGE_KEY, setWorldDifficulty } from '../world.js';

export function createScreens(eventBus, world) {
  const menu = document.getElementById('screen-menu');
  const death = document.getElementById('screen-death');
  const modal = document.getElementById('screen-learn');
  const languageSwitch = document.getElementById('language-switch');
  const languageButton = document.getElementById('lang-toggle');
  const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-btn'));

  show(menu); hide(death); hide(modal);

  let deathTimer = null;
  let learnIdx = 0;

  function renderStaticText() {
    document.title = t('ui.pageTitle');
    document.getElementById('menu-title').textContent = t('ui.title');
    document.getElementById('menu-subtitle').textContent = t('ui.subtitle');
    document.getElementById('menu-tutorial').innerText = t('tutorial');
    document.getElementById('menu-start').textContent = t('ui.startHint');
    document.getElementById('menu-lab').textContent = t('ui.lab');
    renderDifficultyButtons();
    document.getElementById('death-restart').textContent = t('ui.restartHint');
    document.getElementById('death-learnmore').textContent = t('ui.btnLearnMore');
    document.getElementById('learn-prev').textContent = t('ui.btnPrev');
    document.getElementById('learn-next').textContent = t('ui.btnNext');
    document.getElementById('learn-close').textContent = t('ui.btnClose');
    languageSwitch.setAttribute('aria-label', t('ui.languageLabel'));
    updateLanguageButton();

    if (world.status === 'dead') showDeathCard();
    if (modal.style.display !== 'none') renderLearnPage();
  }

  function updateLanguageButton() {
    const nextLocale = getNextLocale();
    languageButton.textContent = t('ui.languageIcon');
    languageButton.title = t('ui.languageToggleLabel', {
      current: t(`language.${getLocale()}`),
      next: t(`language.${nextLocale}`),
    });
    languageButton.setAttribute('aria-label', languageButton.title);
  }

  function renderDifficultyButtons() {
    for (const button of difficultyButtons) {
      const difficulty = button.dataset.difficulty;
      button.textContent = t(`difficulty.${difficulty}`);
      button.classList.toggle('active', difficulty === world.difficulty);
      button.setAttribute('aria-pressed', String(difficulty === world.difficulty));
    }
  }

  function showDeathCard() {
    const seconds = Math.floor(world.elapsed);
    const cause = world.deathCause || 'wall';
    const maxTemp = world.maxTemperature;
    const ignitionSeconds = Math.floor(world.ignitionPhase?.elapsedAtDeath || 0);
    const { body, footer } = getDeathBody({
      seconds,
      fusionCount: world.fusionCount,
      maxTemp,
      maxCombo: world.maxCombo,
      ignitionSeconds,
      selfSustained: world.selfSustained,
    });

    document.getElementById('death-title').textContent = '💥 ' + getDeathTitle(cause);
    document.getElementById('death-stats').innerText = getDeathStats({
      seconds,
      fusionCount: world.fusionCount,
      maxTemp,
      maxCombo: world.maxCombo,
    });
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
    const learnMore = getLearnMorePages();
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

  languageButton.addEventListener('click', () => setLocale(getNextLocale()));

  for (const button of difficultyButtons) {
    button.addEventListener('click', () => {
      setWorldDifficulty(world, button.dataset.difficulty);
      window.localStorage?.setItem(DIFFICULTY_STORAGE_KEY, world.difficulty);
      renderDifficultyButtons();
    });
    button.addEventListener('keydown', (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      button.blur();
    });
  }

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
    const learnMore = getLearnMorePages();
    if (learnIdx < learnMore.length - 1) { learnIdx++; renderLearnPage(); }
  });

  renderStaticText();
  onLocaleChange(renderStaticText);

  return {};
}

function show(el) { el.style.display = 'flex'; }
function hide(el) { el.style.display = 'none'; }
function getNextLocale() { return getLocale() === 'ja' ? 'zh' : 'ja'; }
