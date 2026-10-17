import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialState,summary,advance,addScenario,rankPlaces} from '../src/model.mjs';
test('confirmed falls and hazard-only reports stay distinct',()=>{const s=createInitialState();assert.equal(s.reports.filter(r=>r.fall).length,12);assert.equal(s.reports.filter(r=>!r.fall).length,18);assert.deepEqual([summary(s,'P01').falls,summary(s,'P01').hazards],[4,5]);});
test('maintenance completes the full lifecycle without removing evidence',()=>{let s=createInitialState();const ids=s.reports.map(r=>r.id);for(const expected of ['reviewed','assigned','completed','verified']){s=advance(s,'P01','Operator evidence recorded.','Nordic Care · fictional partner');assert.equal(s.actions.P01.status,expected);}assert.deepEqual(s.reports.map(r=>r.id),ids);assert.equal(s.actions.P01.history.length,5);assert.throws(()=>advance(s,'P01','Note','Partner'));});
test('new confirmed report reopens verified maintenance and is idempotent',()=>{let s=createInitialState();for(let i=0;i<4;i++)s=advance(s,'P01','Evidence note','Partner');s=addScenario(s);assert.equal(s.actions.P01.status,'reviewed');assert.equal(summary(s,'P01').falls,5);assert.equal(summary(s,'P01').hazards,5);assert.equal(s.actions.P01.history.length,6);assert.equal(addScenario(s).reports.length,s.reports.length);assert.equal(s.reports.at(-1).id,'R-DEMO-001');});
test('notes and assignment partner are required',()=>{const s=createInitialState();assert.throws(()=>advance(s,'P01','   ',''));assert.throws(()=>advance(s,'P02','Assign this task',''));});
test('ranking uses repeated fall tier followed by repeated hazard tier',()=>{const s=createInitialState();assert.deepEqual(rankPlaces(s).map(p=>p.id),['P01','P02','P03','P05','P04','P06']);});

test('review does not assign a maintenance partner',()=>{const s=advance(createInitialState(),'P01','Review note','Partner');assert.equal(s.actions.P01.partner,'');});
