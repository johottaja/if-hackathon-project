// Pito app and If-operator views of the simulated month. Pure functions over simulation.json.
// Time t is in simulated hours from 1 Jan 2026 00:00 Helsinki; January has no DST change.
import {activeZones, countUpTo} from './timeline.mjs';

export const STREETS = {eerikinkatu: 'Eerikinkatu', eskelinkatu: 'Eskelinkatu', humalistonkatu: 'Humalistonkatu', linnankatu: 'Linnankatu'};
// Slips per 1,000 passes.
export const RISK_LEVELS = [{max: 2, label: 'Low'}, {max: 5, label: 'Elevated'}, {max: 10, label: 'High'}, {max: Infinity, label: 'Very high'}];
const WARN_RATIO = 1.5;

export const hourOf = (d, t) => Math.max(0, Math.min(d.meta.hours - 1, Math.floor(t)));
export const riskLevel = v => RISK_LEVELS.find(l => v < l.max).label;
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

export function cellOf(d) {
  const key = (x, y) => `${Math.floor(x / d.meta.cellSize)},${Math.floor(y / d.meta.cellSize)}`;
  const index = new Map(d.cells.x.map((x, i) => [key(x, d.cells.y[i]), i]));
  return (x, y) => index.get(key(x, y)) ?? -1;
}

export function grittedCells(d, grit, t) {
  const zones = new Set(activeZones(grit, t, d.meta.gritHours).map(([z]) => z));
  return d.cells.zone.map(z => (zones.has(z) ? 1 : 0));
}

// Slip risk per 1,000 passes at time t: Pito's estimate (what customers and If see) and the hidden truth.
export function riskMaps(d, t) {
  const h = hourOf(d, t), n = d.cells.id.length, e = d.meta.params.huollon_teho;
  const pi = d.meta.params.liukastuminen_p * d.weather.factor[h];
  const days = Object.keys(d.slipperiness), L = d.slipperiness[days[Math.min(days.length - 1, Math.floor(h / 24))]];
  const gritted = grittedCells(d, d.grit.targeted, t);
  const est = new Array(n), truth = new Array(n);
  for (let i = 0; i < n; i++) {
    const f = 1000 * pi * (1 - e * gritted[i]);
    est[i] = f * d.posterior[h * n + i];
    truth[i] = f * L[i];
  }
  return {est, truth, gritted};
}

export function correlation(a, b) {
  const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; }
  return saa < 1e-12 || sbb < 1e-12 ? null : sab / Math.sqrt(saa * sbb);
}

export function routeCells(d, route) {
  const r = d.routes.findIndex(x => x.name === route);
  return d.cells.route.flatMap((v, i) => (v === r ? [i] : []));
}

const mean = (xs, idx) => idx.reduce((s, i) => s + xs[i], 0) / idx.length;

// Detections with their cell and zone, in time order.
export function detectionsWithCells(d) {
  const cell = cellOf(d);
  return d.detections.t.map((t, i) => { const c = cell(d.detections.x[i], d.detections.y[i]); return {t, cell: c, zone: d.cells.zone[c]}; });
}

export function zoneStreet(d, zone) {
  const counts = {};
  d.cells.zone.forEach((z, i) => { if (z === zone) { const r = d.routes[d.cells.route[i]].name; counts[r] = (counts[r] || 0) + 1; } });
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best ? STREETS[best[0]] : '';
}

// One task per recommended block per gritting round, with the reasons If's operator sees.
export function operatorTasks(d) {
  const dets = detectionsWithCells(d), g = d.grit.targeted, H = d.meta.gritHours, n = d.cells.id.length;
  return g.t.map((t, i) => {
    const zone = g.zone[i], cells = d.cells.zone.flatMap((z, c) => (z === zone ? [c] : []));
    const window = d.rhythm.slice(t, t + H).reduce((s, r) => s + r, 0);
    const passers = Math.round(cells.reduce((s, c) => s + d.cells.perHour[c], 0) * window);
    const m = d.posterior.slice(t * n, t * n + n);
    const ratio = mean(m, cells) / (m.reduce((s, x) => s + x, 0) / n);
    return {id: `${t}-${zone}`, t, zone, street: zoneStreet(d, zone), until: t + H, passers, ratio,
      signals: dets.filter(x => x.zone === zone && x.t >= t - 6 && x.t < t).length};
  });
}

// Mornings with a warning on any street and the estimated passes that warning reached (07–10).
export function alertReach(d) {
  const routes = d.routes.map(r => ({name: r.name, cells: routeCells(d, r.name)}));
  const days = Math.floor(d.meta.hours / 24), out = [];
  const risk = routes.map(r => Array.from({length: days}, (_, day) => mean(riskMaps(d, day * 24 + 7).est, r.cells)));
  routes.forEach((r, j) => {
    const typical = median(risk[j]);
    risk[j].forEach((v, day) => {
      if (v < WARN_RATIO * typical) return;
      const h = day * 24 + 7, rhythm = d.rhythm[h] + d.rhythm[h + 1] + d.rhythm[h + 2];
      out.push({t: h, street: STREETS[r.name], passes: Math.round(r.cells.reduce((s, c) => s + d.cells.perHour[c], 0) * rhythm)});
    });
  });
  return out.sort((a, b) => a.t - b.t);
}

export function signalsBefore(d, t) { return countUpTo(d.detections.t, t); }
