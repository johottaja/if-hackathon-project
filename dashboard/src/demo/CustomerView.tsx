import {useContext, useEffect, useRef, useState} from 'react';
import {STREETS, correlation, riskLevel, riskMaps, routeCells, zoneStreet} from './insights.mjs';
import {C, ClockContext, MapCanvas, MapClock, drawCells, drawZone, formatTime, formatWhen, riskColor, weatherLabel, type DrawFn} from './map';
import {activeZones} from './timeline.mjs';
import type {SimData} from './types';

// The Pito mobile app (Expo web build, mobile/) runs in the iframe. This page posts it the map
// geometry once and then the current risk map; see mobile/src/liveDemo.ts for the receiving side.
const APP_URL = import.meta.env.VITE_PITO_APP_URL ?? 'app/';
const PLACE = 'Eskelinkatu';

function frameFor(d: SimData, t: number) {
  const h = Math.min(d.meta.hours - 1, Math.floor(t)), {est} = riskMaps(d, t);
  const streets = d.routes.map(r => {
    const cells = routeCells(d, r.name), risk = cells.reduce((s: number, i: number) => s + est[i], 0) / cells.length;
    return {name: STREETS[r.name as keyof typeof STREETS], level: riskLevel(risk), risk};
  }).sort((a, b) => b.risk - a.risk).map(({name, level}) => ({name, level}));
  const active = activeZones(d.grit.targeted, t, d.meta.gritHours);
  return {
    when: formatWhen(d, t),
    weather: `${d.weather.temp[h].toFixed(1)} °C · ${weatherLabel(d.weather.temp[h], d.weather.factor[h])}`,
    thaw: d.weather.factor[h] >= 1.8,
    risk: est.map((v: number) => Math.round(v * 100) / 100),
    gritted: active.map(([z]) => z),
    streets,
    gritting: active.map(([z, start]) => ({street: `${zoneStreet(d, z)} (block ${z})`, until: formatTime(d, start + d.meta.gritHours)})),
  };
}

function setupFor(d: SimData) {
  return {
    map: new URL(`demo/${d.meta.map.file}`, window.location.href).href,
    areaSize: d.meta.areaSize, cellSize: d.meta.cellSize, zoneSize: d.meta.zoneSize,
    cells: {x: d.cells.x, y: d.cells.y}, zones: d.zones,
    place: PLACE, area: 'Turku · simulated January 2026',
  };
}

function PitoApp({d}: {d: SimData}) {
  const clock = useContext(ClockContext)!;
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false), [slow, setSlow] = useState(false);
  useEffect(() => {
    const target = new URL(APP_URL, window.location.href).origin;
    const post = (type: string, payload: object) => frame.current?.contentWindow?.postMessage({source: 'pito-demo', type, ...payload}, target);
    let last = '';
    const send = () => {
      const t = clock.tRef.current, key = `${Math.floor(t * 4)}`;
      if (key === last) return;
      last = key;
      post('frame', {frame: frameFor(d, t)});
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== 'pito-app' || e.data.type !== 'ready') return;
      post('setup', {setup: setupFor(d)});
      last = '';
      send();
      setReady(true);
    };
    window.addEventListener('message', onMessage);
    const timer = setInterval(send, 200);
    const late = setTimeout(() => setSlow(true), 10000);
    return () => { window.removeEventListener('message', onMessage); clearInterval(timer); clearTimeout(late); };
  }, [d, clock]);
  return <div className="app-phone">
    <iframe ref={frame} src={APP_URL} title="Pito app with the simulated data"/>
    {!ready && <div className="app-loading">{slow ? 'The Pito app did not start. Build it with npm run build:demo in dashboard/.' : 'Starting the Pito app…'}</div>}
  </div>;
}

function drawTruth(d: SimData): DrawFn {
  return (ctx, t) => {
    const {truth} = riskMaps(d, t);
    drawCells(ctx, d, i => riskColor(truth[i]));
    for (const [id] of activeZones(d.grit.targeted, t, d.meta.gritHours)) drawZone(ctx, d, id, {stroke: C.green, width: 3, fill: 'rgba(22, 135, 90, .08)'});
  };
}

export default function CustomerView({d, t}: {d: SimData; t: number}) {
  const {est, truth} = riskMaps(d, t);
  const r = correlation(est, truth);
  return <div className="cv-grid">
    <section aria-label="The Pito app">
      <PitoApp d={d}/>
    </section>
    <section className="live-card truth-card">
      <span className="live-eyebrow">Behind the scenes</span>
      <h2>What the app estimates vs. what is really there</h2>
      <p className="muted">The Pito app shows a slip-risk map built only from phone slip detections and measured weather. This map shows the hidden truth from the simulation on the same colour scale. No phone, customer or operator ever sees it.</p>
      <MapCanvas d={d} draw={drawTruth(d)} label="Hidden true slip risk in the simulation">
        <MapClock d={d} t={t}/>
      </MapCanvas>
      <div className="agreement">
        <span>Map agreement with the truth now</span>
        <div className="agreement-bar"><i style={{width: `${Math.max(0, r ?? 0) * 100}%`}}/></div>
        <strong>{r === null ? 'Not enough signals yet today' : `r = ${r.toFixed(2)}`}</strong>
      </div>
      <p className="muted small">Each morning the app starts from weather alone, because the hidden slipperiness changes overnight. It sharpens as phones report slips during the day. Correlation across the {d.cells.id.length} pavement squares; green squares are gritted now.</p>
    </section>
  </div>;
}
