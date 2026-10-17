// Pure helpers for the live simulation demo. Time is in simulated hours from 1 Jan 2026 00:00 (Helsinki).

// Number of sorted times that are <= t.
export function countUpTo(times, t) {
  let lo = 0, hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) lo = mid + 1; else hi = mid;
  }
  return lo;
}

// Indices of events whose time is in (from, to].
export function firedBetween(times, from, to) {
  const out = [];
  for (let i = countUpTo(times, from); i < times.length && times[i] <= to; i++) out.push(i);
  return out;
}

// Counters at simulated time t. Both worlds share the same simulated month (same seed):
// baseline falls = targeted falls − falls only the targeted world has + falls targeting prevented.
export function counters(data, t) {
  const f = data.falls, n = countUpTo(f.t, t);
  let captured = 0, extra = 0;
  for (let i = 0; i < n; i++) { captured += f.captured[i]; extra += f.extra[i]; }
  const prevented = countUpTo(data.prevented.t, t);
  const hour = Math.max(0, Math.min(data.meta.hours - 1, Math.floor(t) - 1));
  const expected = name => (t < 1 ? 0 : data.expected[name][hour]);
  return {
    falls: n, captured, extra, prevented,
    netPrevented: prevented - extra,
    baselineFalls: n - extra + prevented,
    expectedPrevented: expected(data.meta.baseline) - expected(data.meta.targeted),
    detections: countUpTo(data.detections.t, t),
  };
}

// Zones whose gritting is in effect at time t, as [zone, startHour] pairs.
export function activeZones(grit, t, hours) {
  const out = [];
  for (let i = 0; i < grit.t.length; i++) {
    if (grit.t[i] <= t && t < grit.t[i] + hours) out.push([grit.zone[i], grit.t[i]]);
  }
  return out;
}

export function dayIndex(t) { return Math.floor(t / 24); }
