const P = 'mlidar:';

export function load(key, def) {
  try {
    const v = localStorage.getItem(P + key);
    return v == null ? def : JSON.parse(v);
  } catch { return def; }
}

export function save(key, val) {
  try { localStorage.setItem(P + key, JSON.stringify(val)); } catch { /* private mode etc. */ }
}

export const DEFAULT_SETTINGS = { hs: 5.0, bgm: 0.8, se: 0.6, laneW: 110, judgePos: 0.84, fx: 1 };

export function getSettings() { return { ...DEFAULT_SETTINGS, ...load('settings', {}) }; }
export function setSettings(s) { save('settings', s); }

export function clientId() {
  let id = load('client', null);
  if (!id) { id = crypto.randomUUID(); save('client', id); }
  return id;
}

export function getBest(songId, diff) { return load('best', {})[songId + '/' + diff] || null; }

// 結果を記録。新記録なら true
export function recordBest(songId, diff, r) {
  const all = load('best', {});
  const k = songId + '/' + diff;
  const old = all[k];
  const isNew = !old || r.score > old.score;
  all[k] = {
    score: Math.max(old?.score || 0, r.score),
    rank: isNew ? r.rank : old.rank,
    acc: isNew ? r.accuracy : old.acc,
    combo: Math.max(old?.combo || 0, r.maxCombo),
    fc: !!(old?.fc || r.fc),
    ap: !!(old?.ap || r.ap),
    plays: (old?.plays || 0) + 1,
  };
  save('best', all);
  return isNew;
}
