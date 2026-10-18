import {useEffect, useRef, useState} from 'react';
import {Info} from 'lucide-react';
import {activeZones} from './timeline.mjs';
import {riskMaps} from './insights.mjs';
import {C, HeatLegend, MapCanvas, MapClock, drawHeat, drawLabel, drawPings, drawZone, ease, geo, heatCanvas, type DrawFn} from './map';
import type {SimData} from './types';

type Counters = {falls: number; captured: number; extra: number; prevented: number; netPrevented: number; baselineFalls: number; expectedPrevented: number; detections: number};
const ANIM = {fall: 1600, grit: 1200};
const fmt1 = (x: number) => x.toFixed(1);

type Layer = 'pito' | 'truth' | 'none';
const LAYERS: {id: Layer; label: string}[] = [{id: 'pito', label: 'Pito heatmap'}, {id: 'truth', label: 'Hidden truth'}, {id: 'none', label: 'Falls only'}];

// Live heatmap of slip risk (Pito's estimate or the hidden truth), with every fall, which ones
// phones captured, and the falls targeted gritting prevented on top.
function drawTruth(d: SimData, opts: {layer: Layer; baseline: boolean}): DrawFn {
  return (ctx, t, now, fired, k) => {
    const {X, Y} = geo(d);
    const age = (key: string) => { const f = fired.get(key); return f === undefined ? Infinity : now - f; };
    if (opts.layer !== 'none') {
      const which = opts.layer === 'pito' ? 'est' : 'truth', h = Math.min(d.meta.hours - 1, Math.floor(t));
      drawHeat(ctx, heatCanvas(d, `${d.meta.seed}-${which}-${h}`, () => riskMaps(d, t)[which]));
    }
    if (opts.baseline) for (const [id] of activeZones(d.grit.baseline, t, d.meta.gritHours)) drawZone(ctx, d, id, {stroke: 'rgba(23, 45, 62, .55)', width: 3, dash: [10, 8], inset: 5});
    for (const [id, start] of activeZones(d.grit.targeted, t, d.meta.gritHours)) {
      const p = age(`g${id}-${start}`) / ANIM.grit;
      drawZone(ctx, d, id, {fill: 'rgba(22, 135, 90, .16)', stroke: C.green, width: p < 1 ? 3 + 9 * (1 - ease(p)) : 3});
    }
    drawPings(ctx, d, t, now, fired, k);

    const pv = d.prevented;
    for (let i = 0; i < pv.t.length && pv.t[i] <= t; i++) {
      const x = X(pv.x[i]), y = Y(pv.y[i]), p = age(`p${i}`) / ANIM.fall;
      if (p < 1) { ctx.beginPath(); ctx.arc(x, y, (10 + 40 * ease(p)) * k, 0, 2 * Math.PI); ctx.strokeStyle = `rgba(22, 135, 90, ${1 - p})`; ctx.lineWidth = 4 * k; ctx.stroke(); }
      const r = 11 * k * (p < 1 ? 0.6 + 0.4 * ease(p * 2) : 1);
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = 'white'; ctx.fill(); ctx.strokeStyle = C.green; ctx.lineWidth = 3 * k; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - r * .45, y); ctx.lineTo(x - r * .1, y + r * .38); ctx.lineTo(x + r * .5, y - r * .38); ctx.stroke();
      if (p < 1) drawLabel(ctx, 'Fall prevented', x, y, C.green, p, k);
    }

    const f = d.falls;
    for (let i = 0; i < f.t.length && f.t[i] <= t; i++) {
      const x = X(f.x[i]), y = Y(f.y[i]), p = age(`f${i}`) / ANIM.fall;
      if (p < 1 && f.captured[i]) for (const lag of [0, 0.22]) {
        const q = (p - lag) / (1 - lag);
        if (q > 0) { ctx.beginPath(); ctx.arc(x, y, (12 + 48 * ease(q)) * k, 0, 2 * Math.PI); ctx.strokeStyle = `rgba(0, 84, 233, ${0.85 * (1 - q)})`; ctx.lineWidth = 5 * k; ctx.stroke(); }
      }
      const r = 10 * k * (p < 1 ? 0.4 + 0.6 * ease(p * 3) + 0.25 * Math.sin(Math.min(1, p * 3) * Math.PI) : 1);
      ctx.globalAlpha = t - f.t[i] > 72 ? 0.6 : 1;
      if (f.captured[i]) { ctx.beginPath(); ctx.arc(x, y, r + 5 * k, 0, 2 * Math.PI); ctx.strokeStyle = C.blue; ctx.lineWidth = 3 * k; ctx.stroke(); }
      if (f.extra[i]) { ctx.beginPath(); ctx.arc(x, y, r + 10 * k, 0, 2 * Math.PI); ctx.setLineDash([5 * k, 4 * k]); ctx.strokeStyle = C.amber; ctx.lineWidth = 3 * k; ctx.stroke(); ctx.setLineDash([]); }
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = C.fall; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2.5 * k; ctx.stroke();
      ctx.globalAlpha = 1;
      if (p < 1) drawLabel(ctx, f.extra[i] ? 'Fall · rotation would have gritted here' : f.captured[i] ? 'Fall captured by Pito' : 'Fall · not detected', x, y, f.extra[i] ? C.amber : f.captured[i] ? C.blue : C.fall, p, k);
    }
  };
}

