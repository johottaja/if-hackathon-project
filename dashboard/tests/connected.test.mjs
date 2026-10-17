import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,payload,report,advance,scenario} from '../server/model.mjs';
import {initialState,PLACES} from '../../mobile/src/model.mjs';
test('mobile fixture and API agree on IDs, counts and maintenance',()=>{
 const remote=payload(seed()),local=initialState();
 assert.deepEqual(remote.places.map(p=>p.id),PLACES.map(p=>p.id));
 assert.deepEqual(remote.reports,local.reports);
 assert.deepEqual(remote.places.map(p=>({...p.action,placeId:p.id})),local.actions);
});
test('phone report, dashboard maintenance and mobile verification share one record',()=>{
 const state=seed(),input={id:'PHONE-1',placeId:'stairs',category:'Slippery pavement',confirmedFall:true,source:'simulated trigger',description:'Slip on Linnankatu'};
 report(state,input);report(state,input);
 let value=payload(state);
 assert.equal(value.dashboard.reports.filter(r=>r.id==='PHONE-1').length,1);
 assert.equal(value.places[0].falls,5);
 for(const status of ['reviewed','assigned','completed','verified'])advance(state,{placeId:'P01',status,note:'Synthetic work evidence',partner:'Demo partner'});
 value=payload(state);assert.equal(value.places[0].action.status,'verified');assert.equal(value.places[0].reports.length,10);
 report(state,{...input,id:'HAZARD-1',confirmedFall:false});
 value=payload(state);assert.equal(value.places[0].action.status,'reviewed');assert.equal(value.places[0].falls,5);assert.equal(value.places[0].hazards,6);
});
test('scenario is shared and reset fixture is clean',()=>{const s=seed();scenario(s);scenario(s);assert.equal(payload(s).reports.filter(r=>r.id==='R-DEMO-001').length,1);assert.equal(payload(seed()).reports.length,30);});
