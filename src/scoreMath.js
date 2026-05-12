// Shared scoring helpers so game state and floating text use the same phase multiplier.

import { CONFIG } from './config.js';

export function getPhaseScoreMul(phase) {
  const phaseRules = CONFIG.phases.rules[phase] || CONFIG.phases.rules.IGNITION_PREP;
  return phaseRules.scoreMul ?? 1;
}

export function scoreForPhase(amount, phase) {
  return Math.round(amount * getPhaseScoreMul(phase));
}
