import {useEffect, useMemo, useRef, useState} from 'react';
import {Pause, Play, RotateCcw, Thermometer, Info} from 'lucide-react';
import {counters, activeZones, firedBetween, dayIndex} from './timeline.mjs';

type Columns = {t: number[]; x: number[]; y: number[]};
type Grit = {t: number[]; zone: number[]};
type Range = {mean: number; lower: number; upper: number};
type SimData = {
  meta: {start: string; hours: number; seed: number; areaSize: number; cellSize: number; zoneSize: number;
    gritHours: number; targeted: string; baseline: string; params: Record<string, number>;
    map: {file: string; attribution: string; retrieved: string}; weatherSource: string};
  weather: {temp: number[]; factor: number[]};
  cells: {id: number[]; x: number[]; y: number[]; perHour: number[]};
  zones: {id: number[]; x: number[]; y: number[]};
  grit: {targeted: Grit; baseline: Grit};
  falls: Columns & {captured: number[]; extra: number[]};
  prevented: Columns;
  detections: Columns;
  expected: Record<string, number[]>;
  realized: Record<string, number[]>;
  slipperiness: Record<string, number[]>;
  monteCarlo: null | {seeds: number; meanFalls: Record<string, number>; preventedVsRotation: Range; preventedVsBusiest: Range};
};

const DATA_URL = 'demo/simulation.json';
const SPEEDS = [{label: 'Slow', hoursPerSecond: 3}, {label: 'Normal', hoursPerSecond: 8}, {label: 'Fast', hoursPerSecond: 24}];
const THAW_START = 14 * 24; // 15 January 00:00
const C = {blue: '#0054e9', fall: '#e5483b', green: '#16875a', amber: '#d97706', ink: '#172d3e', xray: '110, 64, 201'};
const ANIM = {fall: 1600, ping: 700, grit: 1200};

const dateFormat = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Helsinki', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
const fmt1 = (x: number) => x.toFixed(1);

function weatherLabel(temp: number, factor: number) {
  if (factor >= 1.8) return 'Thaw around 0 °C · very slippery';
  if (temp < -10) return 'Hard frost · grippy snow';
  return 'Frost and snow';
}

