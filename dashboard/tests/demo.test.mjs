import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {countUpTo, firedBetween, counters, activeZones} from '../src/demo/timeline.mjs';

const data = JSON.parse(readFileSync(new URL('../public/demo/simulation.json', import.meta.url)));
const sum = xs => xs.reduce((a, b) => a + b, 0);

test('binary search counts sorted times inclusively', () => {
  assert.equal(countUpTo([1, 2, 2, 5], 2), 3);
  assert.equal(countUpTo([1, 2, 2, 5], 0.5), 0);
  assert.equal(countUpTo([], 3), 0);
  assert.deepEqual(firedBetween([1, 2, 2, 5], 1, 5), [1, 2, 3]);
});

test('event times are sorted and inside the simulated month', () => {
  for (const key of ['falls', 'prevented', 'detections']) {
    const t = data[key].t;
    assert.ok(t.every((x, i) => i === 0 || t[i - 1] <= x), key);
    assert.ok(t.every(x => x >= 0 && x < data.meta.hours), key);
  }
});

test('end-of-month counters match the simulator totals for the same seed', () => {
  const c = counters(data, data.meta.hours);
  const {targeted, baseline} = data.meta;
  assert.equal(c.falls, data.realized[targeted].at(-1));
  assert.equal(c.baselineFalls, data.realized[baseline].at(-1));
  assert.equal(c.netPrevented, data.realized[baseline].at(-1) - data.realized[targeted].at(-1));
  assert.equal(c.detections, data.detections.t.length);
  assert.ok(c.captured <= c.falls);
  assert.ok(Math.abs(c.expectedPrevented - (data.expected[baseline].at(-1) - data.expected[targeted].at(-1))) < 1e-9);
});

test('gritting never overlaps in a zone and uses the same number of actions', () => {
  const {targeted, baseline} = data.grit;
  assert.equal(targeted.t.length, baseline.t.length);
  for (const g of [targeted, baseline]) {
    for (let t = 0; t < data.meta.hours; t += 1) {
      const zones = activeZones(g, t + 0.5, data.meta.gritHours).map(([z]) => z);
      assert.equal(new Set(zones).size, zones.length);
    }
  }
  assert.equal(sum(data.falls.captured) <= data.falls.t.length, true);
});

test('risk maps use the start-of-hour posterior and gritting; tasks match gritting actions', async () => {
  const I = await import('../src/demo/insights.mjs');
  const n = data.cells.id.length, h = 300, r = I.riskMaps(data, h + 0.5);
  const pi = data.meta.params.liukastuminen_p * data.weather.factor[h], e = data.meta.params.huollon_teho;
  for (let i = 0; i < n; i += 7) assert.ok(Math.abs(r.est[i] - 1000 * pi * (1 - e * r.gritted[i]) * data.posterior[h * n + i]) < 1e-9);
  assert.equal(I.operatorTasks(data).length, data.grit.targeted.t.length);
  assert.equal(I.correlation([1, 1, 1], [1, 2, 3]), null);
  assert.ok(Math.abs(I.correlation([1, 2, 3], [2, 4, 6]) - 1) < 1e-12);
});
