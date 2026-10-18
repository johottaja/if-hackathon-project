# Pito — If keeps you on your feet

Pito is a proposed If-app safety map for pedestrians and cyclists, paired with an If prevention dashboard. The implemented synthetic demo connects a Linnankatu report to hotspot review, a fictional maintenance assignment, completion and verification.

- [Pitch script](docs/pitch.md): the supplied seven slides, preserved with rehearsal/evidence notes.
- [Connected demo runbook](docs/demo-runbook.md): commands, phone connection and the exact slide 5 sequence.
- [Mobile app](mobile/README.md): Expo + React Native + NativeWind customer experience.
- [Dashboard](dashboard/README.md): React operator experience and demo API.
- [Live simulation demo](dashboard/README.md#live-simulation-demo): `dashboard/demo.html`, a simulated January 2026 for voters with the embedded Pito app. Published to GitHub Pages by `.github/workflows/pages.yml`.
- [Product plan](docs/product-plan.md): terminology, principles and the supplied four 25% judging criteria (including duplicated wording).
- [Design direction](docs/design-direction.md): shared If-inspired blue and accessible status language.
- [Evidence and validation](docs/prevention-validation.md): unvalidated sensing and impact hypotheses.
- [Original challenge](docs/hackathon-challenge.md).
- [Legacy water-damage idea](docs/water-assistance-business-case.md): unrelated, inactive draft.

Project documentation lives in `docs/`, which is excluded from Git. README and AGENTS.md files remain in their owning directories.


All reports and partners are synthetic. Motion detection and the weather anomaly are simulated; no live weather or claims data is used. Completed maintenance is not a guarantee of safety. Follow the runbook to connect both screens; mobile without the API environment variable remains standalone.

## Dashboard and heatmap tabs

The GitHub Pages site opens **Heatmap** by default. A single navigation row contains Heatmap, Simulation, Pito app, If operations and **If dashboard** (`./?view=dashboard`). The site root redirects to `demo.html#heatmap`; explicit visualisation hashes remain supported. The heatmap opens with a timeline, estimated slip risk per 1,000 passes, an optional hidden simulation truth layer, street averages and active gritting outlines. Existing simulation, customer and If operations views remain available within the visualisation page. The root dashboard’s connected maintenance actions still require the local API; Pages hosts static files only.

Simulator source is vendored in [data_processing](data_processing/README.md) from `Elkkuboi/junction_turku`, revision `2bd7a66a6aa8e541abfa7b9cbb8c0497bb2d3118`. Only If materials are retained. The browser uses the existing checked-in export; importing source does not regenerate results. See the data-processing README for the R regeneration command.
