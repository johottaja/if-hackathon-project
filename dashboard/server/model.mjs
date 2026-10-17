import {places as dashboardPlaces,createInitialState,summary as count,advance as updateAction,addScenario} from '../src/model.mjs';
export const windowLabel='11–17 October 2026';
const ids=['stairs','square','crossing','path','steps','walkway'];
export const places=dashboardPlaces.map((p,i)=>({...p,id:ids[i]}));
export const seed=createInitialState;
export function summary(state){return places.map((p,i)=>{const id=dashboardPlaces[i].id;const s=count(state,id);const action=state.actions[id];return {...p,falls:s.falls,hazards:s.hazards,reports:s.reports.map(toReport),action:{...action,note:action.history.at(-1)?.note||'',history:action.history.map(h=>({...h,at:h.time}))}};});}
function toReport(r){return {id:r.id,placeId:ids[dashboardPlaces.findIndex(p=>p.id===r.placeId)],category:r.category,confirmedFall:r.fall,description:r.description,photo:!!r.photo,source:r.source,at:r.date};}
export function payload(state){return {places:summary(state),windowLabel,reports:state.reports.map(toReport),dashboard:state};}
export function report(state,input){
 const index=ids.indexOf(input.placeId);
 if(index<0||!['Icy stairs','Slippery path','Slippery pavement','Uneven surface','Pothole','Other obstacle'].includes(input.category)||typeof input.confirmedFall!=='boolean'||!['manual','simulated trigger'].includes(input.source)||typeof input.id!=='string'||!input.id||input.id.length>100)throw Error('Invalid report');
 if(state.reports.some(r=>r.id===input.id))return;
 const placeId=dashboardPlaces[index].id;
 state.reports.push({id:input.id,placeId,category:input.category,fall:input.confirmedFall,source:input.source,description:String(input.description||'').slice(0,600),photo:!!input.photo,date:'2026-10-17T16:00:00+03:00'});
 const a=state.actions[placeId];if(['completed','verified'].includes(a.status)){a.status='reviewed';a.history.push({status:'reviewed',note:'New report after maintenance; review reopened.',time:'17 Oct, 16:00'});}
}
export function advance(state,input){const placeId=ids.includes(input.placeId)?dashboardPlaces[ids.indexOf(input.placeId)].id:input.placeId;if(!state.actions[placeId])throw Error('Unknown place');const next={new:'reviewed',reviewed:'assigned',assigned:'completed',completed:'verified'}[state.actions[placeId].status];if(input.status!==next)throw Error('Invalid status transition');const updated=updateAction(state,placeId,String(input.note||''),String(input.partner||'Nordic Care · fictional partner'));Object.assign(state,updated);}
export function scenario(state){Object.assign(state,addScenario(state));}
