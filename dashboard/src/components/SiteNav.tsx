import {Map, Smartphone, LayoutDashboard} from 'lucide-react';
import './site-nav.css';
export type ViewId = 'heatmap' | 'simulation' | 'customer' | 'if';
const views = [
  {id:'heatmap', label:'Heatmap', icon:Map},
  {id:'simulation', label:'Simulation', icon:Map},
  {id:'customer', label:'Pito app', icon:Smartphone},
  {id:'if', label:'If operations', icon:LayoutDashboard},
] as const;
export default function SiteNav({active, onChoose}: {active: ViewId | 'dashboard'; onChoose?: (id:ViewId)=>void}) {
 return <header className="pito-header">
  <div className="pito-brand"><img src="brand/if-logo.png" alt="If" width="40" height="40"/><span className="pito-divider"/>Pito</div>
  <nav className="pito-tabs" aria-label="Pito views">
   {views.map(v=>onChoose?<button key={v.id} aria-pressed={active===v.id} onClick={()=>onChoose(v.id)}><v.icon size={16} aria-hidden="true"/>{v.label}</button>:<a key={v.id} href={`demo.html#${v.id}`}><v.icon size={16} aria-hidden="true"/>{v.label}</a>)}
   <a href="./?view=dashboard" aria-current={active==='dashboard'?'page':undefined}><LayoutDashboard size={16} aria-hidden="true"/>If dashboard</a>
  </nav>
 </header>;
}