export default function SimulationView({d, t, c, playing}: {d: SimData; t: number; c: Counters; playing: boolean}) {
  const [layer, setLayer] = useState<Layer>('pito'), [baseline, setBaseline] = useState(true);
  const [pop, setPop] = useState({key: 0, delta: 0});
  const netRef = useRef(c.netPrevented);
  useEffect(() => {
    const delta = c.netPrevented - netRef.current;
    netRef.current = c.netPrevented;
    if (delta !== 0 && playing) setPop(p => ({key: p.key + 1, delta}));
  }, [c.netPrevented, playing]);
  const mc = d.monteCarlo;

  return <div className="live-grid">
    <section className="live-card live-map-card">
      <div className="map-tabs" role="group" aria-label="Map layer">
        {LAYERS.map(l => <button key={l.id} className={layer === l.id ? 'active' : ''} aria-pressed={layer === l.id} onClick={() => setLayer(l.id)}>{l.label}</button>)}
      </div>
      <MapCanvas d={d} draw={drawTruth(d, {layer, baseline})} label="Live heatmap of slip risk with falls and gritting around Eskelinkatu, Turku">
        <MapClock d={d} t={t}/>
        <div className="live-map-counter" aria-hidden="true"><strong className={c.netPrevented < 0 ? 'negative' : ''}>{c.netPrevented}</strong><span>falls prevented</span></div>
      </MapCanvas>
    </section>
    <aside className="live-card live-panel">
      <div className="live-counter" aria-live="polite">
        <span className="live-eyebrow">Falls prevented</span>
        <strong className={c.netPrevented < 0 ? 'negative' : ''}>{c.netPrevented}</strong>
        {pop.key > 0 && <span key={pop.key} className={`live-pop ${pop.delta > 0 ? 'up' : 'down'}`}>{pop.delta > 0 ? `+${pop.delta}` : pop.delta}</span>}
        <p>Pito-targeted gritting vs. the same crew on a fixed rotation, in the same simulated month.</p>
      </div>
      <div className="live-stats">
        <div><strong>{c.falls}</strong><span>Falls with Pito</span></div>
        <div><strong>{c.baselineFalls}</strong><span>Falls with fixed rotation</span></div>
        <div><strong>{c.captured}<small>/{c.falls}</small></strong><span>Falls captured by Pito sensors</span></div>
        <div><strong>{c.detections}</strong><span>Slips detected by phones</span></div>
      </div>
      <p className="live-expected">Model expectation so far: {fmt1(c.expectedPrevented)} falls prevented. The count above is this one random month.</p>
      {layer !== 'none' && <HeatLegend label={layer === 'pito' ? 'Pito’s estimated slip risk (phones + weather)' : 'Hidden true slip risk (Pito never sees this)'}/>}
      <ul className="live-legend">
        <li><i className="lg-fall"/>Fall</li>
        <li><i className="lg-captured"/>Fall captured by a Pito user’s phone</li>
        <li><i className="lg-prevented"/>Fall that targeted gritting prevented</li>
        <li><i className="lg-extra"/>Fall the fixed rotation would have prevented</li>
        <li><i className="lg-detection"/>Slip detected by phone vibration</li>
        <li><i className="lg-grit"/>Gritted now with Pito</li>
        <li><i className="lg-rotation"/>Fixed-rotation crew now</li>
      </ul>
      <div className="live-toggles">
        <label><input type="checkbox" checked={baseline} onChange={e => setBaseline(e.target.checked)}/>Show fixed-rotation crew</label>
      </div>
      <details className="live-about"><summary><Info size={15} aria-hidden="true"/>How the simulation works</summary>
        <p>Every 10 m pavement square has a hidden slipperiness that changes daily. Pedestrians walk the four marked routes; their phones detect slips by vibration ({d.meta.params.tunnistus_p * 100} %) with occasional false alarms. Each slip becomes a fall with probability {d.meta.params.kaatuminen_liukastumisesta_p * 100} %.</p>
        <p>Every {d.meta.params.huoltovali_h} h the crew grits {d.meta.params.huoltokohteita} blocks of {d.meta.zoneSize} × {d.meta.zoneSize} m, cutting slip risk by {d.meta.params.huollon_teho * 100} % for {d.meta.gritHours} h. Pito sends it where a Beta-binomial estimate from the phone detections expects the most slips; the fixed rotation goes block by block. Neither sees the hidden slipperiness.</p>
        {mc && <p>Across {mc.seeds} simulated Januaries, targeted gritting averaged {fmt1(mc.preventedVsRotation.mean)} fewer falls per month than the fixed rotation (95 % CI {fmt1(mc.preventedVsRotation.lower)}–{fmt1(mc.preventedVsRotation.upper)}). Of that, {fmt1(mc.preventedVsBusiest.mean)} comes from the phone data itself; the rest from gritting busy routes first.</p>}
        <p>The model, its assumptions and the proofs that targeting by phone detections beats every rule without them are in the <a href="demo/paper_en.pdf" target="_blank" rel="noopener">paper (English, PDF)</a>; a Finnish version is <a href="demo/paperi_fi.pdf" target="_blank" rel="noopener">here</a>.</p>
        <p>All pedestrians, slips, falls, detections and gritting are simulated (seed {d.meta.seed}). Weather: {d.meta.weatherSource}. Routes and walking volumes are drawn by hand. These are not insurance claims or measured injuries, and gritting does not guarantee safety.</p>
      </details>
    </aside>
  </div>;
}
