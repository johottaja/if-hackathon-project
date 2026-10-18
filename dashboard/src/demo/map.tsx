import {createContext, useContext, useEffect, useRef, type MutableRefObject, type ReactNode} from 'react';
import {Thermometer} from 'lucide-react';
import type {SimData} from './types';

// Shared playback clock: views read the time and the wall-clock moments when events appeared.
export type Clock = {tRef: MutableRefObject<number>; fired: MutableRefObject<Map<string, number>>};
export const ClockContext = createContext<Clock | null>(null);

export type DrawFn = (ctx: CanvasRenderingContext2D, t: number, now: number, fired: Map<string, number>, k: number) => void;
export const ease = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
export const C = {blue: '#0054e9', fall: '#e5483b', green: '#16875a', amber: '#d97706', ink: '#172d3e'};

export function geo(d: SimData) {
  const s = 1000 / d.meta.areaSize;
  return {s, X: (x: number) => x * s, Y: (y: number) => (d.meta.areaSize - y) * s};
}

// Slip risk per 1,000 passes → colour; the same scale is used for Pito's estimate and the truth.
export function riskColor(v: number) {
  if (v < 0.4) return null;
  const q = Math.min(1, v / 12), mix = (a: number, b: number) => Math.round(a + (b - a) * q);
  return `rgba(${mix(246, 214)}, ${mix(205, 38)}, ${mix(70, 61)}, ${(0.22 + 0.6 * q).toFixed(2)})`;
}

// Smooth heatmap: every square adds a soft blob weighted by its value (slips per 1,000 passes),
// and the summed intensity is coloured with one palette. Values change at most once per
// simulated hour, so each map is rendered once per key and reused between frames.
const HEAT_SIZE = 400, HEAT_MAX = 10, HEAT_RADIUS_M = 24;
const heatCache = new Map<string, HTMLCanvasElement>();
let palette: Uint8ClampedArray | null = null;
function heatPalette() {
  if (palette) return palette;
  const c = document.createElement('canvas'); c.width = 256; c.height = 1;
  const g = c.getContext('2d')!, grad = g.createLinearGradient(0, 0, 256, 0);
  [[0, 'rgba(255, 237, 160, 0)'], [0.15, 'rgba(255, 224, 120, .45)'], [0.4, 'rgba(253, 160, 70, .7)'],
   [0.7, 'rgba(230, 60, 40, .82)'], [1, 'rgba(150, 10, 40, .9)']].forEach(([o, col]) => grad.addColorStop(o as number, col as string));
  g.fillStyle = grad; g.fillRect(0, 0, 256, 1);
  return (palette = g.getImageData(0, 0, 256, 1).data);
}

