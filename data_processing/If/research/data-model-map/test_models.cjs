'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('./models.js');
const data={};
for(const key of ['passages','events','responses','maintenance','coverage','weather']){
  data[key]=fs.readFileSync(path.join(__dirname,'examples',key+'.jsonl'),'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
let checks=0;
function test(name,fn){fn();checks++;console.log('OK '+name);}
function close(a,b,tol=1e-10){assert.ok(Math.abs(a-b)<tol,String(a)+' != '+String(b));}
test('Beta(1,1) kvantiilit täsmäävät tasajakaumaan',()=>{
  close(M.betaQuantile(.025,1,1),.025);close(M.betaQuantile(.975,1,1),.975);
});
test('Beta(1,19) kvantiilit täsmäävät analyyttiseen käänteisfunktioon',()=>{
  for(const q of [.025,.5,.975])close(M.betaQuantile(q,1,19),1-Math.pow(1-q,1/19));
});
test('Ei havaintoja tarkoittaa prioria eikä nollariskiä',()=>{
  assert.equal(M.rawRate(0,0).estimate,null);
  const prior=M.betaBinomial(0,0);close(prior.estimate,.05);assert.equal(prior.prior_only,true);
  assert.ok(prior.upper95>prior.lower95);
});
test('Pieni otos tasoittuu ja väli kapenee havaintomäärän kasvaessa',()=>{
  const small=M.betaBinomial(1,1),large=M.betaBinomial(5000,100000);
  assert.ok(small.estimate>.05&&small.estimate<1);
  assert.ok(large.upper95-large.lower95<small.upper95-small.lower95);
  close(large.estimate,.05);
});
test('Saman ohikulun usea heilahdus ei monista binomimallin y:tä',()=>{
  const f=M.buildFeatures(data,'B2','2026-01-10T08:00:00Z');
  assert.equal(f.candidate_event_count,5);assert.equal(f.anomalous_passages,4);assert.equal(f.app_observed_passages,120);
});
test('Täsmälleen sama tapahtuma voidaan toimittaa kahdesti',()=>{
  const copy=structuredClone(data);copy.events.push(structuredClone(copy.events[0]));
  assert.deepEqual(M.buildFeatures(copy,'B2','2026-01-10T08:00:00Z'),M.buildFeatures(data,'B2','2026-01-10T08:00:00Z'));
});
test('Ristiriitainen kaksoistunniste hylätään',()=>{
  const copy=structuredClone(data);copy.events.push({...copy.events[0],sensor_score:.01});
  assert.throws(()=>M.buildFeatures(copy,'B2','2026-01-10T08:00:00Z'),/Ristiriitainen/);
});
test('Myöhäinen vastaus ei vuoda aikaisempaan tilannekuvaan',()=>{
  const late=data.responses.find(r=>r.event_id==='e-B1-07-001');
  assert.equal(late.answered_at,'2026-01-10T08:05:00Z');
  assert.equal(M.buildFeatures(data,'B1','2026-01-10T08:00:00Z').confirmed_slip_passages,1);
  assert.equal(M.buildFeatures(data,'B1','2026-01-10T09:00:00Z').confirmed_slip_passages,4);
});
test('Tulevaisuudessa kirjattu huoltotoimi ei muuta vanhaa ennustetta',()=>{
  const copy=structuredClone(data);
  copy.maintenance.push({...copy.maintenance[0],action_id:'future',completed_at:'2026-01-10T07:30:00Z',ingested_at:'2026-01-10T10:00:00Z'});
  assert.deepEqual(M.run(copy,'B2','2026-01-10T08:00:00Z'),M.run(data,'B2','2026-01-10T08:00:00Z'));
});
test('Hiekoituksen kirjaus ei poista sen jälkeisiä vahvistuksia',()=>{
  const r=M.run(data,'B2','2026-01-10T09:00:00Z');
  assert.equal(r.features.post_grit_confirmed_slip_passages,2);assert.equal(r.m3.decision,'recheck');
});
test('Tuntematon keruu ja tunnettu nolla havaintoa erotetaan',()=>{
  assert.equal(M.run(data,'D4','2026-01-10T08:00:00Z').m2,null);
  const unknown=structuredClone(data);unknown.coverage.find(c=>c.cell_id==='B2').app_collection_status='unknown';
  assert.equal(M.run(unknown,'B2','2026-01-10T08:00:00Z').m1.estimate,null);
  const zero=M.run(data,'A4','2026-01-10T08:00:00Z');assert.equal(zero.features.app_observed_passages,0);assert.equal(zero.m2.prior_only,true);
});
test('Ikkunan alku mukana, loppu poissa ja päättymättömät ohikulut poissa',()=>{
  const copy={passages:[],events:[],responses:[],maintenance:[],weather:[],coverage:[{cell_id:'X',app_collection_status:'complete',is_simulated:true}]};
  for(const [id,time,complete] of [['start','2026-01-10T06:00:00Z',true],['end','2026-01-10T08:00:00Z',true],['open','2026-01-10T07:00:00Z',false]]){
    copy.passages.push({passage_id:id,cell_id:'X',entered_at:time,exited_at:time,ingested_at:time,complete,is_simulated:true});
  }
  assert.equal(M.buildFeatures(copy,'X','2026-01-10T08:00:00Z').app_observed_passages,1);
});
test('Virheelliset y/n-arvot, prior ja päiväys hylätään',()=>{
  assert.throws(()=>M.betaBinomial(2,1));assert.throws(()=>M.betaBinomial(0,1,0,20));
  assert.throws(()=>M.timestamp('2026-02-31T00:00:00Z'));assert.throws(()=>M.timestamp('2026-01-10T08:00:00+02:00'));
});
test('M0 ei tulkitse puuttuvaa säätä nollaksi',()=>{
  assert.equal(M.weatherRule(null).estimate,null);
  assert.equal(M.weatherRule({air_temp_c:-1,rain_24h_mm:null,min_temp_24h_c:-2,max_temp_24h_c:1}).estimate,null);
});
console.log(checks+' olennaista mallien ja liitosten tarkistusta läpäisty.');
