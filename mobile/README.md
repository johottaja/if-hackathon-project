# Pito by If — mobile

## Current pitch demo

The connected Linnankatu demonstration supersedes the older standalone scenario below. See [the current runbook](../docs/demo-runbook.md) and [saved pitch](../docs/pitch.md). Both apps share synthetic reports and maintenance through the dashboard demo API. Motion detection, weather/claims inputs and external maintenance alerts are simulated or future scope.

The mobile Home screen uses warm neutral surfaces, white cards, calm dark typography and blue actions, informed by the If Finland website reviewed on 17 October 2026. The map, hazard filters and tap-to-inspect places support community reporting. A persistent **Report something** action starts a hazard-only report or resumes a draft.

The **Simulate possible fall** button is tucked below the maintenance controls at the bottom of **About**, away from the initial view: it returns to Home and shows **Did you fall?** in a focused overlay with the entire app blurred and background controls blocked. **Yes, report what happened** opens the existing report flow with a confirmed fall; No/dismiss shares nothing. Detection remains explicitly simulated. Brand colours remain approximate and the text If mark remains a placeholder, pending approved assets.

## Live simulation mode (web)

The dashboard’s live demo (`dashboard/demo.html`) embeds this app’s web build in an iframe. It posts the simulated area’s map geometry once and then the current slip-risk estimate; the app replies only with a ready signal. In this mode the Home map shows the real Turku map with the estimated risk and gritted blocks, and the hazard list is replaced by a “Right now” list. Messages are accepted only from the embedding page on the same origin or from `localhost`. Native builds and the stand-alone app never enter this mode. See `src/liveDemo.ts` and `src/LiveRiskMap.tsx`.

`app.config.js` reads an optional `EXPO_BASE_URL`, so the web export can be served from a subpath (`/app` by default in `dashboard`’s `npm run build:demo`).

## Earlier implementation reference

The following reference predates the connected Pito update; use the runbook for current location, counts and connection instructions.

# If Prevention — mobile app

Implemented with Expo SDK 57, React Native, TypeScript and NativeWind. All data, maintenance partners and updates are synthetic. The app works independently in local demo mode; it does not require the dashboard.

## Run

Use Node.js 22.13 or newer. Run all commands from this directory:

```sh
npm ci
npm start
```

Press `i` for an installed iOS simulator, or run `npm run ios`. Use an Expo Go version compatible with SDK 57 on a physical device. The computer and phone must be on the same network. `npm run web` opens a browser preview.

```sh
npm run typecheck
npm test
npm run build:ios
npm run build:web
```

Exports are JavaScript/assets bundles; an iOS export is not a signed IPA or an App Store build. Native building/signing and production deployment remain future work.

## Screens and demo

- **Explore:** illustrative neighbourhood map, accessible list alternative, category filters and place details. Pin numbers count reports, including confirmed falls and hazard-only reports. Category filters select places containing that hazard; place counts include all reports at that place. Locations are manually selected; no GPS permission is requested.
- **Report:** select an approximate place and hazard, add an optional note and clearly labelled synthetic illustration, review and explicitly publish. Closing retains the draft across launches. Repeated submission with the same draft ID cannot duplicate a report.
- **Updates:** maintenance progress, completion and verification. Reports stay visible after work; completion never guarantees current safety.
- **About:** explanation, simulated fall prompt and clearly labelled presenter maintenance controls. These controls do not dispatch real work.

Rehearse the loop:

1. In About, tap **Simulate possible fall**. No/dismiss creates no report. Yes opens a draft; the count changes only after publication.
2. Select Linnankatu pavement, review and publish. Inspect the place’s updated counts and history.
3. In About’s maintenance demo controls, select that place. Enter a note for each transition: under review → assigned → completed → verified.
4. Open Updates to see the result. A new report at a completed or verified place reopens review and preserves the existing history.
5. **Reset local demo** restores the opening state and clears the draft after a native confirmation.

The fixed window is **11–17 October 2026**. Data is persisted with AsyncStorage on this device. No identities or personal movement histories are collected. Clearing app storage resets the demo.

## Optional API adapter

Leave `EXPO_PUBLIC_API_URL` unset for the recommended standalone demo. Setting it opts into a compatible demo API, using `GET /api/state`, `POST /api/reports` and `POST /api/actions`; see `src/api.ts` for the response types. The API must implement this contract. The existing React dashboard uses separate state and is **not automatically connected**. Local and connected mode are labelled in About.

For a physical device, use the server computer’s LAN address, not `localhost`. If the API is unavailable, the app retains drafts for retry and shows a connection error. Production HTTPS, authentication, moderation and server integration are unresolved.

## Design and implementation

`App.tsx` owns the three tabs and native sheet flows. `src/NeighborhoodMap.tsx` draws a schematic SVG map with labelled touch targets; it is not a tile map or a navigation service. `src/model.mjs` owns the standalone fixture and state transitions; its declaration file supplies TypeScript types. `src/ui.tsx` contains shared controls and theme tokens. Native dependencies live entirely in this application directory.

Blue is an If-inspired prototype token, not a verified official brand value. The word “If” is a text placeholder. Native scroll views use automatic content insets, and fixed controls respect safe areas. Controls use semantic labels, explicit selected states and touch targets of at least 44 points. Large-text/VoiceOver and broader device QA remain release checks.

Validation performed: TypeScript, model tests for distinct counts/idempotency/history/reopening, web/iOS bundle exports, browser reporting flow and native iPhone simulator rendering, saved-draft restoration and publication. Dependency audit findings and remaining limitations are recorded in `../docs/mobile-implementation.md`.

The fall check-in uses `expo-blur` (Expo SDK 57 compatible) for the iOS/web backdrop. It is rendered above the full app, including navigation; background controls are hidden from accessibility and blocked until dismissal or confirmation. Android blur is outside this iOS demo’s validation scope.

## Guided reporting · current demo

Reporting now uses the same centered, blurred-backdrop presentation as the fall check-in, with one question at a time: confirm the approximate location → tap a large hazard choice → add or skip a note → review and explicitly **Share report**. Back preserves answers; closing saves the draft. The success screen returns to the map. The old two-step sheet and synthetic illustration attachment control are superseded; existing drafts with illustrations still show them at review.
