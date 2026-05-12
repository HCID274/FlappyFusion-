// Fixed-timestep loop with catch-up cap to avoid spiral of death.

const FIXED_DT = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;

export function createGameLoop({ update, render }) {
  let last = 0;
  let acc = 0;
  let running = false;
  let rafId = null;

  function tick(now) {
    if (!running) return;
    const elapsed = (now - last) / 1000;
    last = now;
    acc += elapsed;

    let steps = 0;
    while (acc >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      update(FIXED_DT);
      acc -= FIXED_DT;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) acc = 0;

    render();
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },
  };
}