export function heatCanvas(d: SimData, key: string, values: () => number[]) {
  const cached = heatCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = HEAT_SIZE;
  const ctx = canvas.getContext('2d')!, k = HEAT_SIZE / d.meta.areaSize, r = HEAT_RADIUS_M * k, v = values();
  d.cells.id.forEach((_, i) => {
    const a = Math.min(1, v[i] / HEAT_MAX);
    if (a < 0.03) return;
    const x = d.cells.x[i] * k, y = (d.meta.areaSize - d.cells.y[i]) * k;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(0, 0, 0, ${a})`); grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  });
  const img = ctx.getImageData(0, 0, HEAT_SIZE, HEAT_SIZE), px = img.data, pal = heatPalette();
  for (let i = 3; i < px.length; i += 4) {
    const j = px[i] * 4;
    px[i - 3] = pal[j]; px[i - 2] = pal[j + 1]; px[i - 1] = pal[j + 2]; px[i] = pal[j + 3];
  }
  ctx.putImageData(img, 0, 0);
  if (heatCache.size > 24) heatCache.delete(heatCache.keys().next().value!);
  heatCache.set(key, canvas);
  return canvas;
}

export function drawHeat(ctx: CanvasRenderingContext2D, heat: HTMLCanvasElement) {
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(heat, 0, 0, 1000, 1000); ctx.restore();
}

export function HeatLegend({label}: {label: string}) {
  return <div className="heat-legend"><span>{label}</span><i aria-hidden="true"/><small><span>low</span><span>very high</span></small></div>;
}

export function drawCells(ctx: CanvasRenderingContext2D, d: SimData, color: (i: number) => string | null) {
  const {s, X, Y} = geo(d), half = d.meta.cellSize / 2;
  d.cells.id.forEach((_, i) => {
    const c = color(i);
    if (!c) return;
    ctx.fillStyle = c;
    ctx.fillRect(X(d.cells.x[i] - half), Y(d.cells.y[i] + half), d.meta.cellSize * s, d.meta.cellSize * s);
  });
}

export function zoneRect(d: SimData, id: number) {
  const {s, X, Y} = geo(d), i = d.zones.id.indexOf(id);
  return [X(d.zones.x[i]), Y(d.zones.y[i] + d.meta.zoneSize), d.meta.zoneSize * s] as const;
}

export function drawZone(ctx: CanvasRenderingContext2D, d: SimData, id: number, o: {fill?: string; stroke: string; width: number; dash?: number[]; inset?: number}) {
  const [x, y, s] = zoneRect(d, id), inset = o.inset ?? o.width / 2;
  ctx.save();
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fillRect(x, y, s, s); }
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.lineWidth = o.width; ctx.strokeStyle = o.stroke; ctx.strokeRect(x + inset, y + inset, s - 2 * inset, s - 2 * inset);
  ctx.restore();
}

export function drawRoute(ctx: CanvasRenderingContext2D, d: SimData, index: number, color: string, width: number) {
  const {X, Y} = geo(d), r = d.routes[index];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [w, c] of [[width + 6, 'rgba(255, 255, 255, .85)'], [width, color]] as const) {
    ctx.beginPath(); r.x.forEach((x, i) => (i ? ctx.lineTo(X(x), Y(r.y[i])) : ctx.moveTo(X(x), Y(r.y[i]))));
    ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
  }
  ctx.restore();
}

// Phone slip detections as fading pings; new ones ripple when they appear during playback.
export function drawPings(ctx: CanvasRenderingContext2D, d: SimData, t: number, now: number, fired: Map<string, number>, k: number, hours = 6) {
  const {X, Y} = geo(d), det = d.detections;
  for (let i = det.t.length - 1; i >= 0 && det.t[i] > t - hours; i--) {
    if (det.t[i] > t) continue;
    const x = X(det.x[i]), y = Y(det.y[i]), f = fired.get(`d${i}`), p = f === undefined ? 1 : (now - f) / 700;
    if (p < 1) {
      ctx.beginPath(); ctx.arc(x, y, (5 + 16 * ease(p)) * k, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(0, 84, 233, ${0.7 * (1 - p)})`; ctx.lineWidth = 2 * k; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, 4 * k, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(0, 84, 233, ${0.55 * (1 - (t - det.t[i]) / hours)})`; ctx.fill();
  }
}

export function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, p: number, k: number) {
  ctx.save(); ctx.globalAlpha = p < 0.75 ? 1 : (1 - p) / 0.25; ctx.font = `600 ${Math.round(26 * k)}px Inter, Segoe UI, Arial, sans-serif`;
  const w = ctx.measureText(text).width, ty = Math.max(40 * k, y - (36 + 26 * ease(p)) * k);
  x = Math.min(1000 - w / 2 - 16, Math.max(w / 2 + 16, x));
  ctx.fillStyle = 'rgba(255, 255, 255, .94)'; ctx.beginPath(); ctx.roundRect(x - w / 2 - 12 * k, ty - 24 * k, w + 24 * k, 36 * k, 18 * k); ctx.fill();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(text, x, ty + 3 * k); ctx.restore();
}

// A square map: background tile, a canvas redrawn every animation frame, and optional overlays.
export function MapCanvas({d, draw, label, children}: {d: SimData; draw: DrawFn; label: string; children?: ReactNode}) {
  const clock = useContext(ClockContext)!;
  const ref = useRef<HTMLCanvasElement>(null), drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = 1000 * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    let raf = 0;
    const frame = (now: number) => {
      const k = Math.max(1, Math.min(2.2, 560 / (canvas.clientWidth || 1000)));
      ctx.clearRect(0, 0, 1000, 1000);
      drawRef.current(ctx, clock.tRef.current, now, clock.fired.current, k);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [clock]);
  return <div className="live-map" role="img" aria-label={label}>
    <img src={`demo/${d.meta.map.file}`} alt=""/>
    <canvas ref={ref} aria-hidden="true"/>
    {children}
  </div>;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Helsinki', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
const timeFormat = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit'});
export const formatWhen = (d: SimData, t: number) => dateFormat.format(new Date(Date.parse(d.meta.start) + t * 3600e3));
export const formatTime = (d: SimData, t: number) => timeFormat.format(new Date(Date.parse(d.meta.start) + t * 3600e3));

export function weatherLabel(temp: number, factor: number) {
  if (factor >= 1.8) return 'Thaw around 0 °C · very slippery';
  if (temp < -10) return 'Hard frost · grippy snow';
  return 'Frost and snow';
}

export function MapClock({d, t}: {d: SimData; t: number}) {
  const h = Math.min(d.meta.hours - 1, Math.floor(t));
  return <div className="live-clock"><strong>{formatWhen(d, t)}</strong>
    <span><Thermometer size={14} aria-hidden="true"/>{d.weather.temp[h].toFixed(1)} °C · {weatherLabel(d.weather.temp[h], d.weather.factor[h])}</span></div>;
}
