import { formatTemperature, getLocale, t } from '../content.js';
import { EV } from '../engine/events.js';
import { createRun, fetchRecentNames, fetchTopScores, submitScore } from '../leaderboardApi.js';
import { MAX_PLAYER_NAME_CHARS, normalizePlayerName, validatePlayerName } from '../leaderboardRules.js';

export function createLeaderboardPanel(eventBus, world) {
  const el = {
    title: document.getElementById('leaderboard-title'),
    current: document.getElementById('leaderboard-current'),
    nameLabel: document.getElementById('leaderboard-name-label'),
    nameInput: document.getElementById('leaderboard-name'),
    submit: document.getElementById('leaderboard-submit'),
    skip: document.getElementById('leaderboard-skip'),
    error: document.getElementById('leaderboard-error'),
    recentLabel: document.getElementById('leaderboard-recent-label'),
    recentNames: document.getElementById('leaderboard-recent-names'),
    topLabel: document.getElementById('leaderboard-top-label'),
    search: document.getElementById('leaderboard-search'),
    list: document.getElementById('leaderboard-list'),
  };

  let pendingScore = null;
  let submitted = false;
  let requestId = 0;
  let searchTimer = null;
  let runToken = null;
  let runRequestId = 0;

  renderText();

  eventBus.on(EV.GAME_RESET, () => {
    pendingScore = null;
    submitted = false;
    startRun();
  });

  el.submit.addEventListener('click', submitCurrentScore);
  el.skip.addEventListener('click', skipCurrentScore);
  el.nameInput.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.code === 'Enter') {
      event.preventDefault();
      submitCurrentScore();
    }
  });
  el.nameInput.addEventListener('input', () => {
    el.error.textContent = '';
    scheduleRefresh();
  });
  el.search.addEventListener('keydown', (event) => event.stopPropagation());
  el.search.addEventListener('input', scheduleRefresh);

  return {
    renderText,
    showScore(score) {
      if (!pendingScore) prepare(score);
      else {
        renderText();
        refresh();
      }
    },
  };

  async function startRun() {
    const id = ++runRequestId;
    runToken = null;
    try {
      const token = await createRun();
      if (id === runRequestId) runToken = token;
    } catch (_err) {
      if (id === runRequestId) runToken = null;
    }
  }

  function renderText() {
    el.title.textContent = t('leaderboard.title');
    el.nameLabel.textContent = t('leaderboard.nameLabel');
    el.nameInput.placeholder = t('leaderboard.namePlaceholder');
    el.nameInput.maxLength = String(MAX_PLAYER_NAME_CHARS);
    el.submit.textContent = submitted ? t('leaderboard.submitted') : t('leaderboard.submit');
    el.skip.textContent = t('leaderboard.skipSave');
    el.skip.style.display = pendingScore && world.leaderboardPending ? '' : 'none';
    el.recentLabel.textContent = t('leaderboard.recentNames');
    el.topLabel.textContent = t('leaderboard.topScores');
    el.search.placeholder = t('leaderboard.searchPlaceholder');
    if (pendingScore) {
      el.current.textContent = t('leaderboard.currentScore') + ': ' + formatScore(pendingScore.score);
    }
  }

  function prepare(score) {
    pendingScore = score;
    submitted = false;
    el.nameInput.value = '';
    el.search.value = '';
    el.error.textContent = '';
    el.submit.disabled = false;
    renderText();
    refresh();
  }

  async function refresh() {
    const id = ++requestId;
    const search = el.search.value.trim();
    renderLoading();

    try {
      const [scores, names] = await Promise.all([
        fetchTopScores({ search, limit: 30 }),
        fetchRecentNames({ search: el.nameInput.value, limit: 5 }),
      ]);
      if (id !== requestId) return;
      renderRecentNames(names);
      renderRows(scores);
      el.error.textContent = '';
    } catch (_err) {
      if (id !== requestId) return;
      el.list.innerHTML = '';
      el.list.append(createEmptyRow(t('leaderboard.loadFailed')));
    }
  }

  function scheduleRefresh() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(refresh, 180);
  }

  function renderLoading() {
    el.list.innerHTML = '';
    el.list.append(createEmptyRow(t('leaderboard.loading')));
  }

  function renderRecentNames(names) {
    el.recentNames.innerHTML = '';
    if (!names.length) {
      el.recentNames.append(createEmptyRow(t('leaderboard.noRecentNames')));
      return;
    }

    for (const name of names) {
      const button = document.createElement('button');
      button.className = 'recent-name-chip';
      button.type = 'button';
      button.textContent = name;
      button.addEventListener('click', () => {
        el.nameInput.value = name;
        el.error.textContent = '';
        el.nameInput.focus();
        refresh();
      });
      el.recentNames.append(button);
    }
  }

  function renderRows(scores) {
    el.list.innerHTML = '';
    if (!scores.length) {
      el.list.append(createEmptyRow(t('leaderboard.empty')));
      return;
    }

    scores.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'leaderboard-row';

      const rank = document.createElement('div');
      rank.className = 'leaderboard-rank';
      rank.textContent = t('leaderboard.rank', { rank: idx + 1 });

      const main = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'leaderboard-name';
      name.textContent = entry.name;
      const detail = document.createElement('div');
      detail.className = 'leaderboard-detail';
      detail.textContent = t('leaderboard.detailLine', {
        seconds: entry.duration || 0,
        temperature: formatTemperature(entry.maxTemp || 0),
        fusionCount: entry.fusionCount || 0,
      });
      main.append(name, detail);

      const score = document.createElement('div');
      score.className = 'leaderboard-score';
      score.textContent = t('leaderboard.scoreLine', { score: formatScore(entry.score) });

      row.append(rank, main, score);
      el.list.append(row);
    });
  }

  function createEmptyRow(text) {
    const empty = document.createElement('div');
    empty.className = 'leaderboard-empty';
    empty.textContent = text;
    return empty;
  }

  async function submitCurrentScore() {
    if (!pendingScore || submitted) return;
    const nameResult = validatePlayerName(el.nameInput.value);
    if (!nameResult.ok) {
      el.error.textContent = t(`leaderboard.${nameResult.error === 'name_too_long' ? 'nameTooLong' : 'nameRequired'}`);
      return;
    }
    if (!runToken) {
      el.error.textContent = t('leaderboard.submitFailed');
      startRun();
      return;
    }

    el.submit.disabled = true;
    el.error.textContent = '';
    try {
      await submitScore({
        ...pendingScore,
        name: normalizePlayerName(nameResult.name),
        locale: getLocale(),
        runToken,
      });
      submitted = true;
      runToken = null;
      world.leaderboardPending = false;
      renderText();
      await refresh();
    } catch (_err) {
      el.submit.disabled = false;
      el.error.textContent = t('leaderboard.submitFailed');
    }
  }

  function skipCurrentScore() {
    world.leaderboardPending = false;
    eventBus.emit(EV.INPUT_PULSE);
  }
}

function formatScore(score) {
  return Math.floor(score || 0).toLocaleString();
}
