# Negatiivinen kontrolli: ilman liukkauden vaihtelua havainnoista ei ole kohdistushyötyä.
source("tammikuu_asetukset.R")
source("R/luo_grid.R")
source("R/simuloi_tammikuu.R")

pohja <- luo_grid(c(xmin = 0, xmax = 60, ymin = 0, ymax = 40), 10)
pohja$zone_id <- floor(pohja$x / 20) + 3 * floor(pohja$y / 20) + 1
pohja$ohikulkuja_h <- 100
saa <- data.frame(time_utc = as.POSIXct("2026-01-01", tz = "UTC") + 0:47 * 3600,
                  temp_c = -1, snow_cm = 2, rain_mean_mm = 0)
p <- tammikuu
p$liukkaustasoja <- 1
p$kulkeminen_satunnainen <- FALSE
p$huoltoalue_m <- 20
for (siemen in 1:10) {
  p$seed <- siemen
  q <- simuloi_tammikuu(pohja, saa, p)$summary
  e <- lapply(setdiff(politiikat, "ei_huoltoa"), function(s) q$expected_falls[q$scenario == s])
  stopifnot(all(sapply(e, function(x) isTRUE(all.equal(x, e[[1]], tolerance = 1e-12)))))
}
message("Tasaisen liukkauden kontrolli läpäisty: odotettu hyöty on nolla 10 siemenellä.")
