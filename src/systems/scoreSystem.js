import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';
import { scoreForPhase } from '../scoreMath.js';

export function createScoreSystem(eventBus, world) {
  function bump(amount) {
    world.score += scoreForPhase(amount, world.phase);
    eventBus.emit(EV.SCORE_CHANGED, { score: world.score });
  }

  function bumpRaw(amount) {
    world.score += amount;
    eventBus.emit(EV.SCORE_CHANGED, { score: world.score });
  }

  eventBus.on(EV.OBSTACLE_PASSED, () => bump(CONFIG.score.perObstacle));
  eventBus.on(EV.COLLECTIBLE_HIT, ({ collectible }) => {
    bump(collectible.type === 'Li6' ? CONFIG.score.perLithium : CONFIG.score.perCollectible);
  });
  eventBus.on(EV.PARTICLE_COLLECTED, () => bump(CONFIG.score.perParticle));
  eventBus.on(EV.FUSION_TRIGGERED, ({ score }) => bumpRaw(score ?? scoreForPhase(CONFIG.score.perFusionBase, world.phase)));
  eventBus.on(EV.SELF_SUSTAIN_ACHIEVED, ({ score }) => bumpRaw(score ?? CONFIG.score.selfSustainBonus));

  return { update(_dt) {} };
}
