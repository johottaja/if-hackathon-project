import {useState} from 'react';
import {riskMaps, riskLevel, routeCells, STREETS} from './insights.mjs';
import {C, MapCanvas, MapClock, drawCells, drawZone, riskColor, type DrawFn} from './map';
import {activeZones} from './timeline.mjs';
import type {SimData} from './types';

export default function HeatmapView({d, t}: {d: SimData; t: number}) {
  const [layer, setLayer] = useState<'estimate' | 'truth'>('estimate');
  const values = riskMaps(d, t)[layer === 'estimate' ? 'est' : 'truth'];
  const draw: DrawFn = (ctx, hour) => {
    const risk = riskMaps(d, hour)[layer === 'estimate' ? 'est' : 'truth'];
    drawCells(ctx, d, i => riskColor(risk[i]));
    for (const [id] of activeZones(d.grit.targeted, hour, d.meta.gritHours)) drawZone(ctx, d, id, {stroke: C.green, width: 3});
  };
  return <div className="live-grid">
    <section className="live-card live-map-card">
      <MapCanvas d={d} draw={draw} label={`${layer === 'estimate' ? 'Estimated' : 'Hidden simulated'} slip risk around Eskelinkatu, Turku`}><MapClock d={d} t={t}/></MapCanvas>
    </section>
    <aside className="live-card live-panel heatmap-panel">
      <span className="live-eyebrow">Turku · January 2026</span>
      <h1>Slipperiness heatmap</h1>
      <p>Explore the simulator’s 10 metre pavement cells. Play January or move the timeline to see changing conditions and targeted gritting.</p>
      <div className="live-toggles"><label>Heatmap layer <select value={layer} onChange={e => setLayer(e.target.value as typeof layer)}><option value="estimate">Pito’s estimated risk</option><option value="truth">Hidden simulated slipperiness</option></select></label></div>
      <p>{layer === 'estimate' ? 'An estimate from simulated phone detections and measured weather.' : 'The simulator’s hidden truth, shown for comparison. Pito does not have access to this layer.'}</p>
      <p><strong>Scale: slips per 1,000 passes</strong></p>
      <div style={{height:12,borderRadius:6,background:'linear-gradient(90deg,#f6cd46,#d6263d)'}} aria-hidden="true"/>
      <p>Low &lt;2 · Elevated 2–5 · High 5–10 · Very high ≥10. Transparent cells are below 0.4.</p>
      <p>Green outlines: simulated gritting currently in effect. Maintenance does not guarantee safety.</p>
      <h2>Street averages</h2>
      <ul>{d.routes.map(route => {
        const cells = routeCells(d, route.name);
        const average = cells.length ? cells.reduce((sum: number, i: number) => sum + values[i], 0) / cells.length : 0;
        return <li key={route.name}>{STREETS[route.name as keyof typeof STREETS]}: <strong>{average.toFixed(1)}</strong> · {riskLevel(average)}</li>;
      })}</ul>
      <p>All movement, slip events and maintenance are synthetic. These model results do not establish real-world injury reduction.</p>
    </aside>
  </div>;
}
