import { CONFIG } from './config.js';

function shuffle(values) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function getRunLength(values, index) {
  const type = values[index];
  let length = 0;
  for (let i = index; i >= 0 && values[i] === type; i--) length += 1;
  return length;
}

export function createBalancedDtBag({
  windowSize = CONFIG.collectible.dtBalanceWindow,
  maxStreak = CONFIG.collectible.dtMaxStreak,
  previousType = null,
  previousStreak = 0,
} = {}) {
  const dCount = Math.floor(windowSize / 2);
  const tCount = windowSize - dCount;
  const counts = { D: dCount, T: tCount };
  const bag = [];

  function fill(currentType, currentStreak) {
    if (bag.length === windowSize) return true;

    for (const type of shuffle(['D', 'T'])) {
      if (counts[type] <= 0) continue;

      const nextStreak = type === currentType ? currentStreak + 1 : 1;
      if (nextStreak > maxStreak) continue;

      counts[type] -= 1;
      bag.push(type);

      if (fill(type, nextStreak)) return true;

      bag.pop();
      counts[type] += 1;
    }

    return false;
  }

  if (!fill(previousType, previousStreak)) {
    throw new Error(`Unable to create balanced D/T bag with windowSize=${windowSize}, maxStreak=${maxStreak}`);
  }

  return bag;
}

export function createBalancedDtPicker() {
  let bag = [];
  let previousType = null;
  let previousStreak = 0;

  return {
    reset() {
      bag = [];
      previousType = null;
      previousStreak = 0;
    },
    pick() {
      if (bag.length === 0) {
        bag = createBalancedDtBag({ previousType, previousStreak });
      }

      const type = bag.shift();
      previousStreak = type === previousType ? previousStreak + 1 : 1;
      previousType = type;
      return type;
    },
  };
}

export function createFuelTypePicker() {
  const dtPicker = createBalancedDtPicker();

  return {
    reset() {
      dtPicker.reset();
    },
    pick({ collectedD = 0, collectedT = 0, allowLi6 = true } = {}) {
      const weights = CONFIG.collectible.typeWeights;
      const dtWeight = weights.D + weights.T;
      const liWeight = allowLi6 ? weights.Li6 : 0;
      const total = dtWeight + liWeight;
      const roll = Math.random() * total;
      if (roll >= dtWeight) return 'Li6';

      const catchUpThreshold = CONFIG.collectible.fuelCatchUpThreshold ?? 1;
      const fuelDelta = collectedD - collectedT;

      if (fuelDelta >= catchUpThreshold) return 'T';
      if (fuelDelta <= -catchUpThreshold) return 'D';

      return dtPicker.pick();
    },
  };
}

export function getMaxDtStreak(types) {
  if (types.length === 0) return 0;
  let max = 1;
  for (let i = 0; i < types.length; i++) {
    max = Math.max(max, getRunLength(types, i));
  }
  return max;
}
