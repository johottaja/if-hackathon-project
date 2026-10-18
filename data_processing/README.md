# Pito data processing

Imported from [Elkkuboi/junction_turku](https://github.com/Elkkuboi/junction_turku) at `2bd7a66a6aa8e541abfa7b9cbb8c0497bb2d3118` on 18 October 2026. This is a vendored copy, tracked by the parent project rather than a nested Git repository.

Only the If materials are retained. The unrelated Tyks (`tyx-mylab`) and Redstone folders and `team.txt` were removed.

- [R simulator and regeneration instructions](If/labra/v0/README.md)
- [Sources](If/SOURCES.md)
- [Browser dashboard and heatmap](../dashboard/README.md)

The browser uses the existing simulator export in `dashboard/public/demo/`; cloning this source does not regenerate that export. Run R commands from `If/labra/v0/`. To refresh the browser data from this directory:

```sh
cd If/labra/v0
Rscript aja_demo.R ../../../../dashboard/public/demo
```

R and the packages documented in the simulator README are required only for regeneration. GitHub Pages builds the checked-in export without R. All pedestrian events and maintenance actions are simulated; weather is measured. Results do not demonstrate real-world injury reduction.
