import { CONFIG } from '../config.js';
import { EV } from '../engine/events.js';

const STORAGE_KEY = 'seenTutorials';
const TUTORIAL_IDS = ['fusion', 'li', 'tungsten', 'nbi'];
const TYPE_TO_TUTORIAL = {
  D: 'fusion',
  T: 'fusion',
  Li6: 'li',
  tungsten: 'tungsten',
  nbi: 'nbi',
};

function readSeenTutorials() {
  if (typeof window === 'undefined') return new Set();
  try {
    const parsed = JSON.parse(window.sessionStorage?.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => TUTORIAL_IDS.includes(id)) : []);
  } catch {
    return new Set();
  }
}

function writeSeenTutorials(seen) {
  if (typeof window === 'undefined') return;
  window.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

function getTutorialId(entity) {
  return TYPE_TO_TUTORIAL[entity?.type] || null;
}

function getEntityX(entity) {
  return entity?.pos?.x ?? entity?.x ?? Infinity;
}

function getFocusTarget(entity) {
  const fallbackSize = CONFIG.tutorial.focusMinSize;
  const box = entity?.hitBox;
  const boxCenterX = box ? box.x + box.w / 2 : null;
  const boxCenterY = box ? box.y + box.h / 2 : null;
  const centerX = entity?.pos?.x ?? entity?.x ?? boxCenterX ?? 0;
  const centerY = entity?.pos?.y ?? entity?.y ?? boxCenterY ?? CONFIG.canvas.height / 2;
  const width = Math.max(box?.w || fallbackSize, entity?.radius ? entity.radius * 2 : fallbackSize);
  const height = Math.max(box?.h || fallbackSize, entity?.radius ? entity.radius * 2 : fallbackSize);

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    w: width,
    h: height,
  };
}

function syncWorldTutorialSeen(world, seen) {
  world.tutorialSeen = Object.fromEntries(TUTORIAL_IDS.map((id) => [id, seen.has(id)]));
}

export function clearSeenTutorials() {
  if (typeof window === 'undefined') return;
  window.sessionStorage?.removeItem(STORAGE_KEY);
}

export function createTutorialSystem(eventBus, world) {
  const seen = readSeenTutorials();
  const candidates = [];
  let pendingId = null;
  syncWorldTutorialSeen(world, seen);

  function refreshSeenFromStorage() {
    seen.clear();
    for (const id of readSeenTutorials()) seen.add(id);
    syncWorldTutorialSeen(world, seen);
  }

  function removeSeenCandidates() {
    for (let i = candidates.length - 1; i >= 0; i -= 1) {
      if (seen.has(candidates[i].id)) {
        candidates.splice(i, 1);
      }
    }
  }

  function pauseForTutorial(candidate) {
    const { id, entity } = candidate;
    pendingId = id;
    world.tutorialPaused = true;
    world.timeScale = 0;
    world.inputBlocked = true;
    eventBus.emit(EV.TUTORIAL_REQUESTED, { id, target: getFocusTarget(entity) });
  }

  function resumeFromTutorial(id) {
    if (!pendingId || id !== pendingId) return;
    seen.add(id);
    writeSeenTutorials(seen);
    syncWorldTutorialSeen(world, seen);
    removeSeenCandidates();
    pendingId = null;
    world.tutorialPaused = false;
    world.timeScale = 1;
    world.inputBlocked = false;
    world.status = 'playing';
  }

  eventBus.on(EV.ENTITY_SPAWNED, ({ entity } = {}) => {
    if (!world.tutorialEnabled || pendingId) return;
    const id = getTutorialId(entity);
    if (!id || seen.has(id)) return;
    candidates.push({ entity, id });
  });

  eventBus.on(EV.TUTORIAL_DISMISSED, ({ id } = {}) => {
    resumeFromTutorial(id);
  });

  eventBus.on(EV.GAME_RESET, () => {
    refreshSeenFromStorage();
    pendingId = null;
    candidates.length = 0;
    world.tutorialPaused = false;
    world.timeScale = 1;
    world.inputBlocked = false;
  });

  return {
    update(_dt) {
      if (!world.tutorialEnabled || pendingId || world.status !== 'playing') return;

      const triggerX = world.plasma.pos.x + CONFIG.canvas.width * CONFIG.tutorial.triggerScreenFraction;
      for (let i = 0; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        if (seen.has(candidate.id)) continue;
        if (getEntityX(candidate.entity) <= triggerX) {
          pauseForTutorial(candidate);
          return;
        }
      }

      for (let i = candidates.length - 1; i >= 0; i -= 1) {
        if (getEntityX(candidates[i].entity) < -80 || seen.has(candidates[i].id)) {
          candidates.splice(i, 1);
        }
      }
    },
  };
}
