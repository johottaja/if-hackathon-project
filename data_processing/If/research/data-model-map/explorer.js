(function(){
  'use strict';
  const C=JSON.parse(document.getElementById('catalog-data').textContent);
  const M=window.TurkuModels;
  const byId=Object.fromEntries(C.datasets.map(d=>[d.id,d]));
  const modelById=Object.fromEntries(C.models.map(m=>[m.id,m]));
  const $=id=>document.getElementById(id);
  const state={view:'flow',node:'features',dataset:'events',model:'m2',cell:C.default_cell,asOf:C.times[1],threshold:.7,priorMean:.05,priorStrength:20,windowMinutes:120};
  let currentResult=null;
  function el(tag,cls,text){
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function button(text,fn,cls='button'){
    const b=el('button',cls,text); b.type='button'; b.addEventListener('click',fn); return b;
  }
  function para(text,cls){return el('p',cls,text);}
  function code(text){return el('code',null,text);}
  function download(name,text,type='application/json'){
    const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'}));
    const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function json(value){return JSON.stringify(value,null,2);}
  function showView(view){
    if(!['flow','formats','lab','next'].includes(view))view='flow';
    state.view=view;
    for(const id of ['flow','formats','lab','next'])$(id+'-view').hidden=id!==view;
    document.querySelectorAll('[data-view]').forEach(b=>b.toggleAttribute('aria-current',b.dataset.view===view));
    document.querySelector('[data-view="'+view+'"]').setAttribute('aria-current','page');
    if(location.hash!=='#'+view)history.replaceState(null,'','#'+view);
    if(view==='flow')requestAnimationFrame(drawConnections);
    if(view==='formats')renderFormat();
    if(view==='lab')updateLab();
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
  function selectDataset(id){state.dataset=id;showView('formats');}
  function selectModel(id){state.model=id;showView('lab');}
  const lanes=[
    {title:'01 / Lähteet ja geometria',ids:['observations','sensor','cells','counters','claims']},
    {title:'02 / Projektin sopimukset',ids:['passages','events','responses','maintenance','weather','coverage','features']},
    {title:'03 / Laskenta ja tulokset',ids:['m0','m1','m2','m3','predictions','later']}
  ];
  const edges=[
    ['observations','weather',true],['sensor','events',true],['cells','passages',false],
    ['passages','events',false],['events','responses',false],['passages','features',false],
    ['events','features',false],['responses','features',false],['maintenance','features',false],
    ['weather','features',false],['coverage','features',false],['features','m0',false],
    ['features','m1',false],['features','m2',false],['features','m3',false],
    ['m0','m3',false],['m2','m3',false],['m0','predictions',false],['m1','predictions',false],
    ['m2','predictions',false],['m3','predictions',false],['counters','later',true],
    ['claims','later',true],['predictions','later',true]
  ];
  function nodeStatus(id){
    if(id==='observations')return {cls:'real',text:'Oikea XML-näyte'};
    if(['claims','counters','later'].includes(id))return {cls:'pending',text:id==='later'?'Jatkoidea':'Saatavuus / poiminta avoin'};
    if(modelById[id])return {cls:'demo',text:id==='m3'?'Toimintasääntö':'Suoritettava vertailutaso'};
    return {cls:'demo',text:'Oma sopimus / demo'};
  }
  function renderFlow(){
    $('flow-lanes').replaceChildren();
    lanes.forEach(lane=>{
      const col=el('div','lane');col.append(el('div','lane-title',lane.title));
      lane.ids.forEach(id=>{
        const item=byId[id]||modelById[id], status=nodeStatus(id);
        const b=button('',()=>selectNode(id),'node');
        b.dataset.node=id;b.setAttribute('aria-pressed',String(id===state.node));
        b.append(el('span','node-code',modelById[id]?'MODEL / '+id.toUpperCase():id==='later'?'JATKOSSA':'DATA / '+id.toUpperCase()));
        b.append(el('strong',null,id==='later'?'Hyötyarvio ja opittava malli':item.title));
        const small=el('small');small.append(el('span','dot '+status.cls),document.createTextNode(status.text));b.append(small);col.append(b);
      });
      $('flow-lanes').append(col);
    });
    selectNode(state.node);
  }
  function selectNode(id){
    state.node=id;
    const connected=new Set([id]);
    edges.forEach(([a,b])=>{if(a===id)connected.add(b);if(b===id)connected.add(a);});
    document.querySelectorAll('[data-node]').forEach(node=>{
      node.setAttribute('aria-pressed',String(node.dataset.node===id));
      node.classList.toggle('dim',!connected.has(node.dataset.node));
    });
    const box=$('node-detail');box.replaceChildren();
    const s=nodeStatus(id),tag=el('div','tag');tag.append(el('span','dot '+s.cls),document.createTextNode(s.text));box.append(tag);
    const data=byId[id],model=modelById[id];
    box.append(el('h3',null,data?data.title:model?model.title:'Seuraava analyysikerros'));
    if(data){
      box.append(para(data.notes));
      const dl=el('dl');
      [['Tiedosto',data.filename],['Rakeisuus',data.grain],['Pääavain',data.primary_key],['Lähteen formaatti',data.raw_format],['Liitokset',data.joins]].forEach(([k,v])=>{dl.append(el('dt',null,k),el('dd',null,v));});
      box.append(dl,button('Avaa kentät ja esimerkkirivit',()=>selectDataset(id),'button primary'));
    }else if(model){
      box.append(para(model.meaning),el('div','formula',model.formula),para(model.notes,'quiet'),button('Kokeile mallia',()=>selectModel(id),'button primary'));
    }else{
      box.append(para('Kävijälaskurit ja Ifin vahinkohistoria voivat tukea myöhempää kattavuus- ja hyötyarviota. Niitä ei käytetä nyt ajettavissa M0–M3-laskennoissa.'),para('Vahinkojen syyt, sijaintitarkkuus, vakuutettujen altistus ja kustannusten käsite pitää sopia ennen tulkintaa. Anturipoikkeamien prioria ei voi johtaa suoraan vakuutusvahinkojen yleisyydestä.'),button('Katso jatkoideat',()=>showView('next')));
    }
    const linked=edges.filter(([a,b])=>a===id||b===id);
    if(linked.length){
      box.append(el('h3',null,'Tietoyhteydet'));
      const list=el('ul');
      linked.forEach(([a,b,planned])=>{
        const other=a===id?b:a,label=(a===id?'→ ':'← ')+(byId[other]?.title||modelById[other]?.title||'Hyötyarvio')+(planned?' · suunniteltu':'');
        const li=el('li');li.append(button(label,()=>selectNode(other),'button'));list.append(li);
      });box.append(list);
    }
    requestAnimationFrame(drawConnections);
  }
  function drawConnections(){
    if(state.view!=='flow')return;
    const map=$('flow-map'),svg=$('flow-lines'),bounds=map.getBoundingClientRect();
    if(!bounds.width)return;
    svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);
    edges.forEach(([a,b,planned])=>{
      const from=document.querySelector('[data-node="'+a+'"]').getBoundingClientRect();
      const to=document.querySelector('[data-node="'+b+'"]').getBoundingClientRect();
      const same=Math.abs(from.left-to.left)<5;
      const x1=from.right-bounds.left,y1=from.top+from.height/2-bounds.top;
      const x2=same?to.right-bounds.left:to.left-bounds.left,y2=to.top+to.height/2-bounds.top;
      const bend=same?Math.max(x1,x2)+15:x1+(x2-x1)/2;
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M '+x1+' '+y1+' C '+bend+' '+y1+', '+bend+' '+y2+', '+x2+' '+y2);
      if(planned)path.setAttribute('stroke-dasharray','4 5');
      if(a===state.node||b===state.node)path.classList.add('connected');
      svg.append(path);
    });
  }
  new ResizeObserver(()=>requestAnimationFrame(drawConnections)).observe($('flow-map'));
  function renderFormat(){
    const selected=byId[state.dataset],picker=$('format-picker');picker.replaceChildren();
    C.datasets.forEach(d=>{const b=button(d.title,()=>{state.dataset=d.id;renderFormat();});b.setAttribute('aria-pressed',String(d.id===state.dataset));picker.append(b);});
    const host=$('format-content');host.replaceChildren();
    const header=el('div','format-header'),left=el('div');left.append(el('span','status',selected.status),el('h3',null,selected.filename));
    header.append(left,button('Lataa esimerkkitiedosto',()=>download(selected.filename,selected.download,selected.filename.endsWith('.csv')?'text/csv':selected.filename.endsWith('.geojson')?'application/geo+json':'application/x-ndjson')));
    host.append(header,para(selected.source));
    const meta=el('div','format-meta');
    [['Yksi rivi / kohde',selected.grain],['Pääavain',selected.primary_key],['Liitokset',selected.joins],['Alkuperäinen lähdeformaatti',selected.raw_format]].forEach(([name,text])=>{const part=el('div');part.append(el('span',null,name),code(text));meta.append(part);});
    host.append(meta,el('div','notice',selected.notes));
    const wrap=el('div','table-wrap'),table=el('table'),head=el('thead'),tr=el('tr');
    ['Kenttä','JSON-tyyppi','Null?','Yksikkö','Täsmällinen merkitys / ehto'].forEach(t=>tr.append(el('th',null,t)));head.append(tr);table.append(head);
    const tbody=el('tbody');
    selected.fields.forEach(f=>{
      const row=el('tr'),key=el('td');key.append(code(f.name));row.append(key,el('td',null,f.type),el('td',null,f.nullable?'kyllä':'ei'),el('td',null,f.unit));
      let rules='';
      if(f.schema.enum)rules+=' Sallitut arvot: '+JSON.stringify(f.schema.enum)+'.';
      if(f.schema.const!==undefined)rules+=' Vakio: '+JSON.stringify(f.schema.const)+'.';
      if(f.schema.minimum!==undefined)rules+=' Minimi '+f.schema.minimum+'.';
      if(f.schema.maximum!==undefined)rules+=' Maksimi '+f.schema.maximum+'.';
      row.append(el('td',null,f.description+rules));tbody.append(row);
    });
    table.append(tbody);wrap.append(table);host.append(wrap);
    host.append(el('div','protocol'));
    host.lastChild.append(para('Yhteinen sopimus: UTF-8, rivinvaihto LF, desimaalipiste, JSONL: yksi JSON-olio rivillä ja null puuttuvalle arvolle. Tunnisteet ovat merkkijonoja. Normalisoidut aikaleimat ovat UTC-aikaa ja päättyvät Z:aan, tarkkuus enintään millisekunti. JSON ei sisällä NaN- tai Infinity-arvoja. Jokainen ilmoitettu kenttä on pakollinen; nullable sallii arvon null. Vieras kenttä hylätään skeemassa.'));
    if(selected.filename.endsWith('.csv'))host.lastChild.append(para('CSV-esimerkki: pilkkuerotin, otsikkorivi, ei BOM:ia. Puuttuva arvo on tyhjä kenttä. Pilkun, lainausmerkin tai rivinvaihdon sisältävä teksti lainataan, ja lainausmerkki kahdennetaan. CSV:n JSON Schema kuvaa yhtä tyypitetyksi muunnettua riviä.'));
    const sampleHead=el('div','code-head');sampleHead.append(el('h3',null,'Projektin muoto · esimerkkirivit'));host.append(sampleHead,el('pre',null,selected.example));
    if(selected.raw_example){
      const details=el('details');details.append(el('summary',null,'Oikea FMI:n XML-vastaus · '+C.fmi_metadata.bytes+' tavua'));
      const actions=el('div','buttons');actions.append(button('Lataa alkuperäinen XML',()=>download('fmi-source.xml',selected.raw_example,'application/xml')));
      details.append(actions,para('Ilmatieteen laitoksen avoin data, säähavainnot · CC BY 4.0. SHA-256: '+C.fmi_metadata.sha256,'quiet'),el('pre',null,selected.raw_example));
      const a=el('a',null,'Tämän näytteen tarkka WFS-kysely');a.href=C.fmi_metadata.source_url;a.target='_blank';a.rel='noopener';details.append(a);host.append(details);
    }
    const schema=el('details');schema.append(el('summary',null,'JSON Schema 2020-12 · ladattava kenttäsopimus'),button('Lataa .schema.json',()=>download(selected.id+'.schema.json',json(selected.schema)+'\n')),el('pre',null,json(selected.schema)));host.append(schema);
  }
  function options(){
    return {threshold:Number($('lab-threshold').value),priorMean:Number($('lab-prior-mean').value)/100,priorStrength:Number($('lab-prior-strength').value),windowMinutes:120};
  }
  function percent(value){return value===null||value===undefined?'—':new Intl.NumberFormat('fi-FI',{minimumFractionDigits:1,maximumFractionDigits:2}).format(value*100)+' %';}
  const labels={recheck:'Tarkista uudelleen',inspect:'Tarkista kohde',weather_watch:'Seuraa säätä',collect:'Hanki havaintoja',observe:'Jatka seurantaa'};
  function outputRow(id,result){
    const value=result[id],opt=options();
    let hash=2166136261;
    const input=JSON.stringify({version:C.version,asOf:state.asOf,options:opt});
    for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return {run_id:'browser-demo-'+(hash>>>0).toString(16),model_id:id,model_version:'1.0',cell_id:state.cell,evaluation_at:state.asOf,target:id==='m3'?'maintenance_action':id==='m0'?'weather_signal':'anomalous_passage_share',unit:id==='m3'?'category':id==='m0'?'index_0_100':'fraction',estimate:value?.estimate??null,lower95:value?.lower95??null,upper95:value?.upper95??null,sample_n:value?.sample_n??null,positive_y:value?.positive_y??null,prior_only:value?.prior_only??null,decision:value?.decision??null,priority:value?.priority??null,reasons:value?.reasons??(value?.reason?[value.reason]:[]),parameters:opt,is_simulated:result.features.is_simulated};
  }
  function updateLab(){
    state.cell=$('lab-cell').value;state.asOf=$('lab-time').value;
    const error=$('lab-error');
    try{
      const opt=options();currentResult=M.run(C.data,state.cell,state.asOf,opt);error.hidden=true;
      const f=currentResult.features,ctx=$('lab-context');ctx.replaceChildren();
      ctx.append(el('strong',null,state.cell+' · '+state.asOf),document.createTextNode(' · Ikkuna ['+f.window_start+', '+f.window_end+') · n='+String(f.app_observed_passages)+' · y='+String(f.anomalous_passages)+' · anturitapahtumia '+String(f.candidate_event_count)+' · liukastumisvahvistuksia '+f.confirmed_slip_passages));
      const results=$('model-results');results.replaceChildren();
      C.models.forEach(model=>{
        const r=currentResult[model.id],card=el('div','result');
        const val=model.id==='m0'?(r.estimate===null?'—':r.estimate+' / 100'):model.id==='m3'?labels[r.decision]:percent(r?.estimate);
        card.append(el('div','model-name',model.title),el('div','result-value',val));
        let note=model.id==='m0'?'Käsin valittu sääsignaali':model.id==='m1'?'y / n · samasta sovellusotoksesta':model.id==='m3'?'Säännön tärkeys '+r.priority+' / 3':r?(r.prior_only?'Vain priori · ei paikallista otosta':'95 % väli '+percent(r.lower95)+' – '+percent(r.upper95)):'Paikallisen keruun tila puuttuu';
        card.append(el('div','result-unit',note),button('Kaava ja merkitys',()=>{state.model=model.id;renderModel();},'button'));results.append(card);
      });
      $('lab-features').textContent=json(f);
      renderModel();renderBatch(opt);
    }catch(e){error.hidden=false;error.textContent=e.message;currentResult=null;$('model-results').replaceChildren();$('lab-output').textContent='Syöte ei kelpaa. Korjaa asetukset.';$('lab-features').textContent='';$('batch-results').replaceChildren();}
  }
  function renderModel(){
    const model=modelById[state.model],picker=$('model-picker');picker.replaceChildren();
    C.models.forEach(m=>{const b=button(m.id.toUpperCase(),()=>{state.model=m.id;renderModel();});b.setAttribute('aria-pressed',String(m.id===state.model));picker.append(b);});
    const box=$('model-explanation');box.replaceChildren();
    box.append(el('h3',null,model.title),el('div','formula',model.formula));
    const body=el('div','model-body');body.append(para(model.meaning),para(model.notes,'fine'),para(model.training+' · tuloksen yksikkö: '+model.unit,'fine'));
    const buttons=el('div','buttons');
    model.inputs.filter(id=>byId[id]).forEach(id=>buttons.append(button(byId[id].filename,()=>selectDataset(id))));
    body.append(buttons);box.append(body);
    if(currentResult)$('lab-output').textContent=json(outputRow(state.model,currentResult));
  }
  function renderBatch(opt){
    const table=$('batch-results');table.replaceChildren();const thead=el('thead'),row=el('tr');
    ['Ruutu','n','y','M0 · pisteet','M1 · osuus','M2 · osuus','M3 · toiminta'].forEach(t=>row.append(el('th',null,t)));thead.append(row);table.append(thead);
    const tbody=el('tbody');
    C.data.coverage.forEach(c=>{
      const r=M.run(C.data,c.cell_id,state.asOf,opt),tr=el('tr'),cell=el('td');cell.append(button(c.cell_id,()=>{$('lab-cell').value=c.cell_id;updateLab();},'batch-cell'));
      tr.append(cell,...[r.features.app_observed_passages??'null',r.features.anomalous_passages??'null',r.m0.estimate??'null',percent(r.m1.estimate),percent(r.m2?.estimate),labels[r.m3.decision]].map(v=>el('td',null,String(v))));tbody.append(tr);
    });table.append(tbody);
  }
  C.data.coverage.forEach(c=>{const o=el('option',null,c.cell_id);o.value=c.cell_id;$('lab-cell').append(o);});
  C.times.forEach(t=>{const o=el('option',null,t.slice(11,16)+' UTC / '+new Intl.DateTimeFormat('fi-FI',{timeZone:'Europe/Helsinki',hour:'2-digit',minute:'2-digit'}).format(new Date(t))+' Helsinki');o.value=t;$('lab-time').append(o);});
  $('lab-cell').value=state.cell;$('lab-time').value=state.asOf;
  ['lab-cell','lab-time','lab-threshold','lab-prior-mean','lab-prior-strength'].forEach(id=>$(id).addEventListener('input',updateLab));
  $('download-result').addEventListener('click',()=>{if(currentResult)download(state.model+'-'+state.cell+'.json',json(outputRow(state.model,currentResult))+'\n');});
  function renderNext(){
    const host=$('next-content');
    host.append(el('h2',null,'Pienin hyödyllinen toteutus'),para('Suorita M0–M3 samalla aineistolla. Lisää monimutkaisuutta vasta, kun tiedät mitä vertailutasoa parannat.'));
    const steps=el('div','step-list');
    [
      ['01 · Sovi formaatit','Lukitse havaintoyksikkö ja aikaleimat','Aloita passages-, events-, responses- ja maintenance-tiedostoista. Varmista viitteet, UTC, puuttuvat arvot ja sama altistusjoukko. Skeemat ja esimerkkitiedostot voi ladata Formaatit-näkymästä.'],
      ['02 · Aja vertailutasot','Päivitä yksi ruutu kerrallaan','M0 on sääheuristiikka. M1 näyttää raakaosuuden. M2 tasoittaa pientä otosta. M3 tuottaa tarkistusluokan. Kaikki neljä toimivat nyt tässä tiedostossa ja samassa Node-ajossa.'],
      ['03 · Testaa lisätiedon arvo','Pidä työmäärä vertailussa samana','Vertaa säätaustaa, paikallishavaintoja ja vahvistuksia. Mittaa löytämisviivettä ja turhia tarkistuspyyntöjä samalla tehtäväbudjetilla. Demon simulaatio ei todista vahinkojen vähenemistä Turussa.']
    ].forEach(([n,t,p])=>{const card=el('div','step');card.append(el('div','step-no',n),el('h3',null,t),para(p));steps.append(card);});host.append(steps);
    const cmd=el('pre',null,'python build.py\nnode test_models.cjs\npython verify.py\nnode run_models.cjs --as-of 2026-01-10T09:00:00Z --cell B2');
    host.append(el('h3',null,'Ajot tämän tiedoston hakemistossa'),cmd,para('HTML toimii suoraan selaimessa. Uudelleenrakentaminen tarvitsee Python 3:n ja Node.js:n; ei ulkoisia kirjastoja. Rakentaminen uusii vain tämän työkalun generoidut esimerkit, skeemat, catalog.json:n ja index.html:n. Säilytä oma aineisto erillisessä kansiossa.','quiet'));
    host.append(el('h2',null,'Jatkoideat, joilla on selkeä datavaatimus'));
    const grid=el('div','idea-grid');
    [
      ['Binomiaalinen logistinen regressio','yᵢ ~ Binomial(nᵢ,pᵢ), logit(pᵢ)=β₀+β₁Tᵢ+β₂Rᵢ+β₃jäätyminenᵢ. Ensimmäinen opetettava malli säätilan ja havainto-osuuden yhteydelle.','Tarvitsee monta eri kelijaksoa ja luotettavan n:n. Kohde pysyy anturipoikkeamissa, ellei erillistä liukastumisten vertailuaineistoa ole. Opetus/testi erotetaan päivien ja tarvittaessa käyttäjien tai alueiden mukaan. CPU riittää.'],
      ['Alueellinen beta-tasoitus','Arvioi priorin taso ja vahvuus erillisestä opetusjaksosta, myöhemmin alueittain tai keliluokittain.','Tarvitsee riittävän määrän eri ruutuja ja päiviä. Älä valitse prioria samasta testijaksosta. Ifin vahinkomäärä ei ole sama kohde kuin anturipoikkeamien osuus.'],
      ['Huollon jälkeen jatkuvat havainnot','Tarkistuspyyntö, jos samalla varmennetulla kulkuväylällä kertyy havaintoja toimenpiteen jälkeen. M3 näyttää yksinkertaisen version.','Tarvitsee huollon todellisen ajankohdan, geometrian ja keruun kattavuuden. Vähenevä tapahtumamäärä voi johtua myös vähenevästä kävelystä.'],
      ['Kysy vain kun vastaus voisi muuttaa toimintaa','Vertaa kyselymäärää, vastausastetta ja sitä, kuinka usein vastaus muuttaa tarkistusluokkaa.','Tarvitsee vastaamattomuuden säilyttämisen puuttuvana tietona. Kysy kävelyn jälkeen. 5090 voi myöhemmin palvella anturimallikokeita; tämän datavirran laskenta ei sitä tarvitse.']
    ].forEach(([t,p,n])=>{const card=el('div','idea');card.append(el('h3',null,t),para(p),para(n,'needs'));grid.append(card);});host.append(grid);
    host.append(el('h2',null,'Julkiset lähteet ja rajat'),para('FMI:n XML-näyte on oikea. Oma JSONL on projektin normalisointiehdotus. Ifin, huoltoyhtiöiden ja valitsemanne anturidatasetin alkuperäistä formaattia ei ole saatu; niitä ei ole keksitty valmiiksi. Digitrafficin aiempi metatietokoe palautti HTTP 406 ja Turun WFS-koe HTTP 403. Ne eivät todista lähteitä yleisesti suljetuiksi.','quiet'));
    const list=el('ul','source-list');
    C.sources.forEach(s=>{const li=el('li'),a=el('a',null,s.title);a.href=s.url;a.target='_blank';a.rel='noopener';li.append(a);list.append(li);});host.append(list);
  }
  renderFlow();renderNext();renderFormat();updateLab();showView(location.hash.slice(1)||'flow');
})();