// Draws one frame. `fired` holds wall-clock times for events that appeared during playback.
function drawFrame(ctx: CanvasRenderingContext2D, d: SimData, t: number, now: number, fired: Map<string, number>, opts: {xray: boolean; baseline: boolean; k: number}) {
  const k = opts.k; // marker size multiplier: the canvas is drawn at 1000 px and shown smaller on phones
  const scale = 1000 / d.meta.areaSize;
  const X = (x: number) => x * scale, Y = (y: number) => (d.meta.areaSize - y) * scale;
  const age = (key: string) => { const f = fired.get(key); return f === undefined ? Infinity : now - f; };
  const ease = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
  ctx.clearRect(0, 0, 1000, 1000);

  if (opts.xray) {
    const days = Object.keys(d.slipperiness);
    const L = d.slipperiness[days[Math.min(days.length - 1, dayIndex(t))]];
    const half = d.meta.cellSize / 2;
    d.cells.id.forEach((_, i) => {
      ctx.fillStyle = `rgba(${C.xray}, ${Math.min(0.8, 0.08 + L[i] * 0.85)})`;
      ctx.fillRect(X(d.cells.x[i] - half), Y(d.cells.y[i] + half), d.meta.cellSize * scale, d.meta.cellSize * scale);
    });
  }

  const zone = (id: number) => { const i = d.zones.id.indexOf(id); return [X(d.zones.x[i]), Y(d.zones.y[i] + d.meta.zoneSize), d.meta.zoneSize * scale] as const; };
  if (opts.baseline) {
    ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(23, 45, 62, .55)';
    for (const [id] of activeZones(d.grit.baseline, t, d.meta.gritHours)) { const [x, y, s] = zone(id); ctx.strokeRect(x + 4, y + 4, s - 8, s - 8); }
    ctx.restore();
  }
  for (const [id, start] of activeZones(d.grit.targeted, t, d.meta.gritHours)) {
    const [x, y, s] = zone(id), p = age(`g${id}-${start}`) / ANIM.grit;
    ctx.fillStyle = 'rgba(22, 135, 90, .16)'; ctx.fillRect(x, y, s, s);
    ctx.lineWidth = p < 1 ? 3 + 9 * (1 - ease(p)) : 3; ctx.strokeStyle = C.green; ctx.strokeRect(x + 1.5, y + 1.5, s - 3, s - 3);
  }

  const det = d.detections;
  for (let i = det.t.length - 1; i >= 0 && det.t[i] > t - 6; i--) {
    if (det.t[i] > t) continue;
    const x = X(det.x[i]), y = Y(det.y[i]), p = age(`d${i}`) / ANIM.ping;
    if (p < 1) {
      ctx.beginPath(); ctx.arc(x, y, (5 + 16 * ease(p)) * k, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(0, 84, 233, ${0.7 * (1 - p)})`; ctx.lineWidth = 2 * k; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, 4 * k, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(0, 84, 233, ${0.55 * (1 - (t - det.t[i]) / 6)})`; ctx.fill();
  }

  const label = (text: string, x: number, y: number, color: string, p: number) => {
    ctx.save(); ctx.globalAlpha = p < 0.75 ? 1 : (1 - p) / 0.25; ctx.font = `600 ${Math.round(26 * k)}px Inter, Segoe UI, Arial, sans-serif`;
    const w = ctx.measureText(text).width, ty = Math.max(40 * k, y - (36 + 26 * ease(p)) * k);
    x = Math.min(1000 - w / 2 - 16, Math.max(w / 2 + 16, x));
    ctx.fillStyle = 'rgba(255, 255, 255, .94)'; ctx.beginPath(); ctx.roundRect(x - w / 2 - 12 * k, ty - 24 * k, w + 24 * k, 36 * k, 18 * k); ctx.fill();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, x, ty + 3 * k); ctx.restore();
  };

  const pv = d.prevented;
  for (let i = 0; i < pv.t.length && pv.t[i] <= t; i++) {
    const x = X(pv.x[i]), y = Y(pv.y[i]), p = age(`p${i}`) / ANIM.fall;
    if (p < 1) { ctx.beginPath(); ctx.arc(x, y, (10 + 40 * ease(p)) * k, 0, 2 * Math.PI); ctx.strokeStyle = `rgba(22, 135, 90, ${1 - p})`; ctx.lineWidth = 4 * k; ctx.stroke(); }
    const r = 11 * k * (p < 1 ? 0.6 + 0.4 * ease(p * 2) : 1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = 'white'; ctx.fill(); ctx.strokeStyle = C.green; ctx.lineWidth = 3 * k; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * .45, y); ctx.lineTo(x - r * .1, y + r * .38); ctx.lineTo(x + r * .5, y - r * .38); ctx.stroke();
    if (p < 1) label('Fall prevented', x, y, C.green, p);
  }

  const f = d.falls;
  for (let i = 0; i < f.t.length && f.t[i] <= t; i++) {
    const x = X(f.x[i]), y = Y(f.y[i]), p = age(`f${i}`) / ANIM.fall, old = t - f.t[i] > 72;
    if (p < 1 && f.captured[i]) for (const lag of [0, 0.22]) {
      const q = (p - lag) / (1 - lag);
      if (q > 0) { ctx.beginPath(); ctx.arc(x, y, (12 + 48 * ease(q)) * k, 0, 2 * Math.PI); ctx.strokeStyle = `rgba(0, 84, 233, ${0.85 * (1 - q)})`; ctx.lineWidth = 5 * k; ctx.stroke(); }
    }
    const r = 10 * k * (p < 1 ? 0.4 + 0.6 * ease(p * 3) + 0.25 * Math.sin(Math.min(1, p * 3) * Math.PI) : 1);
    ctx.globalAlpha = old ? 0.6 : 1;
    if (f.captured[i]) { ctx.beginPath(); ctx.arc(x, y, r + 5 * k, 0, 2 * Math.PI); ctx.strokeStyle = C.blue; ctx.lineWidth = 3 * k; ctx.stroke(); }
    if (f.extra[i]) { ctx.beginPath(); ctx.arc(x, y, r + 10 * k, 0, 2 * Math.PI); ctx.setLineDash([5 * k, 4 * k]); ctx.strokeStyle = C.amber; ctx.lineWidth = 3 * k; ctx.stroke(); ctx.setLineDash([]); }
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = C.fall; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2.5 * k; ctx.stroke();
    ctx.globalAlpha = 1;
    if (p < 1) label(f.extra[i] ? 'Fall · rotation would have gritted here' : f.captured[i] ? 'Fall captured by Pito' : 'Fall · not detected', x, y, f.extra[i] ? C.amber : f.captured[i] ? C.blue : C.fall, p);
  }
}

function Timeline({d, t, onScrub}: {d: SimData; t: number; onScrub: (t: number) => void}) {
  const H = d.meta.hours, temp = d.weather.temp;
  const yOf = (v: number) => 8 + (4 - v) * 1.9;
  const path = temp.map((v, i) => `${i ? 'L' : 'M'}${i} ${yOf(v).toFixed(1)}`).join('');
  const slippery = d.weather.factor.map((f, i) => (f >= 1.8 ? i : -1)).filter(i => i >= 0);
  return <div className="live-timeline">
    <svg viewBox={`0 0 ${H} 56`} preserveAspectRatio="none" aria-hidden="true">
      {slippery.map(i => <rect key={i} x={i} y={0} width={1} height={56} fill="#fde7c4"/>)}
      <line x1={0} x2={H} y1={yOf(0)} y2={yOf(0)} stroke="#c7cfd6" strokeDasharray="6 5" vectorEffect="non-scaling-stroke"/>
      <path d={path} fill="none" stroke="#657480" strokeWidth={1.5} vectorEffect="non-scaling-stroke"/>
      <rect x={0} y={0} width={t} height={56} fill="rgba(0, 84, 233, .07)"/>
    </svg>
    <input type="range" min={0} max={H} step={0.25} value={t} onChange={e => onScrub(Number(e.target.value))} aria-label="Simulated time in January 2026"/>
    <div className="live-ticks" aria-hidden="true">{[1, 8, 15, 22, 29].map(day => <span key={day} style={{left: `${((day - 1) * 24 / H) * 100}%`}}>{day} Jan</span>)}</div>
  </div>;
}

export default function LiveDemo() {
  const [d, setD] = useState<SimData | null>(null), [error, setError] = useState('');
  const [t, setT] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  const [xray, setXray] = useState(false), [baseline, setBaseline] = useState(true);
  const [pop, setPop] = useState({key: 0, delta: 0});
  const canvas = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0), playRef = useRef(false), speedRef = useRef(SPEEDS[1].hoursPerSecond);
  const fired = useRef(new Map<string, number>()), optsRef = useRef({xray, baseline}), netRef = useRef(0);

  useEffect(() => { fetch(DATA_URL).then(r => { if (!r.ok) throw Error(`HTTP ${r.status}`); return r.json(); }).then(setD).catch(e => setError(`Could not load the simulation (${e.message}).`)); }, []);
  useEffect(() => { playRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = SPEEDS[speed].hoursPerSecond; }, [speed]);
  useEffect(() => { optsRef.current = {xray, baseline}; }, [xray, baseline]);

  const c = useMemo(() => (d ? counters(d, t) : null), [d, t]);
  useEffect(() => {
    if (!c) return;
    const delta = c.netPrevented - netRef.current;
    netRef.current = c.netPrevented;
    if (delta !== 0 && playRef.current) setPop(p => ({key: p.key + 1, delta}));
  }, [c]);

  useEffect(() => {
    if (!d) return;
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.current!.width = canvas.current!.height = 1000 * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (playRef.current) {
        const prev = tRef.current, next = Math.min(d.meta.hours, prev + dt * speedRef.current);
        for (const [kind, cols] of [['f', d.falls], ['p', d.prevented], ['d', d.detections]] as const) for (const i of firedBetween(cols.t, prev, next)) fired.current.set(`${kind}${i}`, now);
        d.grit.targeted.t.forEach((g, i) => { if (g > prev && g <= next) fired.current.set(`g${d.grit.targeted.zone[i]}-${g}`, now); });
        tRef.current = next; setT(next);
        if (next >= d.meta.hours) { playRef.current = false; setPlaying(false); }
      }
      const k = Math.max(1, Math.min(2.2, 560 / (canvas.current?.clientWidth || 1000)));
      drawFrame(ctx, d, tRef.current, now, fired.current, {...optsRef.current, k});
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [d]);

  function scrub(next: number) { fired.current.clear(); tRef.current = next; setT(next); }
  function toggle() {
    if (!d) return;
    if (!playing && tRef.current >= d.meta.hours) scrub(0);
    setPlaying(!playing);
  }

  if (error) return <main className="live-app"><p role="alert" className="live-error">{error}</p></main>;
  if (!d || !c) return <main className="live-app"><p className="live-loading">Loading the simulated January…</p></main>;
  const hour = Math.min(d.meta.hours - 1, Math.floor(t));
  const when = new Date(Date.parse(d.meta.start) + t * 3600e3);
  const mc = d.monteCarlo;

  return <div className="live-app">
    <header className="live-header"><div className="live-brand"><span className="live-brand-word">If</span><span className="live-brand-divider"/>Pito<span className="live-title">Live simulation · January 2026</span></div>
      <span className="live-header-meta">Simulated pedestrians · real Turku weather</span></header>
    <main className="live-grid">
      <section className="live-map-card" aria-label="Simulated map of falls and gritting around Eskelinkatu, Turku">
        <div className="live-map">
          <img src={`demo/${d.meta.map.file}`} alt="" />
          <canvas ref={canvas} aria-hidden="true"/>
          <div className="live-map-counter" aria-hidden="true"><strong className={c.netPrevented < 0 ? 'negative' : ''}>{c.netPrevented}</strong><span>falls prevented</span></div>
          <div className="live-clock"><strong>{dateFormat.format(when)}</strong><span><Thermometer size={14} aria-hidden="true"/>{fmt1(d.weather.temp[hour])} °C · {weatherLabel(d.weather.temp[hour], d.weather.factor[hour])}</span></div>
        </div>
        <div className="live-controls">
          <button className="live-btn primary" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={18}/> : <Play size={18}/>}{playing ? 'Pause' : t > 0 && t < d.meta.hours ? 'Resume' : 'Play January'}</button>
          <div className="live-speed" role="group" aria-label="Playback speed">{SPEEDS.map((s, i) => <button key={s.label} className={i === speed ? 'active' : ''} aria-pressed={i === speed} onClick={() => setSpeed(i)}>{s.label}</button>)}</div>
          <button className="live-btn secondary" onClick={() => { scrub(THAW_START); setPlaying(true); }}>Jump to the thaw</button>
          <button className="live-btn icon" onClick={() => { setPlaying(false); scrub(0); }} aria-label="Restart"><RotateCcw size={17}/></button>
        </div>
        <Timeline d={d} t={t} onScrub={next => { setPlaying(false); scrub(next); }}/>
        <p className="live-caption">Shaded on the timeline: thaw around 0 °C, when pavements get most slippery. Line: measured air temperature at Turku Artukainen.</p>
      </section>

      <aside className="live-panel">
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
          <label><input type="checkbox" checked={xray} onChange={e => setXray(e.target.checked)}/>X-ray: hidden slipperiness (Pito never sees this)</label>
        </div>
        <details className="live-about"><summary><Info size={15} aria-hidden="true"/>How the simulation works</summary>
          <p>Every 10 m pavement square has a hidden slipperiness that changes daily. Pedestrians walk the four marked routes; their phones detect slips by vibration ({d.meta.params.tunnistus_p * 100} %) with occasional false alarms. Each slip becomes a fall with probability {d.meta.params.kaatuminen_liukastumisesta_p * 100} %.</p>
          <p>Every {d.meta.params.huoltovali_h} h the crew grits {d.meta.params.huoltokohteita} blocks of {d.meta.zoneSize} × {d.meta.zoneSize} m, cutting slip risk by {d.meta.params.huollon_teho * 100} % for {d.meta.gritHours} h. Pito sends it where a Beta-binomial estimate from the phone detections expects the most slips; the fixed rotation goes block by block. Neither sees the hidden slipperiness.</p>
          {mc && <p>Across {mc.seeds} simulated Januaries, targeted gritting averaged {fmt1(mc.preventedVsRotation.mean)} fewer falls per month than the fixed rotation (95 % CI {fmt1(mc.preventedVsRotation.lower)}–{fmt1(mc.preventedVsRotation.upper)}). Of that, {fmt1(mc.preventedVsBusiest.mean)} comes from the phone data itself; the rest from gritting busy routes first.</p>}
          <p>All pedestrians, slips, falls, detections and gritting are simulated (seed {d.meta.seed}). Weather: {d.meta.weatherSource}. Routes and walking volumes are drawn by hand. These are not insurance claims or measured injuries, and gritting does not guarantee safety.</p>
        </details>
        <p className="live-attribution">Map: {d.meta.map.attribution}, retrieved {d.meta.map.retrieved}.</p>
      </aside>
    </main>
  </div>;
}
