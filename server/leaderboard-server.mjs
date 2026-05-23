import { createServer } from 'node:http';
import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  MAX_RUN_DURATION_SECONDS,
  clampInt,
  normalizePlayerName,
  normalizeScorePayload,
  normalizeSearch,
  validateScoreConsistency,
  validatePlayerName,
} from '../src/leaderboardRules.js';

const HOST = process.env.LEADERBOARD_HOST || '127.0.0.1';
const PORT = Number(process.env.LEADERBOARD_PORT || 3001);
const DB_PATH = process.env.LEADERBOARD_DB || '/var/lib/opencampus-game/leaderboard.sqlite';
const MAX_BODY_BYTES = 16 * 1024;
const MAX_LIMIT = 100;
const RUN_TOKEN_TTL_MS = MAX_RUN_DURATION_SECONDS * 1000;
const rateBuckets = new Map();

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL,
    score INTEGER NOT NULL,
    duration INTEGER NOT NULL DEFAULT 0,
    max_temp INTEGER NOT NULL DEFAULT 0,
    fusion_count INTEGER NOT NULL DEFAULT 0,
    max_combo INTEGER NOT NULL DEFAULT 0,
    locale TEXT NOT NULL DEFAULT 'zh',
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_scores_rank ON scores(score DESC, created_at ASC);
  CREATE INDEX IF NOT EXISTS idx_scores_name_key ON scores(name_key);
  CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);
  CREATE TABLE IF NOT EXISTS leaderboard_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS score_runs (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    issued_at INTEGER NOT NULL,
    used_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_score_runs_issued_at ON score_runs(issued_at);
`);

const insertScore = db.prepare(`
  INSERT INTO scores (name, name_key, score, duration, max_temp, fusion_count, max_combo, locale, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const latestScore = db.prepare(`
  SELECT id, name, score, duration, max_temp, fusion_count, max_combo, locale, created_at
  FROM scores
  WHERE id = ?
`);
const topScores = db.prepare(`
  SELECT id, name, score, duration, max_temp, fusion_count, max_combo, locale, created_at
  FROM scores
  WHERE (? = '' OR name_key LIKE ? ESCAPE '\\')
  ORDER BY score DESC, created_at ASC
  LIMIT ?
`);
const recentNames = db.prepare(`
  SELECT s.name, s.created_at AS last_used_at
  FROM scores s
  JOIN (
    SELECT name_key, MAX(created_at) AS last_used_at
    FROM scores
    WHERE (? = '' OR name_key LIKE ? ESCAPE '\\')
    GROUP BY name_key
  ) latest ON latest.name_key = s.name_key AND latest.last_used_at = s.created_at
  GROUP BY s.name_key
  ORDER BY s.created_at DESC
  LIMIT ?
`);
const insertRun = db.prepare(`
  INSERT INTO score_runs (id, token_hash, issued_at)
  VALUES (?, ?, ?)
`);
const getRun = db.prepare(`
  SELECT id, token_hash, issued_at, used_at
  FROM score_runs
  WHERE token_hash = ?
`);
const useRun = db.prepare(`
  UPDATE score_runs
  SET used_at = ?
  WHERE token_hash = ? AND used_at IS NULL
`);
const deleteExpiredRuns = db.prepare(`
  DELETE FROM score_runs
  WHERE issued_at < ? OR (used_at IS NOT NULL AND used_at < ?)
`);
const getMeta = db.prepare(`SELECT value FROM leaderboard_meta WHERE key = ?`);
const setMeta = db.prepare(`INSERT OR REPLACE INTO leaderboard_meta (key, value) VALUES (?, ?)`);
const secret = getOrCreateSecret();

setInterval(cleanupMemoryBuckets, 60_000).unref();
setInterval(cleanupExpiredRuns, 10 * 60_000).unref();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (!url.pathname.startsWith('/api/leaderboard')) return sendJson(res, 404, { error: 'not_found' });

    if (req.method === 'POST' && url.pathname === '/api/leaderboard/run') {
      const ip = getClientIp(req);
      if (!allowRequest(`run:${ip}`)) return sendJson(res, 429, { error: 'rate_limited' });
      const token = createRunToken();
      return sendJson(res, 201, { runToken: token });
    }

    if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
      const search = normalizeSearch(url.searchParams.get('search') || '');
      const limit = clampInt(url.searchParams.get('limit'), 10, 1, MAX_LIMIT);
      return sendJson(res, 200, {
        scores: topScores.all(search, likePattern(search), limit).map(toScore),
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/leaderboard/names') {
      const search = normalizeSearch(url.searchParams.get('search') || '');
      const limit = clampInt(url.searchParams.get('limit'), 5, 1, 20);
      return sendJson(res, 200, {
        names: recentNames.all(search, likePattern(search), limit).map((row) => row.name),
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/leaderboard') {
      const ip = getClientIp(req);
      if (!allowRequest(`submit:${ip}`)) return sendJson(res, 429, { error: 'rate_limited' });

      const payload = await readJsonBody(req);
      const entry = normalizeEntry(payload);
      consumeRunToken(payload?.runToken, entry);
      const result = insertScore.run(
        entry.name,
        entry.nameKey,
        entry.score,
        entry.duration,
        entry.maxTemp,
        entry.fusionCount,
        entry.maxCombo,
        entry.locale,
        Date.now(),
      );
      return sendJson(res, 201, {
        score: toScore(latestScore.get(result.lastInsertRowid)),
      });
    }

    return sendJson(res, 405, { error: 'method_not_allowed' });
  } catch (err) {
    const status = err.statusCode || 500;
    const error = status >= 500 ? 'server_error' : err.message;
    if (status >= 500) console.error(err);
    return sendJson(res, status, { error });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`leaderboard api listening on http://${HOST}:${PORT}`);
  console.log(`sqlite database: ${DB_PATH}`);
});

function normalizeEntry(payload) {
  const nameResult = validatePlayerName(payload?.name);
  if (!nameResult.ok) throw httpError(400, nameResult.error);
  let scorePayload;
  try {
    scorePayload = normalizeScorePayload(payload);
  } catch (err) {
    if (err.isValidationError) throw httpError(400, err.message);
    throw err;
  }

  return {
    name: nameResult.name,
    nameKey: normalizeSearch(nameResult.name),
    ...scorePayload,
  };
}

function createRunToken() {
  cleanupExpiredRuns();
  const issuedAt = Date.now();
  const runId = randomBytes(16).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ runId, issuedAt })).toString('base64url');
  const signature = sign(payload);
  const token = `${payload}.${signature}`;
  insertRun.run(runId, hashToken(token), issuedAt);
  return token;
}

