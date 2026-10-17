import {createServer} from 'node:http';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {seed,payload,report,advance,scenario} from './model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));const data=resolve(root,'.data/pito-state-v2.json');
let state;try{state=JSON.parse(await readFile(data,'utf8'));}catch{state=seed();}
let queue=Promise.resolve();
const save=async()=>{await mkdir(resolve(root,'.data'),{recursive:true});await writeFile(data+'.tmp',JSON.stringify(state));await rename(data+'.tmp',data);};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 try{
 if(url.pathname.startsWith('/api/')){
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 if(req.method==='POST'){
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)throw Error('Request too large');}const input=JSON.parse(raw||'{}');
 const operation=queue.then(async()=>{const before=structuredClone(state);try{if(url.pathname==='/api/reports')report(state,input);else if(url.pathname==='/api/actions')advance(state,input);else if(url.pathname==='/api/scenario')scenario(state);else if(url.pathname==='/api/reset')state=seed();else throw Error('Unknown operation');await save();}catch(error){state=before;throw error;}});queue=operation.catch(()=>{});await operation;
 }else if(req.method!=='GET'||url.pathname!=='/api/state'){res.writeHead(404);return res.end(JSON.stringify({error:'Not found'}));}
 return res.end(JSON.stringify(payload(state)));
 }
 if(req.method!=='GET'){res.writeHead(405);return res.end();}
 const name=url.pathname==='/'?'index.html':url.pathname.slice(1);const path=resolve(root,name);if(!path.startsWith(root)||!['.html','.css','.js','.svg'].includes(extname(path)))throw Error('Not found');
 const body=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml'})[extname(path)]);res.end(body);
 }catch(error){res.writeHead(url.pathname.startsWith('/api/')?400:404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error.message}));}
});
server.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('If prevention demo: http://localhost:'+ (process.env.PORT||3000)));
