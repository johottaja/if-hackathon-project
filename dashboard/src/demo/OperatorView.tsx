import {useEffect, useMemo, useState} from 'react';
import {Send, TriangleAlert, Snowflake, CheckCheck, Clock3} from 'lucide-react';
import {alertReach, operatorTasks, riskMaps} from './insights.mjs';
import {C, MapCanvas, MapClock, drawCells, drawLabel, drawPings, drawZone, formatTime, riskColor, zoneRect, type DrawFn} from './map';
import type {SimData} from './types';

type Task = {id: string; t: number; zone: number; street: string; until: number; passers: number; ratio: number; signals: number};
const euro = new Intl.NumberFormat('en-GB', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});

function drawOps(d: SimData, opts: {exposure: boolean; awaiting: Task[]; approved: (task: Task) => boolean}): DrawFn {
  return (ctx, t, now, fired, k) => {
    if (opts.exposure) {
      const h = Math.min(d.meta.hours - 1, Math.floor(t)), max = Math.max(...d.cells.perHour) * 0.9;
      drawCells(ctx, d, i => { const v = d.cells.perHour[i] * d.rhythm[h] / max; return v < 0.02 ? null : `rgba(30, 90, 180, ${(0.15 + 0.6 * Math.min(1, v)).toFixed(2)})`; });
    } else {
      const {est} = riskMaps(d, t);
      drawCells(ctx, d, i => riskColor(est[i]));
    }
    const g = d.grit.targeted;
    g.t.forEach((start, i) => {
      if (start > t || t >= start + d.meta.gritHours) return;
      const task = {id: `${start}-${g.zone[i]}`} as Task;
      if (opts.approved(task)) drawZone(ctx, d, g.zone[i], {fill: 'rgba(22, 135, 90, .14)', stroke: C.green, width: 3});
    });
    const pulse = 0.5 + 0.5 * Math.sin(now / 260);
    for (const task of opts.awaiting) {
      drawZone(ctx, d, task.zone, {fill: `rgba(217, 119, 6, ${0.08 + 0.1 * pulse})`, stroke: C.amber, width: 4, dash: [12, 8]});
      const [x, y, s] = zoneRect(d, task.zone);
      drawLabel(ctx, `Block ${task.zone} · send gritting`, x + s / 2, y + 10 * k, C.amber, 0.5, k);
    }
    drawPings(ctx, d, t, now, fired, k);
  };
}

