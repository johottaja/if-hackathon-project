export const WINDOW = '11–17 Oct 2026';
export const STORAGE_KEY = 'pito-demo-v2';
export const places = [
  { id:'P01', name:'Linnankatu pavement', area:'City centre', category:'Slippery pavement', x:53, y:42, task:'Inspect and grit the pavement', description:'Repeated slipping reports on Linnankatu pavement. Inspect and grit the pedestrian surface.', falls:4, hazards:5, day:17, status:'new' },
  { id:'P02', name:'Market square approach', area:'Riverside', category:'Slippery pavement', x:72, y:73, task:'Grit the pedestrian crossing approach', description:'Repeated reports of a slippery surface on the square’s western approach.', falls:3, hazards:4, day:16, status:'reviewed' },
  { id:'P03', name:'Linnankatu crossing', area:'City centre', category:'Slippery pavement', x:63, y:21, task:'Inspect surface and apply grit', description:'Slippery pavement reported beside the crossing.', falls:2, hazards:3, day:15, status:'assigned' },
  { id:'P04', name:'Riverside path', area:'City centre', category:'Uneven surface', x:27, y:68, task:'Inspect uneven paving and refer repairs', description:'An uneven paving edge has been reported on the lakeside footpath.', falls:1, hazards:3, day:14, status:'new' },
  { id:'P05', name:'Riverside steps', area:'City centre', category:'Icy stairs', x:66, y:55, task:'Remove ice and grit the steps', description:'A maintenance partner has recorded gritting. Independent verification is still needed.', falls:2, hazards:1, day:13, status:'completed' },
  { id:'P06', name:'Neighbourhood walkway', area:'City centre', category:'Uneven surface', x:25, y:28, task:'Inspect and refer pavement repairs', description:'Two reports describe a raised paving stone.', falls:0, hazards:2, day:12, status:'verified' },
];
export function createInitialState() {
  return { reports:places.flatMap(p => Array.from({length:p.falls+p.hazards},(_,i)=>({id:`R-${p.id.slice(1)}${String(i+1).padStart(2,'0')}`,placeId:p.id,fall:i<p.falls,category:p.category,date:`2026-10-${String(p.day-Math.floor(i/3)).padStart(2,'0')}T${String(14-i%6).padStart(2,'0')}:00:00+03:00`,source:i===0&&p.falls?'simulated trigger, user-confirmed':'manual',description:i<p.falls?'User confirmed a fall and reported the surface condition.':'Hazard reported without a fall.'}))), actions:Object.fromEntries(places.map(p=>[p.id,{status:p.status,partner:['assigned','completed','verified'].includes(p.status)?'Nordic Care · fictional partner':'',history:[{status:p.status,note:p.status==='completed'?'Partner recorded ice removal and gritting.':p.status==='verified'?'Surface work reviewed in the synthetic scenario.':'Initial synthetic record.',time:'17 Oct, 08:30'}]}])), scenarioAdded:false };
}
export function summary(state, placeId) { const reports=state.reports.filter(r=>r.placeId===placeId); return {falls:reports.filter(r=>r.fall).length,hazards:reports.filter(r=>!r.fall).length,reports}; }
export function tier(state,id) { const s=summary(state,id);return s.falls>=2?0:s.hazards>=2?1:2; }
export function rankPlaces(state,items=places) { return [...items].sort((a,b)=>tier(state,a.id)-tier(state,b.id)||Math.max(...summary(state,b.id).reports.map(r=>Date.parse(r.date)))-Math.max(...summary(state,a.id).reports.map(r=>Date.parse(r.date)))); }
export const nextStatus={new:'reviewed',reviewed:'assigned',assigned:'completed',completed:'verified'};
export function advance(state,id,note,partner) {
 const current=state.actions[id]; const status=nextStatus[current.status];
 if(!status || !note.trim() || (status==='assigned'&&!partner)) throw new Error('A note and assignment partner are required.');
 return {...state,actions:{...state.actions,[id]:{...current,status,partner:status==='assigned'?partner:current.partner,history:[...current.history,{status,note:note.trim(),time:new Date().toLocaleString('en-GB',{timeZone:'Europe/Helsinki'})}]}}};
}
export function addScenario(state) {
 if(state.scenarioAdded)return state;
 const current=state.actions.P01;
 const reopen=['completed','verified'].includes(current.status);
 return {...state,scenarioAdded:true,reports:[...state.reports,{id:'R-DEMO-001',placeId:'P01',fall:true,category:'Slippery pavement',date:'2026-10-17T16:00:00+03:00',source:'simulated trigger, user-confirmed',description:'Staged mobile scenario: user confirmed a fall on the icy pavement. No photo attached.'}],actions:{...state.actions,P01:reopen?{...current,status:'reviewed',history:[...current.history,{status:'reviewed',note:'New confirmed-fall report after maintenance. Reopened for review.',time:'17 Oct, 16:00'}]}:current}};
}
