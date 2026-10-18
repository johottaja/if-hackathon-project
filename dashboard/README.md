# Pito — If prevention dashboard

The pitch workspace is a single schematic map and a focused selected-place panel. Select a map marker to inspect a place. The workspace opens directly on the map and selected-place panel, without an introductory heading or place dropdown. The panel shows separate confirmed-fall and hazard-only counts, Linnankatu’s simulated weather anomaly, maintenance status and one next action.

Reports and maintenance history remain under **Reports & maintenance history**. **Scenario controls** contains the one-time staged report and shared reset. Sidebar navigation, aggregate metric cards, filters, export and the duplicate ranked list were removed to keep the pitch focused.

## Run and validate

Run commands inside `dashboard/`. Start `npm run api` and `npm run dev` in separate terminals. The dashboard polls the shared synthetic API every two seconds; offline data may be stale and mutations require the service. See [the connected runbook](../docs/demo-runbook.md) for phone setup and the complete sequence.

Run `npm run build` and `npm test` for validation. React, TypeScript, Vite, Lucide and Radix Dialog remain the existing stack; no dependencies were added.

## Demo boundaries

The fixed window is 11–17 October 2026. Counts represent synthetic reports, not unique people, injury probabilities or demonstrated savings. Places are schematic groups rather than geographic coordinates. If coordinates with fictional partners; assigning work sends no external notification. Completion and verification retain report history and do not guarantee safety. New reports can reopen a location.

Weather ingestion, motion processing, actual If-app integration, production authentication and maintenance agreements remain future work. Blue tokens are provisional brand treatments. Headers use the user-supplied If logo stored in `public/brand/if-logo.png`, preserving its aspect ratio.

The Linnankatu count marker also shows an exclamation badge while review or assignment is needed. Clicking it opens **Action needed** on the map. **Send** records review (if needed) and a gritting assignment to the fictional partner through the shared API; it never sends an external dispatch. Errors retain a retry action, and successful assignment changes the popup to **Request recorded**.

## Live simulation demo

`demo.html` is a public page for hackathon voters: a simulated January 2026 around Eskelinkatu, Turku, seen from three angles on one shared timeline. It needs no API and works on phones and laptops.

- **Simulation** (`#simulation`): every fall as a red dot, falls captured by a phone’s vibration sensor with a blue ripple, and green markers for falls that Pito-targeted gritting prevented. The counter compares Pito-targeted gritting with the same crew on a fixed rotation in the same simulated month (common random numbers). It can be negative, because the rotation sometimes grits a place Pito skipped; those falls get an amber ring. An x-ray toggle shows the hidden slipperiness.
- **Pito app** (`#customer`): the real mobile app (`mobile/`, Expo web build) in an iframe. In live mode its Home map shows the simulated area with Pito’s estimated slip risk from phone slip detections and measured weather, plus a “Right now” list. Next to it, the hidden truth on the same colour scale and the current correlation between the two.
- **If operations** (`#if`): styled like this dashboard. Recommended blocks appear as map markers; the selected block shows phone signals, estimated risk, measured weather and a **Send gritting** next step. The month-so-far panel has KPIs and an illustrative euro estimate built on two adjustable assumptions. Under **Dispatch controls**, turning off auto-dispatch pauses the replay until each block is sent.

Add `?t=<hours>` to open at a given moment, for example `demo.html?t=376#if` for the thaw on 16 January.

### Build and publish

`npm run build:demo` builds the dashboard and demo into `dist/` and exports the Pito app’s web build into `dist/app/`. Preview it with `npm run preview` and open `/demo.html`. `EXPO_BASE_URL` sets the app’s subpath (default `/app`).

`.github/workflows/pages.yml` runs the tests and `build:demo` on every push to `main` and publishes `dist/` to GitHub Pages. Enable it once in the repository: **Settings → Pages → Source: GitHub Actions**. The voter link is then `https://<owner>.github.io/<repository>/demo.html`. The dashboard at the site root runs without its API there and shows itself as disconnected.

During `npm run dev`, the iframe has no app build. Run `npm run web` in `mobile/` and start the dashboard with `VITE_PITO_APP_URL=http://localhost:8081 npm run dev`.

### Data and honesty

All pedestrians, slips, falls, detections and gritting are simulated. Weather is measured (FMI, Turku Artukainen, CC BY 4.0); the background map is Maanmittauslaitos’ background map via Kapsi (CC BY 4.0). No customer identities or movement histories are shown in the If view.

`public/demo/simulation.json` and `public/demo/turku-vpk.png` are generated by Elias’s R simulator ([Elkkuboi/junction_turku](https://github.com/Elkkuboi/junction_turku), `If/labra/v0`). To regenerate, run there:

```sh
Rscript aja_demo.R <path-to>/if-hackathon-project/dashboard/public/demo
```

The model and its proofs are in that repository’s `If/labra/v0/paperi/simulaattori.pdf`. `src/demo/timeline.mjs` holds the counters and `src/demo/insights.mjs` the risk maps and tasks; `npm test` checks them against the simulator data.
Two additional clickable hazard symbols sit between the Linnankatu and Aurakatu labels: a slippery-surface warning sign opens a simulated above-weather-expectation message, and a bicycle opens a pothole report. These are synthetic, approximate map annotations; they do not add fall counts or change the connected maintenance workflow.

## Dashboard and heatmap tabs

The GitHub Pages site opens **Heatmap** by default. A single navigation row contains Heatmap, Simulation, Pito app, If operations and **If dashboard** (`./?view=dashboard`). The site root redirects to `demo.html#heatmap`; explicit visualisation hashes remain supported. The heatmap opens with a timeline, estimated slip risk per 1,000 passes, an optional hidden simulation truth layer, street averages and active gritting outlines. Existing simulation, customer and If operations views remain available within the visualisation page. The root dashboard’s connected maintenance actions still require the local API; Pages hosts static files only.

Simulator source is vendored in [data_processing](../data_processing/README.md) from `Elkkuboi/junction_turku`, revision `2bd7a66a6aa8e541abfa7b9cbb8c0497bb2d3118`. Only If materials are retained. The browser uses the existing checked-in export; importing source does not regenerate results. See the data-processing README for the R regeneration command.
