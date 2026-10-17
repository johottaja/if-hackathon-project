import {useMemo, useState} from 'react';
import {TriangleAlert, Smartphone, CircleCheck, Footprints} from 'lucide-react';
import {PERSONA, STREETS, correlation, customerFeed, riskLevel, riskMaps, routeCells} from './insights.mjs';
import {C, MapCanvas, MapClock, drawCells, drawRoute, drawZone, formatTime, formatWhen, riskColor, type DrawFn} from './map';
import {activeZones} from './timeline.mjs';
import type {SimData} from './types';

type FeedItem = {id: string; t: number; kind: 'warning' | 'prompt' | 'helped'; street: string; ratio?: number;
  tip?: null | {street: string; lower: number}; zone?: number; at?: number; signals?: number};
const pct = (x: number) => `${Math.round(x * 100)} %`;

function drawRisk(d: SimData, which: 'est' | 'truth', route: number): DrawFn {
  return (ctx, t) => {
    const maps = riskMaps(d, t), values = maps[which];
    drawCells(ctx, d, i => riskColor(values[i]));
    for (const [id] of activeZones(d.grit.targeted, t, d.meta.gritHours)) drawZone(ctx, d, id, {stroke: C.green, width: 3, fill: 'rgba(22, 135, 90, .08)'});
    drawRoute(ctx, d, route, 'rgba(0, 84, 233, .85)', 6);
  };
}

function RiskLegend() {
  return <div className="risk-legend" aria-label="Slip risk scale">
    <span>Low</span><i/><span>Very high</span>
    <small>Estimated slips per 1,000 passes · green square = gritted now</small>
  </div>;
}

function Card({item, d, answer, onAnswer}: {item: FeedItem; d: SimData; answer?: string; onAnswer: (a: string) => void}) {
  const time = formatTime(d, item.t), when = formatWhen(d, item.t);
  if (item.kind === 'warning') return <article className="feed-card warn">
    <TriangleAlert size={18} aria-hidden="true"/>
    <div><strong>Slippery morning on {item.street}</strong>
      <p>Estimated slip risk on your usual route is {item.ratio!.toFixed(1)}× a typical morning.</p>
      {item.tip && <p className="feed-tip"><Footprints size={14} aria-hidden="true"/>{item.tip.street} looks {pct(item.tip.lower)} safer right now.</p>}
      <small>{when} · Pito alert</small></div>
  </article>;
  if (item.kind === 'prompt') return <article className="feed-card prompt">
    <Smartphone size={18} aria-hidden="true"/>
    <div><strong>Was it slippery?</strong>
      <p>Your phone noticed a sudden jolt on {item.street} at {time}.</p>
      {answer ? <p className="feed-thanks">{answer === 'yes' ? 'Thanks. Shared anonymously as a confirmed slip.' : 'Thanks, noted.'}</p>
        : <div className="feed-actions" role="group" aria-label="Was it slippery?">
            <button onClick={() => onAnswer('yes')}>Yes</button><button onClick={() => onAnswer('no')}>No</button><button onClick={() => onAnswer('unsure')}>Not sure</button>
          </div>}
      <small>{when} · optional, no answer is fine · answers are not used in this replay</small></div>
  </article>;
  return <article className="feed-card helped">
    <CircleCheck size={18} aria-hidden="true"/>
    <div><strong>Your phone helped</strong>
      <p>Pito sent gritting to {item.street} (block {item.zone}) at {formatTime(d, item.at!)}. {item.signals === 1 ? 'Your phone’s signal was behind it.' : `Your phone was one of ${item.signals} signals behind it.`}</p>
      <small>{when} · gritting does not guarantee safety</small></div>
  </article>;
}

export default function CustomerView({d, t}: {d: SimData; t: number}) {
  const feed = useMemo(() => customerFeed(d) as FeedItem[], [d]);
  const route = d.routes.findIndex(r => r.name === PERSONA.route), mine = useMemo(() => routeCells(d, PERSONA.route), [d]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const visible = feed.filter(f => f.t <= t && t - f.t < 36).slice(-4).reverse(); // the last day and a half
  const {est, truth} = riskMaps(d, t);
  const routeRisk = mine.reduce((s: number, i: number) => s + est[i], 0) / mine.length;
  const r = correlation(est, truth);
  const street = STREETS[PERSONA.route as keyof typeof STREETS];

  return <div className="cv-grid">
    <section className="phone" aria-label={`${PERSONA.name}'s Pito app`}>
      <div className="phone-status"><span>{formatTime(d, t)}</span><span>Pito</span></div>
      <div className="phone-body">
        <header className="phone-head"><span className="phone-brand">If <b>Pito</b></span><span>Hi {PERSONA.name} · walks {street}</span></header>
        <div className={`route-chip level-${riskLevel(routeRisk).replace(' ', '-').toLowerCase()}`}>
          <span>Your route now</span><strong>{riskLevel(routeRisk)}</strong>
        </div>
        <MapCanvas d={d} draw={drawRisk(d, 'est', route)} label="Pito's estimated slip risk around your route"/>
        <RiskLegend/>
        <div className="feed" aria-live="polite">
          {visible.length === 0 && <p className="feed-empty">No alerts yet. Pito only notifies you when risk on your route is clearly above normal.</p>}
          {visible.map(item => <Card key={item.id} item={item} d={d} answer={answers[item.id]} onAnswer={a => setAnswers({...answers, [item.id]: a})}/>)}
        </div>
      </div>
    </section>

    <section className="live-card truth-card">
      <span className="live-eyebrow">Behind the scenes</span>
      <h2>What Pito estimates vs. what is really there</h2>
      <p className="muted">The phone shows the risk map {PERSONA.name} sees, built from phone slip detections and weather. This map shows the hidden truth from the simulation, on the same colour scale. No phone, customer or operator ever sees it.</p>
      <MapCanvas d={d} draw={drawRisk(d, 'truth', route)} label="Hidden true slip risk in the simulation">
        <MapClock d={d} t={t}/>
      </MapCanvas>
      <div className="agreement">
        <span>Map agreement with the truth now</span>
        <div className="agreement-bar"><i style={{width: `${Math.max(0, r ?? 0) * 100}%`}}/></div>
        <strong>{r === null ? 'Not enough signals yet today' : `r = ${r.toFixed(2)}`}</strong>
      </div>
      <p className="muted small">Each morning the map starts from weather alone, because the hidden slipperiness changes overnight. It sharpens as phones report slips during the day. Correlation across the {d.cells.id.length} pavement squares.</p>
    </section>
  </div>;
}
