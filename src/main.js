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

import { createRenderer } from './presentation/renderer.js';
import { createHUD } from './presentation/hud.js';
import { createScreens } from './presentation/screens.js';

const canvas = document.getElementById('game');
applyDocumentFonts(initLocale());
onLocaleChange(applyDocumentFonts);
await preloadAssets();
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

const maxRenderScale = CONFIG.canvas.renderScale || 1;

function getViewportSize() {
  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth || document.documentElement.clientWidth || CONFIG.canvas.width;
  const height = viewport?.height || window.innerHeight || document.documentElement.clientHeight || CONFIG.canvas.height;
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

function syncCanvasToViewport() {
  const { width, height } = getViewportSize();
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

function clampWorldToViewport(world) {
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

syncCanvasToViewport();

const eventBus = createEventBus();
const world = createWorld();
const screenFxSystem = createScreenFxSystem(eventBus, world);

window.addEventListener('resize', () => {
  syncCanvasToViewport();
  clampWorldToViewport(world);
});
window.visualViewport?.addEventListener('resize', () => {
  syncCanvasToViewport();
  clampWorldToViewport(world);
});

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
  createParticleSystem(eventBus, world),
  createCleanupSystem(eventBus, world),
];

const stateMachine = createStateMachine(eventBus, world);
const renderer = createRenderer(ctx, world);
const hud = createHUD(eventBus, world);
createScreens(eventBus, world);

const loop = createGameLoop({
  update: (dt) => {
    screenFxSystem.update(dt);
    const gameDt = dt * (world.timeScale || 1);
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
