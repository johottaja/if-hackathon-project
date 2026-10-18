import {useEffect, useMemo, useState} from 'react';
import {ArrowRight, CheckCheck} from 'lucide-react';
import {alertReach, operatorTasks, riskMaps} from './insights.mjs';
import {MapCanvas, drawCells, drawHeat, drawPings, drawZone, formatTime, formatWhen, heatCanvas, weatherLabel, type DrawFn} from './map';
import type {SimData} from './types';

// If operations, styled after the Pito operator dashboard (src/App.tsx): one map, one selected block.
type Task = {id: string; t: number; zone: number; street: string; until: number; passers: number; ratio: number; signals: number};
const euro = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});
const PARTNER = 'Nordic Care · fictional partner';

function drawOps(d: SimData, o: {exposure: boolean; awaiting: Task[]; approved: (task: Task) => boolean}): DrawFn {
  return (ctx, t, now, fired, k) => {
    if (o.exposure) {
      const h = Math.min(d.meta.hours - 1, Math.floor(t)), max = Math.max(...d.cells.perHour) * 0.9;
      drawCells(ctx, d, i => { const v = d.cells.perHour[i] * d.rhythm[h] / max; return v < 0.02 ? null : `rgba(30, 90, 180, ${(0.15 + 0.6 * Math.min(1, v)).toFixed(2)})`; });
    } else {
      const h = Math.min(d.meta.hours - 1, Math.floor(t));
      drawHeat(ctx, heatCanvas(d, `${d.meta.seed}-est-${h}`, () => riskMaps(d, t).est));
    }
    const g = d.grit.targeted;
    g.t.forEach((start, i) => {
      if (start <= t && t < start + d.meta.gritHours && o.approved({id: `${start}-${g.zone[i]}`} as Task)) drawZone(ctx, d, g.zone[i], {fill: 'rgba(74, 139, 121, .16)', stroke: '#4a8b79', width: 3});
    });
    const pulse = 0.5 + 0.5 * Math.sin(now / 260);
    for (const task of o.awaiting) drawZone(ctx, d, task.zone, {fill: `rgba(168, 60, 22, ${0.06 + 0.08 * pulse})`, stroke: '#a83c16', width: 3, dash: [12, 8]});
    drawPings(ctx, d, t, now, fired, k);
  };
}

