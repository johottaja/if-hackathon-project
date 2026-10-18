/* Pure browser/Node models. All example runs use explicitly synthetic inputs. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TurkuModels = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function timestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)) throw Error('UTC-aikaleima vaaditaan: ' + value);
    const t = Date.parse(value);
    if (!Number.isFinite(t) || new Date(t).toISOString().slice(0,19) !== value.slice(0,19)) throw Error('Virheellinen päiväys: ' + value);
    return t;
  }
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  function unique(rows, key) {
    const found = new Map();
    for (const row of rows) {
      if (!row[key]) throw Error('Tunniste puuttuu: ' + key);
      if (found.has(row[key]) && canonical(found.get(row[key])) !== canonical(row)) throw Error('Ristiriitainen kaksoistunniste: ' + row[key]);
      found.set(row[key], row);
    }
    return Array.from(found.values());
  }
  function logGamma(z) {
    const c = [676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
    z -= 1;
    let x = 0.99999999999980993;
    c.forEach((a,i) => { x += a/(z+i+1); });
    const t = z + c.length - 0.5;
    return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
  }
  function betaFraction(a,b,x) {
    const tiny=1e-300, qab=a+b, qap=a+1, qam=a-1;
    let c=1, d=1-qab*x/qap;
    if (Math.abs(d)<tiny) d=tiny;
    d=1/d;
    let h=d;
    for (let m=1;m<=300;m++) {
      const m2=2*m;
      let aa=m*(b-m)*x/((qam+m2)*(a+m2));
      d=1+aa*d; if(Math.abs(d)<tiny)d=tiny;
      c=1+aa/c; if(Math.abs(c)<tiny)c=tiny;
      d=1/d; h*=d*c;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
      d=1+aa*d; if(Math.abs(d)<tiny)d=tiny;
      c=1+aa/c; if(Math.abs(c)<tiny)c=tiny;
      d=1/d;
      const delta=d*c; h*=delta;
      if(Math.abs(delta-1)<3e-13)return h;
    }
    throw Error('Beta-kertymän laskenta ei suppene.');
  }
  function betaCDF(x,a,b) {
    if(x<=0)return 0;
    if(x>=1)return 1;
    const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));
    const value=x<(a+1)/(a+b+2) ? bt*betaFraction(a,b,x)/a : 1-bt*betaFraction(b,a,1-x)/b;
    return Math.max(0,Math.min(1,value));
  }
  function betaQuantile(p,a,b) {
    if (!(a>0 && b>0 && p>=0 && p<=1)) throw Error('Virheelliset beta-parametrit.');
    if(p===0)return 0; if(p===1)return 1;
    let lo=0,hi=1;
    for(let i=0;i<85;i++) {
      const mid=(lo+hi)/2;
      if(betaCDF(mid,a,b)<p)lo=mid; else hi=mid;
    }
    return (lo+hi)/2;
  }
  function counts(y,n) {
    if(!Number.isInteger(y)||!Number.isInteger(n)||n<0||y<0||y>n)throw Error('Vaaditaan kokonaisluvut 0 ≤ y ≤ n.');
  }
  function rawRate(y,n) {
    counts(y,n);
    return {estimate:n===0?null:y/n, sample_n:n, positive_y:y, target:'anomalous_passage_share', unit:'fraction'};
  }
  function betaBinomial(y,n,priorMean=0.05,priorStrength=20) {
    counts(y,n);
    if(!Number.isFinite(priorMean)||priorMean<=0||priorMean>=1||!Number.isFinite(priorStrength)||priorStrength<=0)throw Error('Priorin keskiarvon oltava välillä (0,1) ja vahvuuden positiivinen.');
    const alpha=priorMean*priorStrength+y, beta=(1-priorMean)*priorStrength+n-y;
    return {estimate:alpha/(alpha+beta),lower95:betaQuantile(.025,alpha,beta),upper95:betaQuantile(.975,alpha,beta),alpha,beta,sample_n:n,positive_y:y,prior_only:n===0,target:'anomalous_passage_share',unit:'fraction'};
  }
  function weatherRule(weather) {
    if(!weather || !['air_temp_c','rain_24h_mm','min_temp_24h_c','max_temp_24h_c'].every(k=>Number.isFinite(weather[k])))return {estimate:null,target:'weather_signal',unit:'index_0_100',reasons:['Säätausta puuttuu tai on vajaa.']};
    const wetFreeze=weather.air_temp_c<=0 && weather.rain_24h_mm>=.1;
    const crossing=weather.min_temp_24h_c<0 && weather.max_temp_24h_c>0;
    const warning=weather.warning_active===true;
    const reasons=[];
    if(wetFreeze)reasons.push('Ilma pakkasella ja 24 h sadekertymä ≥ 0,1 mm (+50).');
    if(crossing)reasons.push('24 h minimi alle ja maksimi yli nollan (+25).');
    if(warning)reasons.push('Alueellinen jalankulkuvaroitus (+25).');
    if(weather.warning_active===null)reasons.push('Aluevaroituksesta ei tietoa; lisäpisteitä ei lasketa.');
    if(!reasons.length)reasons.push('Yksikään valittu sääehto ei täyty; tämä ei osoita tienpintaa pitäväksi.');
    return {estimate:50*Number(wetFreeze)+25*Number(crossing)+25*Number(warning),target:'weather_signal',unit:'index_0_100',reasons};
  }
  function buildFeatures(data,cellId,asOf,threshold=.7,windowMinutes=120) {
    if(!Number.isFinite(threshold)||threshold<0||threshold>1)throw Error('Anturirajan oltava välillä [0,1].');
    if(!Number.isFinite(windowMinutes)||windowMinutes<=0)throw Error('Tarkasteluikkunan oltava positiivinen.');
    const now=timestamp(asOf), start=now-windowMinutes*60000;
    const inWindow=v=>timestamp(v)>=start && timestamp(v)<now;
    const available=row=>typeof row.ingested_at==='string' && timestamp(row.ingested_at)<=now;
    const passages=unique(data.passages,'passage_id').filter(p=>p.cell_id===cellId && p.complete===true && available(p) && inWindow(p.exited_at));
    const ids=new Set(passages.map(p=>p.passage_id));
    const lookup=new Map(passages.map(p=>[p.passage_id,p]));
    const events=unique(data.events,'event_id').filter(e=>{
      if(!ids.has(e.passage_id)||!available(e)||!inWindow(e.event_at))return false;
      const p=lookup.get(e.passage_id);
      return timestamp(e.event_at)>=timestamp(p.entered_at) && timestamp(e.event_at)<=timestamp(p.exited_at);
    });
    const candidates=events.filter(e=>Number.isFinite(e.sensor_score)&&e.sensor_score>=threshold);
    const candidatePassages=new Set(candidates.map(e=>e.passage_id));
    const eventLookup=new Map(events.map(e=>[e.event_id,e]));
    const latest=new Map();
    unique(data.responses,'response_id').filter(available).filter(r=>timestamp(r.answered_at)<=now && eventLookup.has(r.event_id)).sort((a,b)=>timestamp(a.answered_at)-timestamp(b.answered_at)||timestamp(a.ingested_at)-timestamp(b.ingested_at)||a.response_id.localeCompare(b.response_id)).forEach(r=>latest.set(r.event_id,r));
    const positives=Array.from(latest.values()).filter(r=>r.answer==='slip');
    const rejected=Array.from(latest.values()).filter(r=>r.answer==='no_event');
    const maintenance=unique(data.maintenance,'action_id').filter(a=>a.cell_id===cellId && a.action==='gritting' && a.target_verified && a.coverage_fraction>=.8 && available(a) && timestamp(a.completed_at)<=now).sort((a,b)=>timestamp(b.completed_at)-timestamp(a.completed_at));
    const grit=maintenance[0] || null;
    const postGrit=grit ? positives.filter(r=>timestamp(eventLookup.get(r.event_id).event_at)>timestamp(grit.completed_at)) : [];
    const weather=data.weather.filter(w=>w.cell_id===cellId && timestamp(w.evaluation_at)<=now && timestamp(w.ingested_at)<=now).sort((a,b)=>timestamp(b.evaluation_at)-timestamp(a.evaluation_at))[0] || null;
    const coverage=data.coverage.find(c=>c.cell_id===cellId)?.app_collection_status || 'unknown';
    const n=coverage==='complete'?passages.length:null;
    const contributors=[...passages,...events,...Array.from(latest.values()),...maintenance,...data.coverage.filter(c=>c.cell_id===cellId),...(weather?[weather]:[])];
    return {cell_id:cellId,evaluation_at:asOf,window_start:new Date(start).toISOString().replace('.000Z','Z'),window_end:asOf,window_minutes:windowMinutes,sensor_threshold:threshold,app_observed_passages:n,anomalous_passages:n===null?null:candidatePassages.size,candidate_event_count:n===null?null:candidates.length,confirmed_slip_passages:new Set(positives.map(r=>eventLookup.get(r.event_id).passage_id)).size,rejected_event_count:rejected.length,post_grit_confirmed_slip_passages:new Set(postGrit.map(r=>eventLookup.get(r.event_id).passage_id)).size,last_known_gritting_at:grit?grit.completed_at:null,weather,coverage_status:coverage,is_simulated:contributors.some(r=>r.is_simulated===true)};
  }
  function triage(features,weather,bayes) {
    if(features.post_grit_confirmed_slip_passages>=2)return {decision:'recheck',priority:3,reason:'Vähintään kaksi eri ohikulkuun liittyvää liukastumisvahvistusta tunnetun hiekoituksen jälkeen.'};
    if(features.confirmed_slip_passages>=2)return {decision:'inspect',priority:2,reason:'Vähintään kaksi eri ohikulkuun liittyvää liukastumisvahvistusta.'};
    if(bayes && !bayes.prior_only && features.app_observed_passages>=20 && bayes.lower95>=.05)return {decision:'inspect',priority:2,reason:'n ≥ 20 ja ehdokasosuutta kuvaavan posteriorin 95 % välin alaraja ≥ 5 %.'};
    if(weather.estimate!==null && weather.estimate>=50)return {decision:'weather_watch',priority:1,reason:'Sääsäännön signaali vähintään 50/100.'};
    if(features.app_observed_passages===null||features.app_observed_passages===0)return {decision:'collect',priority:1,reason:'Paikalliset ohikulkuhavainnot puuttuvat. Ei turvallisuusluokitusta.'};
    return {decision:'observe',priority:0,reason:'Valitut toimintaehdot eivät täyty. Jatka seurantaa.'};
  }
  function run(data,cellId,asOf,options={}) {
    const f=buildFeatures(data,cellId,asOf,options.threshold??.7,options.windowMinutes??120);
    const m0=weatherRule(f.weather);
    const m1=f.app_observed_passages===null?{estimate:null,sample_n:null,positive_y:null,target:'anomalous_passage_share',unit:'fraction'}:rawRate(f.anomalous_passages,f.app_observed_passages);
    const m2=f.app_observed_passages===null?null:betaBinomial(f.anomalous_passages,f.app_observed_passages,options.priorMean??.05,options.priorStrength??20);
    return {features:f,m0,m1,m2,m3:triage(f,m0,m2)};
  }
  return {timestamp,unique,betaCDF,betaQuantile,rawRate,betaBinomial,weatherRule,buildFeatures,triage,run};
});
