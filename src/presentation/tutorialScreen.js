import { getAssetUrl } from '../assetLoader.js';
import { CONFIG } from '../config.js';
import { t, onAudienceChange, onLocaleChange } from '../content.js';
import { EV } from '../engine/events.js';

const TUTORIAL_ILLUSTRATIONS = {
  fusion: './assets/2x/01D_T.png',
  li: './assets/2x/02Li6-T.png',
  tungsten: './assets/2x/03hazard_tungsten.png',
  nbi: './assets/2x/04boost_nbi.png',
};

export function createTutorialScreen(eventBus, world) {
  const overlay = document.getElementById('screen-tutorial');
  const dims = {
    top: document.getElementById('tutorial-dim-top'),
    right: document.getElementById('tutorial-dim-right'),
    bottom: document.getElementById('tutorial-dim-bottom'),
    left: document.getElementById('tutorial-dim-left'),
  };
  const focusRing = document.getElementById('tutorial-focus-ring');
  const card = document.getElementById('tutorial-card');
  const image = document.getElementById('tutorial-illust');
  const title = document.getElementById('tutorial-title');
  const body = document.getElementById('tutorial-body');
  const hint = document.getElementById('tutorial-hint');

  let activeId = null;
  let activeTarget = null;
  let imageRequest = 0;

  hide(overlay);

  function renderText() {
    if (!activeId) return;
    title.textContent = t(`tutorial.${activeId}.title`);
    body.innerText = t(`tutorial.${activeId}.body`);
    hint.textContent = t('ui.tutorialContinueHint');
  }

  async function renderImage() {
    const requestId = ++imageRequest;
    const path = TUTORIAL_ILLUSTRATIONS[activeId];
    image.style.display = '';
    image.removeAttribute('src');
    image.onload = () => {
      image.style.display = '';
    };
    image.onerror = () => {
      image.style.display = 'none';
    };

    const src = await getAssetUrl(path);
    if (requestId !== imageRequest) return;
    if (!src) {
      image.style.display = 'none';
      return;
    }
    image.src = src;
  }

  function showTutorial(id, target) {
    activeId = id;
    activeTarget = target || null;
    renderText();
    renderImage();
    show(overlay);
    updateSpotlight();
    requestAnimationFrame(updateSpotlight);
  }

  function closeTutorial() {
    if (!activeId) return;
    const id = activeId;
    activeId = null;
    activeTarget = null;
    hide(overlay);
    eventBus.emit(EV.TUTORIAL_DISMISSED, { id });
  }

  eventBus.on(EV.TUTORIAL_REQUESTED, ({ id, target } = {}) => {
    if (!id) return;
    showTutorial(id, target);
  });

  eventBus.on(EV.STATE_CHANGED, ({ to }) => {
    if (to !== 'playing') {
      activeId = null;
      activeTarget = null;
      hide(overlay);
    }
  });

  window.addEventListener('keydown', (event) => {
    if (!activeId || event.code !== 'Space') return;
    event.preventDefault();
    event.stopPropagation();
    closeTutorial();
  });

  onLocaleChange(renderText);
  onAudienceChange(renderText);
  window.addEventListener('resize', updateSpotlight);
  window.visualViewport?.addEventListener('resize', updateSpotlight);

  return {};
  
  function updateSpotlight() {
    if (!activeId || overlay.style.display === 'none') return;
    const rect = overlay.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const focus = toCssFocusRect(activeTarget, rect);
    setBox(dims.top, 0, 0, rect.width, focus.top);
    setBox(dims.right, focus.left + focus.width, focus.top, rect.width - focus.left - focus.width, focus.height);
    setBox(dims.bottom, 0, focus.top + focus.height, rect.width, rect.height - focus.top - focus.height);
    setBox(dims.left, 0, focus.top, focus.left, focus.height);
    setBox(focusRing, focus.left, focus.top, focus.width, focus.height);
    positionCard(rect, focus);
  }

  function toCssFocusRect(target, rect) {
    const logicalW = CONFIG.canvas.width || rect.width;
    const logicalH = CONFIG.canvas.height || rect.height;
    const scaleX = rect.width / logicalW;
    const scaleY = rect.height / logicalH;
    const source = target || {
      x: logicalW * 0.58,
      y: logicalH * 0.5,
      w: CONFIG.tutorial.focusMinSize,
      h: CONFIG.tutorial.focusMinSize,
    };
    const padding = CONFIG.tutorial.focusPadding;
    const minSize = CONFIG.tutorial.focusMinSize;
    const width = Math.max(source.w * scaleX + padding * 2, minSize);
    const height = Math.max(source.h * scaleY + padding * 2, minSize);
    const centerX = (source.x + source.w / 2) * scaleX;
    const centerY = (source.y + source.h / 2) * scaleY;

    return {
      left: clamp(centerX - width / 2, 8, Math.max(8, rect.width - width - 8)),
      top: clamp(centerY - height / 2, 8, Math.max(8, rect.height - height - 8)),
      width,
      height,
    };
  }

  function positionCard(rect, focus) {
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width || Math.min(420, rect.width - 32);
    const cardHeight = cardRect.height || 280;
    const defaultTop = clamp(rect.height * CONFIG.tutorial.cardTopFraction, 14, rect.height - cardHeight - 14);
    const cardLeft = (rect.width - cardWidth) / 2;
    const proposed = { left: cardLeft, top: defaultTop, width: cardWidth, height: cardHeight };
    const focusWithMargin = {
      left: focus.left - 14,
      top: focus.top - 14,
      width: focus.width + 28,
      height: focus.height + 28,
    };
    let top = defaultTop;

    if (rectsOverlap(proposed, focusWithMargin)) {
      const aboveTop = focus.top - cardHeight - 18;
      const belowTop = focus.top + focus.height + 18;
      top = aboveTop >= 14 ? aboveTop : Math.min(belowTop, rect.height - cardHeight - 14);
    }

    card.style.top = `${Math.max(14, top)}px`;
  }
}

function setBox(el, left, top, width, height) {
  if (!el) return;
  el.style.left = `${Math.max(0, left)}px`;
  el.style.top = `${Math.max(0, top)}px`;
  el.style.width = `${Math.max(0, width)}px`;
  el.style.height = `${Math.max(0, height)}px`;
}

function rectsOverlap(a, b) {
  return a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function show(el) {
  el.style.display = 'block';
  el.classList.add('active');
}

function hide(el) {
  el.classList.remove('active');
  el.style.display = 'none';
}
