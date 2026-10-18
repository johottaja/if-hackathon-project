import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Pause, Play, RotateCcw, Map as MapIcon, Smartphone, LayoutDashboard} from 'lucide-react';
import {counters, firedBetween} from './timeline.mjs';
import {ClockContext, formatWhen} from './map';
import SimulationView from './SimulationView';
import HeatmapView from './HeatmapView';
import SiteNav from '../components/SiteNav';
import CustomerView from './CustomerView';
import OperatorView from './OperatorView';
import type {SimData} from './types';

const DATA_URL = 'demo/simulation.json';
const SPEEDS = [{label: 'Slow', hoursPerSecond: 3}, {label: 'Normal', hoursPerSecond: 8}, {label: 'Fast', hoursPerSecond: 24}];
const THAW_START = 14 * 24; // 15 January 00:00
const VIEWS = [
  {id: 'heatmap', label: 'Heatmap', short: 'Heatmap', icon: MapIcon, intro: 'Estimated slip risk from the R simulator. Compare it with hidden simulated slipperiness and explore January with the timeline.'},
  {id: 'simulation', label: 'Simulation', short: 'Simulation', icon: MapIcon, intro: 'Everything that happens in the simulated month, on top of the risk heatmap: every fall, what phones captured, and what targeted gritting prevented.'},
  {id: 'customer', label: 'Pito app', short: 'App', icon: Smartphone, intro: 'The Pito app running on the simulated month. Its risk map comes only from phone slip detections and measured weather. Next to it is the hidden truth it is trying to estimate.'},
  {id: 'if', label: 'If operations', short: 'If', icon: LayoutDashboard, intro: 'What If sees: Pito’s gritting recommendations and their reasons. Select a block on the map. Under Dispatch controls you can turn off auto-dispatch and send blocks yourself.'},
] as const;
type ViewId = typeof VIEWS[number]['id'];
const viewFromHash = (): ViewId => (VIEWS.find(v => `#${v.id}` === window.location.hash)?.id ?? 'heatmap');
// ?t=<hours> opens the replay at a given moment, e.g. ?t=376#if for the thaw on 16 January.
const startHour = () => Math.max(0, Number(new URLSearchParams(window.location.search).get('t')) || 0);

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
  const [t, setT] = useState(startHour), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  const [view, setView] = useState<ViewId>(viewFromHash);
  const tRef = useRef(t), playRef = useRef(false), speedRef = useRef(SPEEDS[1].hoursPerSecond);
  const fired = useRef(new Map<string, number>());
  const clock = useMemo(() => ({tRef, fired}), []);

  useEffect(() => { fetch(DATA_URL).then(r => { if (!r.ok) throw Error(`HTTP ${r.status}`); return r.json(); }).then(setD).catch(e => setError(`Could not load the simulation (${e.message}).`)); }, []);
  useEffect(() => { playRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = SPEEDS[speed].hoursPerSecond; }, [speed]);
  useEffect(() => { const onHash = () => setView(viewFromHash()); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);

  // Advances simulated time and records when events appear, for the maps' animations.
  useEffect(() => {
    if (!d) return;
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
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [d]);

  const c = useMemo(() => (d ? counters(d, t) : null), [d, t]);
  const pause = useCallback(() => { playRef.current = false; setPlaying(false); }, []);
  function scrub(next: number) { fired.current.clear(); tRef.current = next; setT(next); }
  function toggle() {
    if (!d) return;
    if (!playing && tRef.current >= d.meta.hours) scrub(0);
    setPlaying(!playing);
  }
  function choose(id: ViewId) { setView(id); window.history.replaceState(null, '', `#${id}`); }

  if (error) return <main className="live-app"><p role="alert" className="live-error">{error}</p></main>;
  if (!d || !c) return <main className="live-app"><p className="live-loading">Loading the simulated January…</p></main>;
  const current = VIEWS.find(v => v.id === view)!;

  return <div className="live-app">
    <SiteNav active={view} onChoose={choose}/>
    <p className="live-intro">{current.intro}</p>

    <ClockContext.Provider value={clock}>
      <main aria-label={current.label}>
        {view === 'heatmap' && <HeatmapView d={d} t={t}/>}
        {view === 'simulation' && <SimulationView d={d} t={t} c={c} playing={playing}/>}
        {view === 'customer' && <CustomerView d={d} t={t}/>}
        {view === 'if' && <OperatorView d={d} t={t} playing={playing} onPause={pause}/>}
      </main>
    </ClockContext.Provider>

    <footer className="live-dock">
      <div className="live-controls">
        <button className="live-btn primary" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={18}/> : <Play size={18}/>}{playing ? 'Pause' : t > 0 && t < d.meta.hours ? 'Resume' : 'Play January'}</button>
        <div className="live-speed" role="group" aria-label="Playback speed">{SPEEDS.map((s, i) => <button key={s.label} className={i === speed ? 'active' : ''} aria-pressed={i === speed} onClick={() => setSpeed(i)}>{s.label}</button>)}</div>
        <button className="live-btn secondary" onClick={() => { scrub(THAW_START); setPlaying(true); }}>Jump to the thaw</button>
        <span className="dock-time">{formatWhen(d, t)}</span>
        <button className="live-btn icon" onClick={() => { setPlaying(false); scrub(0); }} aria-label="Restart"><RotateCcw size={17}/></button>
      </div>
      <Timeline d={d} t={t} onScrub={next => { setPlaying(false); scrub(next); }}/>
    </footer>
    <p className="live-attribution">Timeline: shaded hours are a thaw around 0 °C, when pavements get most slippery; the line is air temperature ({d.meta.weatherSource}). Map: {d.meta.map.attribution}, retrieved {d.meta.map.retrieved}. All pedestrians, slips, falls, detections, alerts and gritting are simulated. Model and proofs: <a href="demo/paper_en.pdf" target="_blank" rel="noopener">paper (EN)</a> · <a href="demo/paperi_fi.pdf" target="_blank" rel="noopener">paperi (FI)</a>.</p>
  </div>;
}
