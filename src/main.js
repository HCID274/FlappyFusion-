// Entry point. Wires all modules together.
// Composition root — the only place that knows about every layer.

import { CONFIG } from './config.js';
import { preloadAssets } from './assetLoader.js';
import { createWorld } from './world.js';
import { initLocale } from './content.js';
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

import { createRenderer } from './presentation/renderer.js';
import { createHUD } from './presentation/hud.js';
import { createScreens } from './presentation/screens.js';

const canvas = document.getElementById('game');
initLocale();
await preloadAssets();
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;
const ctx = canvas.getContext('2d');

const eventBus = createEventBus();
const world = createWorld();

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
    if (world.status === 'playing') world.elapsed += dt;
    for (const s of systems) s.update(dt);
    stateMachine.update(dt);
  },
  render: () => {
    renderer.render();
    hud.refresh();
  },
});

loop.start();
