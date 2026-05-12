// Independent free-electron stream spawner. Particles add score only; they never enter fuel bay.

import { EV } from '../engine/events.js';
import { CONFIG } from '../config.js';

let nextId = 0;
const INITIAL_BURST_DELAY = 0.12;

function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function scheduleNext() {
  return rand(CONFIG.particleStream.burstIntervalMin, CONFIG.particleStream.burstIntervalMax);
}

function createStreamParticle(x, y) {
  const r = CONFIG.particleStream.radius;
  const hitR = r + 6;
  const p = {
    id: `el${nextId++}`,
    type: 'particle',
    pos: { x, y },
    radius: r,
    hitBox: { x: x - hitR, y: y - hitR, w: hitR * 2, h: hitR * 2 },
    collected: false,
    wobble: Math.random() * Math.PI * 2,
  };
  p.move = (dx) => {
    p.pos.x += dx;
    p.hitBox.x += dx;
  };
  return p;
}

function chooseBaseY(world) {
  const { yMargin, yJitterBetweenBursts, avoidObstacleLookahead, avoidObstacleYOffset } = CONFIG.particleStream;
  const H = CONFIG.canvas.height;
  let y = rand(yMargin, H - yMargin);

  if (Number.isFinite(world.lastParticleStreamY)) {
    for (let tries = 0; tries < 8 && Math.abs(y - world.lastParticleStreamY) < yJitterBetweenBursts; tries++) {
      y = rand(yMargin, H - yMargin);
    }
    if (Math.abs(y - world.lastParticleStreamY) < yJitterBetweenBursts) {
      const direction = y < H / 2 ? 1 : -1;
      y = clamp(world.lastParticleStreamY + direction * yJitterBetweenBursts, yMargin, H - yMargin);
    }
  }

  const incoming = world.obstacles.find((ob) => {
    const right = ob.x + (ob.w || ob.radius * 2);
    return right >= CONFIG.canvas.width && ob.x <= CONFIG.canvas.width + avoidObstacleLookahead;
  });
  if (incoming) {
    const gapY = incoming.gapY ?? incoming.centerY ?? y;
    y = clamp(gapY + rand(-avoidObstacleYOffset, avoidObstacleYOffset), yMargin, H - yMargin);
  }

  world.lastParticleStreamY = y;
  return y;
}

function getPatternOffset(pattern, index, count) {
  const t = count <= 1 ? 0 : index / (count - 1);
  const centered = t - 0.5;
  if (pattern === 'arc') return { x: index * 24, y: -Math.sin(t * Math.PI) * 32 + 12 };
  if (pattern === 'wave') return { x: index * 24, y: Math.sin(t * Math.PI * 2) * 24 };
  if (pattern === 'diagonal') return { x: index * 24, y: centered * 64 };
  return { x: index * 24, y: (Math.random() - 0.5) * 8 };
}

function spawnBurst(world) {
  const cfg = CONFIG.particleStream;
  const count = randInt(cfg.particlesPerBurstMin, cfg.particlesPerBurstMax);
  const pattern = cfg.patterns[randInt(0, cfg.patterns.length - 1)];
  const startX = CONFIG.canvas.width + 48;
  const baseY = chooseBaseY(world);
  const H = CONFIG.canvas.height;

  for (let i = 0; i < count; i++) {
    const o = getPatternOffset(pattern, i, count);
    const x = startX + o.x;
    const y = clamp(baseY + o.y, cfg.yMargin, H - cfg.yMargin);
    world.particleStream.push(createStreamParticle(x, y));
  }
}

export function createParticleStreamSystem(eventBus, world) {
  let nextBurstIn = INITIAL_BURST_DELAY;
  let phaseRules = CONFIG.phases.rules.IGNITION_PREP;

  eventBus.on(EV.PHASE_CHANGED, ({ to }) => {
    phaseRules = CONFIG.phases.rules[to] || CONFIG.phases.rules.IGNITION_PREP;
  });

  eventBus.on(EV.GAME_RESET, () => {
    nextBurstIn = INITIAL_BURST_DELAY;
    phaseRules = CONFIG.phases.rules.IGNITION_PREP;
  });

  return {
    update(dt) {
      if (world.status !== 'playing' || !CONFIG.particleStream.enabled) return;

      const rateMul = (phaseRules.particleRateMul ?? 1)
        * (world.fusionBurst.active ? CONFIG.fusion.burstParticleMultiplier : 1);
      nextBurstIn -= dt * rateMul;
      while (nextBurstIn <= 0) {
        spawnBurst(world);
        nextBurstIn += scheduleNext();
      }
    },
  };
}
