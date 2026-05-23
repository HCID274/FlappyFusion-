const API_BASE = './api/leaderboard';

export async function fetchTopScores({ search = '', limit = 10 } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (search.trim()) params.set('search', search.trim());
  const data = await fetchJson(`${API_BASE}?${params}`);
  return Array.isArray(data.scores) ? data.scores : [];
}

export async function fetchRecentNames({ search = '', limit = 5 } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (search.trim()) params.set('search', search.trim());
  const data = await fetchJson(`${API_BASE}/names?${params}`);
  return Array.isArray(data.names) ? data.names : [];
}

export async function createRun() {
  const data = await fetchJson(`${API_BASE}/run`, { method: 'POST' });
  return data.runToken || null;
}

export async function submitScore(entry) {
  const data = await fetchJson(API_BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(entry),
  });
  return data.score;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch (_err) {
    // Fall through to the generic error below.
  }

  if (!response.ok) {
    const error = new Error(data?.error || 'request_failed');
    error.status = response.status;
    throw error;
  }
  return data || {};
}
