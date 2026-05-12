// Tracks D / T inventory and triggers a fusion event each time both are >= 1.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { scoreForPhase } from '../scoreMath.js';

export function createFusionSystem(eventBus, world) {
  let comboWindow = CONFIG.combo.window;
  let phase = 'IGNITION_PREP';

  function resetCombo() {
    world.combo.count = 0;
    world.combo.lastTime = -Infinity;
    world.combo.window = comboWindow;
  }

  eventBus.on(EV.PLASMA_DEAD, () => {
    resetCombo();
    world.fusionBurst.active = false;
    world.fusionBurst.remaining = 0;
  });

  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    phase = to;
    const phaseRules = CONFIG.phases.rules[to] || CONFIG.phases.rules.IGNITION_PREP;
    comboWindow = phaseRules.comboWindow ?? CONFIG.combo.window;
    world.combo.window = comboWindow;
    resetCombo();
    if (to === 'IGNITION_BURST') {
      world.fusionBurst.active = false;
      world.fusionBurst.remaining = 0;
    }
  });

  eventBus.on(EV.GAME_RESET, () => {
    phase = 'IGNITION_PREP';
    comboWindow = CONFIG.combo.window;
    world.combo.window = comboWindow;
    resetCombo();
  });

  eventBus.on(EV.COLLECTIBLE_HIT, ({ collectible }) => {
    if (collectible.type === 'D') world.collectedD += 1;
    else if (collectible.type === 'T' || collectible.type === 'Li6') {
      world.collectedT += 1;
    }

    const need = CONFIG.fusion.requires;
    while (world.collectedD >= need.D && world.collectedT >= need.T) {
      world.collectedD -= need.D;
      world.collectedT -= need.T;
      world.fusionCount += 1;
      const withinWindow = world.elapsed - world.combo.lastTime <= comboWindow;
      world.combo.count = withinWindow ? world.combo.count + 1 : 1;
      world.combo.lastTime = world.elapsed;
      world.maxCombo = Math.max(world.maxCombo, world.combo.count);
      world.fusionBurst.active = true;
      world.fusionBurst.remaining = CONFIG.fusion.burstWindow;
      const tableIndex = Math.min(world.combo.count, CONFIG.combo.scoreTable.length) - 1;
      const baseScore = CONFIG.combo.scoreTable[tableIndex];
      const score = scoreForPhase(baseScore, phase);
      const payload = {
        x: world.plasma.pos.x,
        y: world.plasma.pos.y,
        count: world.fusionCount,
        combo: world.combo.count,
        baseScore,
        score,
      };
      eventBus.emit(EV.COMBO_INCREMENT, payload);
      eventBus.emit(EV.FUSION_TRIGGERED, {
        ...payload,
      });
    }
  });

  return {
    update(dt) {
      if (world.status !== 'playing') return;
      if (world.fusionBurst.active) {
        world.fusionBurst.remaining = Math.max(0, world.fusionBurst.remaining - dt);
        if (world.fusionBurst.remaining <= 0) world.fusionBurst.active = false;
      }
      if (world.combo.count > 0 && world.elapsed - world.combo.lastTime > comboWindow) {
        resetCombo();
      }
    },
  };
}
