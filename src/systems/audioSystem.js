// Centralized audio layer. Gameplay systems emit events; this system alone maps
// those events to concrete sound assets and browser playback behavior.

import { EV } from '../engine/events.js';

const AUDIO = {
  pickup: new URL('../assets/audio/pickup.wav', import.meta.url).href,
  pulse: new URL('../assets/audio/pulse.wav', import.meta.url).href,
  fusion: new URL('../assets/audio/fusion.ogg', import.meta.url).href,
  hazard: new URL('../assets/audio/hazard.ogg', import.meta.url).href,
  boost: new URL('../assets/audio/boost.ogg', import.meta.url).href,
  death: new URL('../assets/audio/death.ogg', import.meta.url).href,
  ui: new URL('../assets/audio/ui.mp3', import.meta.url).href,
  menu: new URL('../assets/audio/menu.mp3', import.meta.url).href,
  game: new URL('../assets/audio/game.mp3', import.meta.url).href,
  ignition: new URL('../assets/audio/ignition.ogg', import.meta.url).href,
  success: new URL('../assets/audio/success.mp3', import.meta.url).href,
};

const SFX = {
  pickup: { volume: 0.42, pool: 8 },
  pulse: { volume: 0.22, pool: 4 },
  fusion: { volume: 0.42, pool: 3 },
  hazard: { volume: 0.4, pool: 3 },
  boost: { volume: 0.38, pool: 3 },
  death: { volume: 0.48, pool: 2 },
  ui: { volume: 0.24, pool: 4 },
};

const LOOPS = {
  menu: { volume: 0.16 },
  game: { volume: 0.22 },
  ignition: { volume: 0.24 },
  success: { volume: 0.28 },
};

export function createAudioSystem(eventBus, world) {
  if (typeof Audio === 'undefined') return { update(_dt) {} };

  const pools = new Map();
  const cursors = new Map();
  const loops = createLoops();
  let unlocked = false;
  let desiredLoop = world.status === 'playing' ? 'game' : 'menu';
  let activeLoop = null;
  let fadeFrame = 0;

  for (const [name, cfg] of Object.entries(SFX)) {
    pools.set(name, Array.from({ length: cfg.pool }, () => createAudio(AUDIO[name], false)));
    cursors.set(name, 0);
  }

  function createLoops() {
    return Object.fromEntries(Object.keys(LOOPS).map((name) => {
      const audio = createAudio(AUDIO[name], true);
      audio.volume = 0;
      return [name, audio];
    }));
  }

  function createAudio(src, loop) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.loop = loop;
    return audio;
  }

  function canPlay() {
    return Boolean(world.audioEnabled && unlocked);
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    for (const audio of [...Object.values(loops), ...Array.from(pools.values()).flat()]) {
      audio.load();
    }
    if (world.audioEnabled) switchLoop(desiredLoop);
  }

  function playSfx(name) {
    if (!canPlay()) return;
    const pool = pools.get(name);
    const cfg = SFX[name];
    if (!pool || !cfg) return;

    const next = cursors.get(name) || 0;
    cursors.set(name, (next + 1) % pool.length);
    const audio = pool[next];
    audio.pause();
    audio.currentTime = 0;
    audio.volume = cfg.volume;
    audio.playbackRate = 1;
    audio.play().catch(() => {});
  }

  function stopLoops() {
    desiredLoop = null;
    activeLoop = null;
    cancelAnimationFrame(fadeFrame);
    for (const audio of Object.values(loops)) {
      audio.pause();
      audio.volume = 0;
    }
  }

  function switchLoop(name) {
    desiredLoop = name;
    if (!world.audioEnabled) {
      stopLoops();
      return;
    }
    if (!unlocked || !name || activeLoop === name) return;

    activeLoop = name;
    const startedAt = performance.now();
    const duration = 550;
    for (const [loopName, audio] of Object.entries(loops)) {
      if (loopName === name) {
        audio.play().catch(() => {});
      }
    }

    cancelAnimationFrame(fadeFrame);
    function step(now) {
      const t = Math.min(1, (now - startedAt) / duration);
      for (const [loopName, audio] of Object.entries(loops)) {
        const target = loopName === name ? LOOPS[loopName].volume : 0;
        const current = Number.isFinite(audio.volume) ? audio.volume : 0;
        audio.volume = current + (target - current) * Math.min(1, t + 0.16);
        if (loopName !== name && t >= 1) audio.pause();
      }
      if (t < 1) fadeFrame = requestAnimationFrame(step);
    }
    fadeFrame = requestAnimationFrame(step);
  }

  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true });

  eventBus.on(EV.AUDIO_CHANGED, ({ enabled } = {}) => {
    world.audioEnabled = enabled !== false;
    if (!world.audioEnabled) {
      stopLoops();
      return;
    }
    unlock();
    playSfx('ui');
    switchLoop(desiredLoop || (world.status === 'playing' ? 'game' : 'menu'));
  });

  eventBus.on(EV.STATE_CHANGED, ({ to }) => {
    if (to === 'playing') {
      playSfx('ui');
      switchLoop(loopForWorld());
    } else if (to === 'menu' || to === 'dead') {
      switchLoop('menu');
    }
  });

  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    if (to === 'IGNITION_BURST') {
      switchLoop('ignition');
    } else if (world.status === 'playing' && !world.selfSustained) {
      switchLoop('game');
    }
  });

  eventBus.on(EV.SELF_SUSTAIN_ACHIEVED, () => {
    switchLoop('success');
  });

  eventBus.on(EV.INPUT_PULSE, () => {
    if (world.status === 'playing' && !world.tutorialPaused) playSfx('pulse');
  });
  eventBus.on(EV.COLLECTIBLE_HIT, () => playSfx('pickup'));
  eventBus.on(EV.PARTICLE_COLLECTED, () => playSfx('pickup'));
  eventBus.on(EV.BOOST_TRIGGERED, () => playSfx('boost'));
  eventBus.on(EV.HAZARD_HIT, () => playSfx('hazard'));
  eventBus.on(EV.FUSION_TRIGGERED, () => playSfx('fusion'));
  eventBus.on(EV.PLASMA_DEAD, () => playSfx('death'));
  eventBus.on(EV.TUTORIAL_REQUESTED, () => playSfx('ui'));
  eventBus.on(EV.TUTORIAL_DISMISSED, () => playSfx('ui'));

  return { update(_dt) {} };

  function loopForWorld() {
    if (world.selfSustained) return 'success';
    if (world.phase === 'IGNITION_BURST' || world.ignitionPhase?.active) return 'ignition';
    return 'game';
  }
}
