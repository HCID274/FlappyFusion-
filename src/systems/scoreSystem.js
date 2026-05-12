import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

export function createScoreSystem(eventBus, world) {
  function bump(amount) {
    world.score += amount;
    eventBus.emit(EV.SCORE_CHANGED, { score: world.score });
  }

  eventBus.on(EV.OBSTACLE_PASSED, () => bump(CONFIG.score.perObstacle));
  eventBus.on(EV.COLLECTIBLE_HIT, ({ collectible }) => {
    bump(collectible.type === 'Li6' ? CONFIG.score.perLithium : CONFIG.score.perCollectible);
  });
  eventBus.on(EV.PARTICLE_COLLECTED, () => bump(CONFIG.score.perParticle));
  eventBus.on(EV.FUSION_TRIGGERED, ({ score }) => bump(score ?? CONFIG.score.perFusionBase));

  return { update(_dt) {} };
}
