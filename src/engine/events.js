// Event name constants. All cross-module communication uses these.
// Adding new events: add a constant here, document who emits and who subscribes.

export const EV = {
  INPUT_PULSE: 'input:pulse',
  PLASMA_DEAD: 'plasma:dead',
  OBSTACLE_PASSED: 'obstacle:passed',
  COLLECTIBLE_HIT: 'collectible:hit',
  PARTICLE_COLLECTED: 'particle:collected',
  HAZARD_HIT: 'hazard:hit',
  BOOST_TRIGGERED: 'boost:triggered',
  COMBO_INCREMENT: 'combo:increment',
  FUSION_TRIGGERED: 'fusion:triggered',
  TEMP_CHANGED: 'temp:changed',
  TEMP_MILESTONE: 'temp:milestone',
  PHASE_CHANGED: 'phase:changed',
  IGNITION_TICK: 'ignition:tick',
  SELF_SUSTAIN_ACHIEVED: 'self-sustain:achieved',
  SCORE_CHANGED: 'score:changed',
  STATE_CHANGED: 'state:changed',
  GAME_RESET: 'game:reset',
  FULLSCREEN_TOGGLE_REQUESTED: 'fullscreen:toggle-requested',
  FULLSCREEN_CHANGED: 'fullscreen:changed',
  AUDIO_CHANGED: 'audio:changed',
  INSTABILITY_SPAWNED: 'instability:spawned',
  ENTITY_SPAWNED: 'entity:spawned',
  TUTORIAL_REQUESTED: 'tutorial:requested',
  TUTORIAL_DISMISSED: 'tutorial:dismissed',
};
