// Entry point. Wires all modules together.
// Composition root — the only place that knows about every layer.

import { CONFIG } from './config.js';
import { preloadAssets } from './assetLoader.js';
import { createWorld } from './world.js';
import { initLocale, onLocaleChange } from './content.js';
import { applyDocumentFonts } from './theme.js';
import { createEventBus } from './engine/eventBus.js';
import { createGameLoop } from './engine/gameLoop.js';
import { createStateMachine } from './engine/stateMachine.js';

import { createInputSystem } from './systems/inputSystem.js';
import { createSpawnSystem } from './systems/spawnSystem.js';
import { createParticleStreamSystem } from './systems/particleStreamSystem.js';
import { createPhysicsSystem } from './systems/physicsSystem.js';
import { createCollisionSystem } from './systems/collisionSystem.js';
import { createFusionSystem } from './systems/fusionSystem.js';
import { createScoreSystem } from './systems/scoreSystem.js';
import { createTemperatureSystem } from './systems/temperatureSystem.js';
import { createPhaseSystem } from './systems/phaseSystem.js';
import { createIgnitionPhaseSystem } from './systems/ignitionPhaseSystem.js';
import { createDifficultySystem } from './systems/difficultySystem.js';
import { createParticleSystem } from './systems/particleSystem.js';
import { createCleanupSystem } from './systems/cleanupSystem.js';
import { createScreenFxSystem } from './systems/screenFxSystem.js';
import { clearSeenTutorials, createTutorialSystem } from './systems/tutorialSystem.js';
import { createIdleResetSystem } from './systems/idleResetSystem.js';
import { createFullscreenSystem } from './systems/fullscreenSystem.js';
import { createAudioSystem } from './systems/audioSystem.js';
import { createVoiceCueSystem } from './systems/voiceCueSystem.js';

import { createRenderer } from './presentation/renderer.js';
import { createHUD } from './presentation/hud.js';
import { createScreens } from './presentation/screens.js';
import { createTutorialScreen } from './presentation/tutorialScreen.js';

const canvas = document.getElementById('game');
const stage = canvas.closest('.game-wrap');
const frame = canvas.closest('.game-frame');
const gameStage = canvas.closest('.game-stage');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const designWidth = CONFIG.canvas.width;
const designHeight = CONFIG.canvas.height;
const maxBackingScale = CONFIG.canvas.renderScale || 1;

function parseCssPx(raw) {
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

function getSafeInsets() {
  const style = getComputedStyle(stage || document.documentElement);
  return {
    left: parseCssPx(style.paddingLeft),
    right: parseCssPx(style.paddingRight),
    top: parseCssPx(style.paddingTop),
    bottom: parseCssPx(style.paddingBottom),
  };
}

function getViewportSize() {
  const viewport = window.visualViewport;
  const safe = getSafeInsets();
  const safeX = safe.left + safe.right;
  const safeY = safe.top + safe.bottom;
  const rawWidth = viewport?.width || window.innerWidth || document.documentElement.clientWidth || designWidth;
  const rawHeight = viewport?.height || window.innerHeight || document.documentElement.clientHeight || designHeight;

  return {
    width: Math.max(1, rawWidth - safeX),
    height: Math.max(1, rawHeight - safeY),
  };
}

function getFrameLayout() {
  const viewport = getViewportSize();
  const scale = Math.max(0.01, Math.min(viewport.width / designWidth, viewport.height / designHeight));

  return {
    scale,
    width: designWidth * scale,
    height: designHeight * scale,
  };
}

function syncCanvasToFrame() {
  const { width, height, scale: layoutScale } = getFrameLayout();
  const backingScale = Math.min(
    Math.max(1, (window.devicePixelRatio || 1) * layoutScale),
    maxBackingScale,
  );

  // Keep gameplay and HUD on the original 800x600 coordinate system.
  CONFIG.canvas.width = designWidth;
  CONFIG.canvas.height = designHeight;
  CONFIG.canvas.renderScale = backingScale;

  frame?.style.setProperty('--game-scale', String(layoutScale));
  if (frame) {
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
  }
  gameStage?.style.setProperty('--game-scale', String(layoutScale));
  canvas.width = Math.round(designWidth * backingScale);
  canvas.height = Math.round(designHeight * backingScale);
  canvas.style.width = `${designWidth}px`;
  canvas.style.height = `${designHeight}px`;

  ctx.setTransform(backingScale, 0, 0, backingScale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

syncCanvasToFrame();
applyDocumentFonts(initLocale());
onLocaleChange(applyDocumentFonts);
await preloadAssets();
syncCanvasToFrame();

const eventBus = createEventBus();
const world = createWorld();
const screenFxSystem = createScreenFxSystem(eventBus, world);
createFullscreenSystem(eventBus, world, stage);

// A page refresh is an operator reset at the booth. Keep language/difficulty
// preferences in localStorage, but never carry viewed tutorial cards into it.
clearSeenTutorials();

function resizeGame() {
  syncCanvasToFrame();
}

window.addEventListener('resize', resizeGame);
window.visualViewport?.addEventListener('resize', resizeGame);
if (typeof ResizeObserver !== 'undefined' && frame) {
  new ResizeObserver(resizeGame).observe(frame);
}

// Order matters: input → spawn → particle stream → physics → collision → fusion → score/temp → phase/ignition → difficulty → particles → cleanup
const systems = [
  createInputSystem(eventBus, world),
  createSpawnSystem(eventBus, world),
  createParticleStreamSystem(eventBus, world),
  createPhysicsSystem(eventBus, world),
  createCollisionSystem(eventBus, world),
  createFusionSystem(eventBus, world),
  createScoreSystem(eventBus, world),
  createTemperatureSystem(eventBus, world),
  createPhaseSystem(eventBus, world),
  createIgnitionPhaseSystem(eventBus, world),
  createDifficultySystem(eventBus, world),
  createTutorialSystem(eventBus, world),
  createIdleResetSystem(eventBus, world),
  createVoiceCueSystem(eventBus, world),
  createAudioSystem(eventBus, world),
  createParticleSystem(eventBus, world),
  createCleanupSystem(eventBus, world),
];

const stateMachine = createStateMachine(eventBus, world);
const renderer = createRenderer(ctx, world);
const hud = createHUD(eventBus, world);
createScreens(eventBus, world);
createTutorialScreen(eventBus, world);

const loop = createGameLoop({
  update: (dt) => {
    screenFxSystem.update(dt);
    const gameDt = dt * (world.timeScale ?? 1);
    if (world.status === 'playing') world.elapsed += gameDt;
    for (const s of systems) s.update(gameDt);
    stateMachine.update(gameDt);
  },
  render: () => {
    renderer.render();
    hud.refresh();
  },
});

loop.start();
