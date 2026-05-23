export const MAX_PLAYER_NAME_CHARS = 24;
export const MAX_SCORE = 10_000_000;
export const MAX_RUN_DURATION_SECONDS = 600;
export const SCORE_FIELD_LIMITS = {
  score: { min: 0, max: MAX_SCORE },
  duration: { min: 0, max: MAX_RUN_DURATION_SECONDS },
  maxTemp: { min: 0, max: 500 },
  fusionCount: { min: 0, max: 500 },
  maxCombo: { min: 0, max: 99 },
};

export function normalizePlayerName(value) {
  return String(value || '')
    .normalize('NFC')
    .replace(/[\p{C}\n\r\t]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validatePlayerName(value) {
  const name = normalizePlayerName(value);
  if (!name) return { ok: false, error: 'name_required', name };
  if ([...name].length > MAX_PLAYER_NAME_CHARS) return { ok: false, error: 'name_too_long', name };
  return { ok: true, name };
}

export function normalizeSearch(value) {
  return normalizePlayerName(value).toLocaleLowerCase();
}

export function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function normalizeScorePayload(payload) {
  const score = parseBoundedInt(payload?.score, SCORE_FIELD_LIMITS.score, 'invalid_score');
  const duration = parseBoundedInt(payload?.duration, SCORE_FIELD_LIMITS.duration, 'invalid_duration');
  const maxTemp = parseBoundedInt(payload?.maxTemp, SCORE_FIELD_LIMITS.maxTemp, 'invalid_max_temp');
  const fusionCount = parseBoundedInt(payload?.fusionCount, SCORE_FIELD_LIMITS.fusionCount, 'invalid_fusion_count');
  const maxCombo = parseBoundedInt(payload?.maxCombo, SCORE_FIELD_LIMITS.maxCombo, 'invalid_max_combo');

  return {
    score,
    duration,
    maxTemp,
    fusionCount,
    maxCombo,
    locale: payload?.locale === 'ja' ? 'ja' : 'zh',
  };
}

export function getScoreCeiling({ elapsedSeconds, duration, maxTemp, fusionCount, maxCombo }) {
  const trustedDuration = getTrustedDurationSeconds({ elapsedSeconds, duration });

  // Deliberately generous: this is a sanity gate for public submissions, not
  // a deterministic replay verifier. It blocks impossible curl scores while
  // leaving real high-scoring play room.
  return 10_000
    + trustedDuration * 65_000
    + Math.min(maxTemp || 0, getMaxTempForDuration(trustedDuration)) * 250
    + Math.min(fusionCount || 0, getMaxFusionCountForDuration(trustedDuration)) * 8_000
    + Math.min(maxCombo || 0, getMaxComboForDuration(trustedDuration)) * 4_000;
}

export function validateScoreConsistency(entry, elapsedSeconds) {
  const trustedDuration = getTrustedDurationSeconds({ elapsedSeconds, duration: entry.duration });
  const checks = [
    ['duration', entry.duration, Math.ceil(elapsedSeconds + 5)],
    ['max_temp', entry.maxTemp, getMaxTempForDuration(trustedDuration)],
    ['fusion_count', entry.fusionCount, getMaxFusionCountForDuration(trustedDuration)],
    ['max_combo', entry.maxCombo, getMaxComboForDuration(trustedDuration)],
  ];

  for (const [name, value, max] of checks) {
    if (value > max) return { ok: false, error: `invalid_${name}` };
  }

  if (entry.score > getScoreCeiling({ elapsedSeconds, ...entry })) {
    return { ok: false, error: 'score_rejected' };
  }
  return { ok: true };
}

function parseBoundedInt(value, { min, max }, error) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw validationError(error);
  if (n < min || n > max) throw validationError(error);
  return n;
}

function getTrustedDurationSeconds({ elapsedSeconds, duration }) {
  return Math.max(0, Math.min(
    MAX_RUN_DURATION_SECONDS,
    Math.ceil(elapsedSeconds || 0),
    Math.ceil((duration || 0) + 5),
  ));
}

function getMaxTempForDuration(seconds) {
  // Start temp is 10. This allows quick warm-up, NBI bonuses, and easy-mode
  // pacing without letting a zero-second run claim record temperature.
  return Math.min(SCORE_FIELD_LIMITS.maxTemp.max, 10 + seconds * 18);
}

function getMaxFusionCountForDuration(seconds) {
  return Math.min(SCORE_FIELD_LIMITS.fusionCount.max, Math.floor(seconds * 4) + 2);
}

function getMaxComboForDuration(seconds) {
  return Math.min(SCORE_FIELD_LIMITS.maxCombo.max, Math.floor(seconds * 2) + 1);
}

function validationError(message) {
  const err = new Error(message);
  err.isValidationError = true;
  return err;
}
