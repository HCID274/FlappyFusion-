// Screen-level visual effects. Subscribes to gameplay events and writes draw-only state.

import { CONFIG } from '../config.js';
import { EV } from '../engine/events.js';

function phaseGlowKey(phase) {
  return CONFIG.phases.rules[phase]?.glow || CONFIG.phases.rules.IGNITION_PREP.glow;
}

function resetFx(world) {
  world.timeScale = 1;
  world.screenFx.phaseGlow.from = phaseGlowKey(world.phase);
  world.screenFx.phaseGlow.to = phaseGlowKey(world.phase);
  world.screenFx.phaseGlow.t = 1;
  world.screenFx.cornerGlowT = 0;
  world.screenFx.radialPulseT = 0;
  world.screenFx.whiteFlashT = 0;
  world.screenFx.shakeT = 0;
  world.screenFx.shakeDuration = 0;
  world.screenFx.shakeAmplitude = 0;
  world.screenFx.shakeX = 0;
  world.screenFx.shakeY = 0;
  world.screenFx.ignitionEntryT = 0;
  world.screenFx.selfSustainBurstT = 0;
  world.screenFx.selfSustainVignetteT = 0;
  world.screenFx.burstParticles.length = 0;
}

function startShake(fx, duration, amplitude) {
  fx.shakeT = Math.max(fx.shakeT, duration);
  fx.shakeDuration = Math.max(fx.shakeDuration, duration);
  fx.shakeAmplitude = Math.max(fx.shakeAmplitude, amplitude);
}

function startRadialPulse(fx, duration) {
  if (fx.radialPulseT >= duration) return;
  fx.radialPulseT = duration;
  fx.radialPulseDuration = duration;
}

function spawnSelfSustainParticles(fx) {
  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height / 2;
  fx.burstParticles.length = 0;

  for (let i = 0; i < CONFIG.ignitionPhase.exitBurstParticleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 200;
    const radius = 2 + Math.random() * 3.5;
    fx.burstParticles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 3,
      maxLife: 3,
      radius,
      color: Math.random() < 0.65 ? '#ffcc44' : '#ffffff',
    });
  }
}

function canFlash(now, flashTimes, cfg) {
  while (flashTimes.length && now - flashTimes[0] > cfg.whiteFlashLimitWindow) {
    flashTimes.shift();
  }
  if (flashTimes.length >= cfg.whiteFlashLimitCount) return false;
  flashTimes.push(now);
  return true;
}

function updateShake(fx) {
  if (fx.shakeT <= 0 || fx.shakeDuration <= 0) {
    fx.shakeX = 0;
    fx.shakeY = 0;
    fx.shakeAmplitude = 0;
    return;
  }

  const intensity = fx.shakeAmplitude * (fx.shakeT / fx.shakeDuration);
  fx.shakeX = (Math.random() * 2 - 1) * intensity;
  fx.shakeY = (Math.random() * 2 - 1) * intensity * 0.45;
}

function updateBurstParticles(fx, dt) {
  for (let i = fx.burstParticles.length - 1; i >= 0; i--) {
    const p = fx.burstParticles[i];
    p.vx *= 1 - Math.min(0.55, dt * 0.85);
    p.vy = p.vy * (1 - Math.min(0.45, dt * 0.65)) + 55 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) fx.burstParticles.splice(i, 1);
  }
}

function updateTimeScale(world) {
  const fx = world.screenFx;
  if (fx.selfSustainBurstT > 0) {
    world.timeScale = CONFIG.ignitionPhase.selfSustainSlowTimeScale;
  } else if (fx.ignitionEntryT > 0) {
    world.timeScale = CONFIG.ignitionPhase.enterSlowTimeScale;
  } else {
    world.timeScale = 1;
  }
}

export function createScreenFxSystem(eventBus, world) {
  const flashTimes = [];
  let fxElapsed = 0;

  eventBus.on(EV.FUSION_TRIGGERED, ({ combo }) => {
    const fx = world.screenFx;
    const cfg = CONFIG.combo.screenFx;
    if (combo < 2) return;

    fx.cornerGlowT = Math.max(fx.cornerGlowT, cfg.glowDuration);

    if (combo >= 3) {
      startRadialPulse(fx, cfg.pulseDuration);
    }
    if (combo >= 4) {
      startShake(fx, cfg.shakeDuration4, cfg.shakeAmplitude4);
    }
    if (combo >= 5) {
      startShake(fx, cfg.shakeDuration5, cfg.shakeAmplitude5);
      if (canFlash(fxElapsed, flashTimes, cfg)) {
        fx.whiteFlashT = Math.max(fx.whiteFlashT, cfg.whiteFlashDuration);
      }
    }
  });

  eventBus.on(EV.PHASE_CHANGED, ({ from, to }) => {
    const fx = world.screenFx;
    fx.phaseGlow.from = phaseGlowKey(from);
    fx.phaseGlow.to = phaseGlowKey(to);
    fx.phaseGlow.t = 0;

    if (to === 'IGNITION_BURST') {
      fx.ignitionEntryT = CONFIG.ignitionPhase.enterFreezeDuration;
    }
  });

  eventBus.on(EV.SELF_SUSTAIN_ACHIEVED, () => {
    const fx = world.screenFx;
    fx.selfSustainBurstT = CONFIG.ignitionPhase.selfSustainSlowDuration;
    fx.selfSustainVignetteT = CONFIG.ignitionPhase.selfSustainVignetteDuration;
    startRadialPulse(fx, 0.6);
    startShake(fx, 0.2, CONFIG.combo.screenFx.shakeAmplitude5);
    spawnSelfSustainParticles(fx);
  });

  eventBus.on(EV.GAME_RESET, () => {
    flashTimes.length = 0;
    fxElapsed = 0;
    resetFx(world);
  });

  return {
    update(dt) {
      fxElapsed += dt;
      const fx = world.screenFx;
      fx.phaseGlow.t = Math.min(1, fx.phaseGlow.t + dt / fx.phaseGlow.duration);
      fx.cornerGlowT = Math.max(0, fx.cornerGlowT - dt);
      fx.radialPulseT = Math.max(0, fx.radialPulseT - dt);
      fx.whiteFlashT = Math.max(0, fx.whiteFlashT - dt);
      fx.shakeT = Math.max(0, fx.shakeT - dt);
      fx.ignitionEntryT = Math.max(0, fx.ignitionEntryT - dt);
      fx.selfSustainBurstT = Math.max(0, fx.selfSustainBurstT - dt);
      fx.selfSustainVignetteT = Math.max(0, fx.selfSustainVignetteT - dt);
      updateShake(fx);
      updateBurstParticles(fx, dt);
      updateTimeScale(world);
    },
  };
}