function consumeRunToken(token, entry) {
  const run = verifyRunToken(token);
  const now = Date.now();
  const elapsedSeconds = (now - run.issued_at) / 1000;
  if (elapsedSeconds < 0 || elapsedSeconds > MAX_RUN_DURATION_SECONDS + 10) {
    throw httpError(400, 'run_expired');
  }

  const consistency = validateScoreConsistency(entry, elapsedSeconds);
  if (!consistency.ok) throw httpError(400, consistency.error);

  const result = useRun.run(now, run.token_hash);
  if (result.changes !== 1) throw httpError(400, 'run_already_used');
}

function verifyRunToken(token) {
  if (typeof token !== 'string' || token.length > 512 || !token.includes('.')) {
    throw httpError(400, 'run_required');
  }

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) {
    throw httpError(400, 'invalid_run');
  }

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (_err) {
    throw httpError(400, 'invalid_run');
  }

  if (!decoded?.runId || !Number.isFinite(decoded?.issuedAt)) {
    throw httpError(400, 'invalid_run');
  }

  const tokenHash = hashToken(token);
  const run = getRun.get(tokenHash);
  if (!run || run.used_at !== null) throw httpError(400, 'invalid_run');
  if (run.id !== decoded.runId || Number(run.issued_at) !== Number(decoded.issuedAt)) {
    throw httpError(400, 'invalid_run');
  }
  return run;
}

function likePattern(value) {
  if (!value) return '';
  return `%${value.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}

function toScore(row) {
  return {
    id: Number(row.id),
    name: row.name,
    score: Number(row.score),
    duration: Number(row.duration),
    maxTemp: Number(row.max_temp),
    fusionCount: Number(row.fusion_count),
    maxCombo: Number(row.max_combo),
    locale: row.locale,
    createdAt: Number(row.created_at),
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        reject(httpError(413, 'body_too_large'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_err) {
        reject(httpError(400, 'invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function allowRequest(key) {
  const now = Date.now();
  const windowMs = 60_000;
  const max = 30;
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count <= max;
}

function getClientIp(req) {
  return normalizePlayerName(req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown') || 'unknown';
}

function cleanupMemoryBuckets() {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now > bucket.resetAt) rateBuckets.delete(key);
  }
}

function cleanupExpiredRuns() {
  const cutoff = Date.now() - RUN_TOKEN_TTL_MS - 60_000;
  deleteExpiredRuns.run(cutoff, cutoff);
}

function getOrCreateSecret() {
  const envSecret = process.env.LEADERBOARD_SECRET;
  if (envSecret && envSecret.length >= 32) return envSecret;
  const row = getMeta.get('secret');
  if (row?.value) return row.value;
  const value = randomBytes(32).toString('base64url');
  setMeta.run('secret', value);
  return value;
}

function sign(payload) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('base64url');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
