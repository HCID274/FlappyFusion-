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
import { EV } from './engine/events.js';

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
applyDocumentFonts(initLocale());
onLocaleChange(applyDocumentFonts);
await preloadAssets();
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const maxRenderScale = CONFIG.canvas.renderScale || 1;

function getFallbackStageSize() {
  const viewport = window.visualViewport;
  const viewportWidth = viewport?.width || window.innerWidth || document.documentElement.clientWidth || CONFIG.canvas.width;
  const viewportHeight = viewport?.height || window.innerHeight || document.documentElement.clientHeight || CONFIG.canvas.height;
  const width = Math.min(viewportWidth, viewportHeight * (4 / 3));
  const height = Math.min(viewportHeight, viewportWidth * (3 / 4));

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

function getStageSize() {
  const rect = stage?.getBoundingClientRect();
  if (!rect?.width || !rect?.height) return getFallbackStageSize();

  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };
}

function syncCanvasToStage() {
  const { width, height } = getStageSize();
  const renderScale = Math.min(Math.max(1, window.devicePixelRatio || 1), maxRenderScale);

  CONFIG.canvas.width = width;
  CONFIG.canvas.height = height;
  CONFIG.canvas.renderScale = renderScale;

  canvas.width = Math.round(width * renderScale);
  canvas.height = Math.round(height * renderScale);
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

function clampWorldToStage(world) {
  const margin = CONFIG.obstacle.wallMargin;
  const p = world.plasma;
  const minY = margin + p.radius;
  const maxX = Math.max(p.radius, CONFIG.canvas.width - p.radius);
  const maxY = Math.max(minY, CONFIG.canvas.height - margin - p.radius);

  p.pos.x = Math.min(Math.max(p.radius, p.pos.x), maxX);
  p.pos.y = Math.min(Math.max(minY, p.pos.y), maxY);
  world.lastGapY = Math.min(Math.max(margin + 140, world.lastGapY), Math.max(margin + 140, CONFIG.canvas.height - margin - 140));

  for (const obstacle of world.obstacles) obstacle.layout?.();
}

syncCanvasToStage();

const eventBus = createEventBus();
const world = createWorld();
clampWorldToStage(world);
const screenFxSystem = createScreenFxSystem(eventBus, world);
createFullscreenSystem(eventBus, world, stage);
eventBus.on(EV.GAME_RESET, () => clampWorldToStage(world));

// A page refresh is an operator reset at the booth. Keep language/difficulty
// preferences in localStorage, but never carry viewed tutorial cards into it.
clearSeenTutorials();

function resizeGame() {
  syncCanvasToStage();
  clampWorldToStage(world);
}

window.addEventListener('resize', resizeGame);
window.visualViewport?.addEventListener('resize', resizeGame);
if (typeof ResizeObserver !== 'undefined' && stage) {
  new ResizeObserver(resizeGame).observe(stage);
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
