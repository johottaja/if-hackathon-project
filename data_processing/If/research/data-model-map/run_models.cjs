'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const M=require('./models.js');
const args=process.argv.slice(2), options={input:path.join(__dirname,'examples'),output:path.join(__dirname,'generated'),asOf:'2026-01-10T08:00:00Z',cell:null};
const names={'--input':'input','--output':'output','--as-of':'asOf','--cell':'cell'};
for(let i=0;i<args.length;i+=2){
  if(!names[args[i]]||!args[i+1])throw Error('Sallitut valinnat: --input, --output, --as-of, --cell ja niille arvo.');
  options[names[args[i]]]=args[i+1];
}
const data={}, hashes={};
for(const key of ['passages','events','responses','maintenance','coverage','weather']){
  const file=path.join(options.input,key+'.jsonl'), raw=fs.readFileSync(file,'utf8');
  hashes[key]=crypto.createHash('sha256').update(raw).digest('hex');
  data[key]=raw.trim()?raw.trim().split(/\r?\n/).map(JSON.parse):[];
}
const cells=JSON.parse(fs.readFileSync(path.join(options.input,'cells.geojson'),'utf8')).features.map(f=>f.properties.cell_id);
if(options.cell&&!cells.includes(options.cell))throw Error('Tuntematon cell_id: '+options.cell);
const modelOptions={threshold:.7,windowMinutes:120,priorMean:.05,priorStrength:20};
const runId='run-'+crypto.createHash('sha256').update(JSON.stringify({hashes,asOf:options.asOf,modelOptions,model_version:'1.0'})).digest('hex').slice(0,12);
const features=[],predictions=[];
for(const cell of options.cell?[options.cell]:cells){
  const r=M.run(data,cell,options.asOf,modelOptions);
  features.push(r.features);
  for(const modelId of ['m0','m1','m2','m3']){
    const p=r[modelId];
    predictions.push({run_id:runId,model_id:modelId,model_version:'1.0',cell_id:cell,evaluation_at:options.asOf,target:modelId==='m3'?'maintenance_action':modelId==='m0'?'weather_signal':'anomalous_passage_share',unit:modelId==='m3'?'category':modelId==='m0'?'index_0_100':'fraction',estimate:p?.estimate??null,lower95:p?.lower95??null,upper95:p?.upper95??null,sample_n:p?.sample_n??null,positive_y:p?.positive_y??null,prior_only:p?.prior_only??null,decision:p?.decision??null,priority:p?.priority??null,reasons:p?.reasons??(p?.reason?[p.reason]:[]),parameters:modelOptions,is_simulated:r.features.is_simulated});
  }
}
fs.mkdirSync(options.output,{recursive:true});
for(const [name,rows] of [['features',features],['predictions',predictions]]){
  fs.writeFileSync(path.join(options.output,name+'.jsonl'),rows.map(row=>JSON.stringify(row)).join('\n')+'\n');
}
fs.writeFileSync(path.join(options.output,'run-metadata.json'),JSON.stringify({run_id:runId,as_of:options.asOf,model_version:'1.0',parameters:modelOptions,input_sha256:hashes},null,2)+'\n');
console.log(runId+': '+features.length+' piirreriviä, '+predictions.length+' malliriviä → '+options.output);
