# Pito — If prevention dashboard

The pitch workspace is a single schematic map and a focused selected-place panel. Select a map marker to inspect a place. The workspace opens directly on the map and selected-place panel, without an introductory heading or place dropdown. The panel shows separate confirmed-fall and hazard-only counts, Linnankatu’s simulated weather anomaly, maintenance status and one next action.

Reports and maintenance history remain under **Reports & maintenance history**. **Scenario controls** contains the one-time staged report and shared reset. Sidebar navigation, aggregate metric cards, filters, export and the duplicate ranked list were removed to keep the pitch focused.

## Run and validate

Run commands inside `dashboard/`. Start `npm run api` and `npm run dev` in separate terminals. The dashboard polls the shared synthetic API every two seconds; offline data may be stale and mutations require the service. See [the connected runbook](../docs/demo-runbook.md) for phone setup and the complete sequence.

Run `npm run build` and `npm test` for validation. React, TypeScript, Vite, Lucide and Radix Dialog remain the existing stack; no dependencies were added.

## Demo boundaries

The fixed window is 11–17 October 2026. Counts represent synthetic reports, not unique people, injury probabilities or demonstrated savings. Places are schematic groups rather than geographic coordinates. If coordinates with fictional partners; assigning work sends no external notification. Completion and verification retain report history and do not guarantee safety. New reports can reopen a location.

Weather ingestion, motion processing, actual If-app integration, production authentication and maintenance agreements remain future work. Blue tokens and the plain text If placeholder are provisional brand treatments.

The Linnankatu count marker also shows an exclamation badge while review or assignment is needed. Clicking it opens **Action needed** on the map. **Send** records review (if needed) and a gritting assignment to the fictional partner through the shared API; it never sends an external dispatch. Errors retain a retry action, and successful assignment changes the popup to **Request recorded**.

Two additional clickable hazard symbols sit between the Linnankatu and Aurakatu labels: a slippery-surface warning sign opens a simulated above-weather-expectation message, and a bicycle opens a pothole report. These are synthetic, approximate map annotations; they do not add fall counts or change the connected maintenance workflow.