export default function OperatorView({d, t, playing, onPause}: {d: SimData; t: number; playing: boolean; onPause: () => void}) {
  const tasks = useMemo(() => operatorTasks(d) as Task[], [d]);
  const alerts = useMemo(() => alertReach(d) as {t: number; street: string; passes: number}[], [d]);
  const [auto, setAuto] = useState(true), [approvedIds, setApproved] = useState<Set<string>>(new Set());
  const [exposure, setExposure] = useState(false);
  const [claimShare, setClaimShare] = useState(20), [claimCost, setClaimCost] = useState(2000);

  // With auto-dispatch off, a task is executed only once the operator sends it; tasks from before
  // switching auto-dispatch off count as sent.
  const [autoUntil, setAutoUntil] = useState(Infinity);
  const approved = (task: Task) => auto || task.t < autoUntil || approvedIds.has(task.id);
  const current = tasks.filter(x => x.t <= t && t < x.until);
  const awaiting = current.filter(x => !approved(x));
  useEffect(() => { if (playing && awaiting.length) onPause(); }, [playing, awaiting.length, onPause]);

  const h = Math.min(d.meta.hours - 1, Math.floor(t)), thaw = d.weather.factor[h] >= 1.8;
  const hour = Math.max(0, Math.floor(t) - 1);
  const avoided = t < 1 ? 0 : d.expected[d.meta.baseline][hour] - d.expected[d.meta.targeted][hour];
  const signals = d.detections.t.filter(x => x <= t).length;
  const reached = alerts.filter(a => a.t <= t).reduce((s, a) => s + a.passes, 0);
  const recent = tasks.filter(x => x.t <= t).slice(-6).reverse();

  return <div className="live-grid">
    <section className="live-card live-map-card">
      <div className="map-tabs" role="group" aria-label="Map layer">
        <button className={!exposure ? 'active' : ''} aria-pressed={!exposure} onClick={() => setExposure(false)}>Estimated slip risk</button>
        <button className={exposure ? 'active' : ''} aria-pressed={exposure} onClick={() => setExposure(true)}>Pedestrian exposure now</button>
      </div>
      <MapCanvas d={d} draw={drawOps(d, {exposure, awaiting, approved})} label="If operations map: estimated risk, gritting tasks and phone signals">
        <MapClock d={d} t={t}/>
      </MapCanvas>
      <p className="live-caption">Blue dots: phone slip signals in the last 6 h. Green: gritting in effect. Amber: recommended block waiting for dispatch. Customer identities and movement histories are never shown.</p>
    </section>

    <aside className="live-card live-panel">
      <div className={`ops-weather ${thaw ? 'thaw' : ''}`}>
        {thaw ? <TriangleAlert size={20} aria-hidden="true"/> : <Snowflake size={20} aria-hidden="true"/>}
        <div><strong>{thaw ? 'Thaw warning: pavements refreezing' : d.weather.temp[h] < -10 ? 'Hard frost' : 'Frost and snow'}</strong>
          <span>{d.weather.temp[h].toFixed(1)} °C at Turku Artukainen · weather risk ×{d.weather.factor[h].toFixed(1)}</span></div>
      </div>

      <div className="ops-section">
        <div className="ops-head"><span className="live-eyebrow">Gritting tasks</span>
          <label className="ops-switch"><input type="checkbox" checked={auto} onChange={e => { setAuto(e.target.checked); if (!e.target.checked) setAutoUntil(Math.ceil(t)); }}/>Auto-dispatch</label></div>
        {recent.length === 0 && <p className="muted small">The first recommendations arrive at 00:00.</p>}
        <ul className="task-list">
          {recent.map(task => {
            const ok = approved(task), live = task.t <= t && t < task.until;
            return <li key={task.id} className={`task ${!ok ? 'awaiting' : live ? 'active' : 'done'}`}>
              <div className="task-top"><strong>Block {task.zone} · {task.street}</strong>
                <span className="task-status">{!ok ? <><Clock3 size={13}/>Awaiting dispatch</> : live ? <><CheckCheck size={13}/>In effect until {formatTime(d, task.until)}</> : 'Completed'}</span></div>
              <p>{task.signals} phone signal{task.signals === 1 ? '' : 's'} in last 6 h · ~{task.passers} passers expected · est. risk {task.ratio.toFixed(1)}× area average</p>
              {!ok && <button className="live-btn primary small" onClick={() => setApproved(new Set(approvedIds).add(task.id))}><Send size={15}/>Send gritting</button>}
              <small>Recommended {formatTime(d, task.t)} · Nordic Care · fictional partner</small>
            </li>;
          })}
        </ul>
      </div>

      <div className="ops-kpis">
        <div><strong>{avoided.toFixed(1)}</strong><span>Falls avoided vs. fixed rotation (model)</span></div>
        <div><strong>{signals}</strong><span>Phone slip signals received</span></div>
        <div><strong>{reached.toLocaleString('en-GB')}</strong><span>Passes on streets with a morning alert (est.)</span></div>
        <div><strong>{alerts.filter(a => a.t <= t).length}</strong><span>Street alerts sent</span></div>
      </div>

      <div className="ops-euro">
        <span className="live-eyebrow">Illustrative value · assumptions, not If data</span>
        <strong>{euro.format(avoided * claimShare / 100 * claimCost)}</strong>
        <p>{avoided.toFixed(1)} falls avoided × {claimShare} % lead to a claim × {euro.format(claimCost)} average claim, this month in this 300 × 300 m area.</p>
        <label>Share of falls that become claims <output>{claimShare} %</output><input type="range" min={5} max={60} step={5} value={claimShare} onChange={e => setClaimShare(Number(e.target.value))}/></label>
        <label>Average claim cost <output>{euro.format(claimCost)}</output><input type="range" min={500} max={10000} step={500} value={claimCost} onChange={e => setClaimCost(Number(e.target.value))}/></label>
      </div>
      <p className="muted small">If coordinates with the responsible maintenance partner; it does not own the pavements. The replay assumes the crew grits each sent block for {d.meta.gritHours} h. Falls are simulated, not claims.</p>
    </aside>
  </div>;
}
