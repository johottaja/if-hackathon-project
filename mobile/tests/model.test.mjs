import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  placesFor,
  addReport,
  maintenance,
} from "../src/model.mjs";
const draft = (extra = {}) => ({
  id: "test-report",
  placeId: "stairs",
  category: "Icy stairs",
  confirmedFall: false,
  description: "Ice reported",
  source: "manual",
  photo: false,
  ...extra,
});
test("hazard-only submission does not increase confirmed falls", () => {
  const state = initialState(),
    before = placesFor(state)[0],
    after = placesFor(addReport(state, draft()))[0];
  assert.equal(after.falls, before.falls);
  assert.equal(after.hazards, before.hazards + 1);
  assert.equal(state.reports.length, 30);
});
test("explicitly confirmed fall increments once and retry is idempotent", () => {
  const state = initialState(),
    one = addReport(
      state,
      draft({ confirmedFall: true, source: "simulated trigger" }),
    ),
    two = addReport(one, draft({ confirmedFall: true }));
  assert.equal(placesFor(one)[0].falls, 5);
  assert.equal(two.reports.length, one.reports.length);
});
test("maintenance retains reports, requires notes, and new reports reopen verification", () => {
  let state = initialState();
  const original = state.reports;
  assert.throws(() => maintenance(state, "stairs", " "));
  for (const status of ["reviewed", "assigned", "completed", "verified"]) {
    state = maintenance(state, "stairs", "Synthetic work checked");
    assert.equal(placesFor(state)[0].action.status, status);
  }
  assert.deepEqual(state.reports, original);
  assert.equal(placesFor(state)[0].action.history.length, 5);
  state = addReport(state, draft());
  assert.equal(placesFor(state)[0].action.status, "reviewed");
  assert.equal(placesFor(state)[0].action.history.length, 6);
});
test("unsupported location or category cannot publish", () => {
  assert.throws(() => addReport(initialState(), draft({ placeId: "unknown" })));
  assert.throws(() =>
    addReport(initialState(), draft({ category: "unknown" })),
  );
});
