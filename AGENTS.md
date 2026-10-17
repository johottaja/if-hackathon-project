# Project guidance

## Active concept and scope
- Build plans for an If-branded fall-prevention service: a community hazard map for customers and an actionable prevention dashboard for If.
- The user explicitly expanded scope to update the existing mobile app and dashboard for the Pito pitch demo. Keep changes focused on that demonstration; do not add unrelated features. See `docs/demo-runbook.md` and `docs/pitch.md` for the current contract.
- Treat water-damage and other unrelated ideas as legacy drafts. Preserve them with a visible legacy notice; never import their assumptions into this concept.

## Structure and ownership
- Keep the web dashboard in `dashboard/` and the Expo + React Native + NativeWind iOS app in `mobile/`.
- Each application owns its README, screen plan and later setup/run instructions.
- Keep shared product decisions, terminology and demonstration contracts in `docs/`; keep the root README as the navigation entry point.
- Update affected documentation when scope or decisions change. Label unresolved choices rather than silently deciding major architecture.

## Product consistency
- Follow `docs/design-direction.md`: both experiences use an If-inspired blue accent, light surfaces and consistent status language.
- Clearly distinguish a simulated sensor trigger, a user-confirmed fall and a hazard report without a fall.
- Use synthetic data for the demo. Label counts, estimates and assumptions honestly; do not claim demonstrated injury reduction or savings.
- Preserve report history and distinguish maintenance completion from a guarantee of safety.
- Make If’s role coordination and prioritisation; do not imply that If owns public roads or can dispatch municipal work without an agreement.
- Plan aggregate operator views without exposing customer identities or precise personal movement histories.

## Quality and prioritisation
- Prioritise the complete report → hotspot → maintenance → verification demonstration over technical breadth.
- Evaluate changes against customer value, credible business value for If, and innovation/experience; retain the supplied four 25% rubric entries and flag their duplicated wording.
- Use text, icons and accessible contrast alongside colour. Keep mobile and dashboard terminology consistent.
- Keep future application dependencies and commands within the owning application directory; document any shared package before adding one.