export default function OperatorView({d, t, playing, onPause}: {d: SimData; t: number; playing: boolean; onPause: () => void}) {
  const tasks = useMemo(() => operatorTasks(d) as Task[], [d]);
  const alerts = useMemo(() => alertReach(d) as {t: number; passes: number}[], [d]);
  const [auto, setAuto] = useState(true), [autoUntil, setAutoUntil] = useState(Infinity), [sent, setSent] = useState<Set<string>>(new Set());
  const [exposure, setExposure] = useState(false), [selectedId, setSelectedId] = useState<string | null>(null);
  const [claimShare, setClaimShare] = useState(20), [claimCost, setClaimCost] = useState(6000);

  // With auto-dispatch off, a recommendation is executed only once the operator sends it; tasks
  // recommended before switching auto-dispatch off count as sent.
  const approved = (task: Task) => auto || task.t < autoUntil || sent.has(task.id);
  const current = tasks.filter(x => x.t <= t && t < x.until);
  const awaiting = current.filter(x => !approved(x));
  useEffect(() => { if (playing && awaiting.length) onPause(); }, [playing, awaiting.length, onPause]);
  const selected = current.find(x => x.id === selectedId) ?? awaiting[0] ?? current[0] ?? null;

  const h = Math.min(d.meta.hours - 1, Math.floor(t)), thaw = d.weather.factor[h] >= 1.8;
  const hour = Math.max(0, Math.floor(t) - 1);
  const avoided = t < 1 ? 0 : d.expected[d.meta.baseline][hour] - d.expected[d.meta.targeted][hour];
  const signals = d.detections.t.filter(x => x <= t).length;
  const reached = alerts.filter(a => a.t <= t);
  const recent = tasks.filter(x => x.t <= t).slice(-8).reverse();
  const pos = (zone: number) => {
    const i = d.zones.id.indexOf(zone), A = d.meta.areaSize, Z = d.meta.zoneSize;
    return {left: `${(d.zones.x[i] + Z / 2) / A * 100}%`, top: `${(A - d.zones.y[i] - Z / 2) / A * 100}%`};
  };
  const status = (task: Task) => (!approved(task) ? 'new' : t < task.until ? 'assigned' : 'completed');
  const statusLabel = {new: 'New', assigned: 'Assigned', completed: 'Completed'};

  return <div className="dash">
    <div className="dash-layout">
      <section className="dash-map-panel" aria-label="Estimated risk and gritting tasks">
        <MapCanvas d={d} draw={drawOps(d, {exposure, awaiting, approved})} label="If operations map: estimated slip risk, phone signals and gritting">
          {current.map(task => <button key={task.id} className={`dash-marker ${selected?.id === task.id ? 'selected' : ''} ${status(task) === 'assigned' ? 'done' : ''}`} style={pos(task.zone)}
            onClick={() => setSelectedId(task.id)} aria-pressed={selected?.id === task.id}
            aria-label={`Block ${task.zone}, ${task.street}: ${task.signals} phone signals${status(task) === 'new' ? ', action needed' : ''}`}>
            {task.signals}{status(task) === 'new' && <span className="dash-alert" aria-hidden="true">!</span>}
          </button>)}
          <div className="dash-map-label"><span className="dash-live-dot"/>Turku · Eskelinkatu area · {formatWhen(d, t)}</div>
          <div className="dash-map-legend">
            <span><i className="dash-legend-blue"/>Recommended block · phone signals</span>
            <span><i className="dash-legend-heat"/>Estimated slip risk</span>
            <span><i className="dash-legend-green"/>Gritting in effect</span>
          </div>
          <div className="dash-layers" role="group" aria-label="Map layer">
            <button className={!exposure ? 'active' : ''} aria-pressed={!exposure} onClick={() => setExposure(false)}>Risk</button>
            <button className={exposure ? 'active' : ''} aria-pressed={exposure} onClick={() => setExposure(true)}>People</button>
          </div>
        </MapCanvas>
      </section>

      <aside className="dash-focus" aria-label="Selected block">
        {selected ? <>
          <div className="dash-detail-header"><span className="dash-eyebrow">SELECTED BLOCK</span>
            <span className={`dash-badge status-${status(selected)}`}>{status(selected) === 'assigned' ? <CheckCheck size={12}/> : <span className="dash-status-dot"/>}{statusLabel[status(selected)]}</span></div>
          <h2>Block {selected.zone} · {selected.street}</h2>
          <p className="dash-muted">Recommended by Pito at {formatTime(d, selected.t)} · 50 × 50 m of pavement</p>
          <div className="dash-totals" aria-live="polite">
            <div><strong>{selected.signals}</strong><span>Phone slip signals, last 6 h</span></div>
            <div><strong>{selected.ratio.toFixed(1)}×</strong><span>Estimated risk vs. area average</span></div>
          </div>
          <div className={`dash-anomaly ${thaw ? 'thaw' : ''}`}><span className="dash-eyebrow">WEATHER · MEASURED</span>
            <p><strong>{weatherLabel(d.weather.temp[h], d.weather.factor[h])}</strong> · {d.weather.temp[h].toFixed(1)} °C</p>
            <small>Hourly observation at Turku Artukainen (FMI). Weather raises slip risk ×{d.weather.factor[h].toFixed(1)}.</small></div>
          <div className="dash-next"><span className="dash-eyebrow">NEXT STEP</span>
            <h3>{status(selected) === 'new' ? `Grit the pavement · about ${selected.passers} passers in the next 6 h` : `Gritting in effect until ${formatTime(d, selected.until)}`}</h3>
            {status(selected) === 'new'
              ? <button className="dash-button" onClick={() => setSent(new Set(sent).add(selected.id))}>Send gritting<ArrowRight size={18} aria-hidden="true"/></button>
              : <p className="dash-verified"><CheckCheck size={18} aria-hidden="true"/>Assigned to {PARTNER}</p>}
          </div>
          <p className="dash-note">If coordinates with the responsible partner and does not own the pavements. Completed maintenance does not guarantee safety. Simulated assignment · no external dispatch.</p>
        </> : <p className="dash-muted">No recommendations yet.</p>}

        <details className="dash-history" open>
          <summary>Month so far</summary>
          <div className="dash-kpis">
            <div><strong>{avoided.toFixed(1)}</strong><span>Falls avoided vs. fixed rotation (model)</span></div>
            <div><strong>{signals}</strong><span>Phone slip signals received</span></div>
            <div><strong>{reached.length}</strong><span>Street alerts sent to app users</span></div>
            <div><strong>{reached.reduce((s, a) => s + a.passes, 0).toLocaleString('en-GB')}</strong><span>Passes on alerted streets, 7–10 (est.)</span></div>
          </div>
          <div className="dash-euro">
            <span className="dash-eyebrow">ILLUSTRATIVE VALUE · ASSUMPTIONS, NOT IF DATA</span>
            <strong>{euro.format(avoided * claimShare / 100 * claimCost)}</strong>
            <p>{avoided.toFixed(1)} falls avoided × {claimShare} % become claims × {euro.format(claimCost)} average claim, in this 300 × 300 m area.</p>
            <label>Share of falls that become claims <output>{claimShare} %</output><input type="range" min={5} max={60} step={5} value={claimShare} onChange={e => setClaimShare(Number(e.target.value))}/></label>
            <label>Average claim cost <output>{euro.format(claimCost)}</output><input type="range" min={500} max={20000} step={500} value={claimCost} onChange={e => setClaimCost(Number(e.target.value))}/></label>
          </div>
        </details>
        <details className="dash-history">
          <summary>Recent gritting tasks</summary>
          {recent.map(task => <p key={task.id}><strong>Block {task.zone} · {task.street} · {statusLabel[status(task)]}</strong><br/>
            {formatTime(d, task.t)}: {task.signals} phone signal{task.signals === 1 ? '' : 's'}, about {task.passers} passers, risk {task.ratio.toFixed(1)}× average</p>)}
        </details>
      </aside>
    </div>
    <details className="dash-presenter">
      <summary>Dispatch controls</summary>
      <p>With auto-dispatch on, every Pito recommendation is sent to the partner. Turn it off to send each block yourself; the replay pauses until you do.</p>
      <label><input type="checkbox" checked={auto} onChange={e => { setAuto(e.target.checked); if (!e.target.checked) setAutoUntil(Math.ceil(t)); }}/>Auto-dispatch</label>
    </details>
  </div>;
}
