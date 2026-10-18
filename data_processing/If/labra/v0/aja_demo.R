# Live-demon data. Aja v0-kansiosta: Rscript aja_demo.R [kohdekansio]
# Kirjoittaa kohdekansioon simulation.json ja taustakartan turku-vpk.png.
# Esimerkiksi Pito-dashboardiin: Rscript aja_demo.R ../../../../if-hackathon-project/dashboard/public/demo
source("asetukset.R")
source("tammikuu_asetukset.R")
source("R/luo_grid.R")
source("R/lue_saa.R")
source("R/lue_kartta.R")
source("R/luo_kulkupohja.R")
source("R/simuloi_tammikuu.R")

argumentit <- commandArgs(trailingOnly = TRUE)
kohde <- if (length(argumentit)) argumentit[1] else "tulokset/demo"
dir.create(kohde, recursive = TRUE, showWarnings = FALSE)

polku <- list.files("data/alkuperainen/saa", pattern = "[.]csv$", full.names = TRUE)
saa <- lue_saa(polku)
reitit <- read.csv("data/oletukset/reitit.csv")
pohja <- luo_kulkupohja(luo_grid(alue, ruutukoko_m), reitit, ruutukoko_m, tammikuu$huoltoalue_m)
kartta <- lue_kartta("data/alkuperainen/kartta/turku.png", alue)
p <- tammikuu
tulos <- simuloi_tammikuu(pohja, saa, p)

kohdistettu <- "tuote"
vertailu <- "aikataulu"
ajat <- unique(tulos$summary$time_utc)
tunti0 <- function(aika) match(aika, ajat) - 1L

# Esitystä varten arvotaan erillisellä siemenellä: tapahtuman minuutti, sijainti ruudun
# sisällä ja se, mitkä kaatumiset tärinätunnistus havaitsi. Simulaation tulokset eivät muutu.
set.seed(p$seed + 1L)
ruutu <- match(tulos$events$cell_id, pohja$cell_id)
pisteet <- function(rivit, maara) {
  i <- rep(rivit, maara)
  data.frame(t = round(tunti0(tulos$events$time_utc[i]) + runif(length(i)), 3),
             x = round(pohja$x[ruutu[i]] - alue[["xmin"]] + runif(length(i), -4, 4), 1),
             y = round(pohja$y[ruutu[i]] - alue[["ymin"]] + runif(length(i), -4, 4), 1))
}

ev <- tulos$events
avain <- paste(ev$time_utc, ev$cell_id)
omat <- which(ev$scenario == kohdistettu & ev$falls > 0)
vertailun <- ev$falls[ev$scenario == vertailu][match(avain[omat], avain[ev$scenario == vertailu])]
vertailun[is.na(vertailun)] <- 0
# Kaatuminen ja tunnistus ovat liukastumisesta riippumattomia, joten havaittujen
# kaatumisten määrä on ehdolla määristä hypergeometrinen.
havaitut <- rhyper(length(omat), ev$falls[omat], ev$slips[omat] - ev$falls[omat],
                   ev$detected_slips[omat])
kaatumiset <- pisteet(omat, ev$falls[omat])
j <- sequence(ev$falls[omat])
kaatumiset$captured <- as.integer(j <= rep(havaitut, ev$falls[omat]))
# Yhteiset satunnaisluvut: kohdistetun huollon lisäkaatumiset olisivat estyneet aikataulun huollolla.
kaatumiset$extra <- as.integer(j > rep(vertailun, ev$falls[omat]))

vrt <- which(ev$scenario == vertailu & ev$falls > 0)
omien <- ev$falls[ev$scenario == kohdistettu][match(avain[vrt], avain[ev$scenario == kohdistettu])]
omien[is.na(omien)] <- 0
estetyt <- pisteet(vrt, pmax(0, ev$falls[vrt] - omien))

hav <- which(ev$scenario == kohdistettu & ev$observations > 0)
havainnot <- pisteet(hav, ev$observations[hav])

jarjesta <- function(d) d[order(d$t), ]
sarakkeet <- function(d) lapply(as.list(d), I)   # sarakemuoto pitää JSONin pienenä
huolto <- function(s) {
  h <- tulos$maintenance[tulos$maintenance$scenario == s, ]
  list(t = I(tunti0(h$time_utc)), zone = I(h$zone_id))
}
kertyma <- function(sarake) sapply(politiikat, function(s) {
  round(cumsum(tulos$summary[[sarake]][tulos$summary$scenario == s]), 3)
}, simplify = FALSE)
alueet <- unique(pohja[, c("zone_id", "zone_xmin", "zone_ymin")])
# Ruudun lähin reitti (sama 5 metrin sääntö kuin kulkupohjassa); asiakasnäkymän reitit.
reittinimet <- unique(reitit$reitti)
etaisyys <- sapply(reittinimet, function(r) {
  q <- reitit[reitit$reitti == r, ]
  q <- q[order(q$jarjestys), ]
  d <- rep(Inf, nrow(pohja))
  for (i in seq_len(nrow(q) - 1)) {
    dx <- q$x[i + 1] - q$x[i]; dy <- q$y[i + 1] - q$y[i]
    u <- pmax(0, pmin(1, ((pohja$x - q$x[i]) * dx + (pohja$y - q$y[i]) * dy) / (dx^2 + dy^2)))
    d <- pmin(d, sqrt((pohja$x - q$x[i] - u * dx)^2 + (pohja$y - q$y[i] - u * dy)^2))
  }
  d
})
reittien_pisteet <- lapply(reittinimet, function(r) {
  q <- reitit[reitit$reitti == r, ]
  q <- q[order(q$jarjestys), ]
  list(name = r, x = I(round(q$x - alue[["xmin"]], 1)), y = I(round(q$y - alue[["ymin"]], 1)))
})
L <- tulos$slipperiness

monte_carlo <- NULL
if (file.exists("paperi/tulokset.csv")) {
  d <- read.csv("paperi/tulokset.csv")
  d <- d[d$asetelma == 1, ]
  w <- reshape(d[, c("seed", "scenario", "expected_falls")], idvar = "seed",
               timevar = "scenario", direction = "wide")
  ero <- function(a, b) {
    x <- w[[paste0("expected_falls.", a)]] - w[[paste0("expected_falls.", b)]]
    s <- 1.96 * sd(x) / sqrt(length(x))
    round(c(mean = mean(x), lower = mean(x) - s, upper = mean(x) + s), 2)
  }
  monte_carlo <- list(
    seeds = nrow(w),
    meanFalls = sapply(politiikat, function(s) round(mean(w[[paste0("expected_falls.", s)]]), 2),
                       simplify = FALSE),
    preventedVsRotation = as.list(ero(vertailu, kohdistettu)),
    preventedVsBusiest = as.list(ero("kulku", kohdistettu)),
    source = "If/labra/v0/paperi/tulokset.csv")
}

demo <- list(
  meta = list(
    generated = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
    start = "2026-01-01T00:00:00+02:00", hours = length(ajat), seed = p$seed,
    areaSize = unname(alue[["xmax"]] - alue[["xmin"]]), cellSize = ruutukoko_m,
    zoneSize = p$huoltoalue_m, gritHours = p$huollon_kesto_h,
    targeted = kohdistettu, baseline = vertailu, params = p,
    map = list(file = "turku-vpk.png", attribution = "Maanmittauslaitos, taustakarttasarja / Kapsi, CC BY 4.0",
               retrieved = substr(kartta$metadata$retrieved_at, 1, 10)),
    weatherSource = "Ilmatieteen laitos, Turku Artukainen, CC BY 4.0",
    simulated = TRUE),
  weather = list(temp = round(saa$temp_c, 1), factor = round(tulos$weather_factor, 2)),
  cells = sarakkeet(data.frame(id = pohja$cell_id, x = pohja$x - alue[["xmin"]],
                               y = pohja$y - alue[["ymin"]], perHour = pohja$ohikulkuja_h,
                               zone = pohja$zone_id, route = max.col(-etaisyys, ties.method = "first") - 1L)),
  routes = reittien_pisteet,
  rhythm = round(tulos$rhythm, 4),
  # Tuotteen liukkausarvio kunkin tunnin alussa, tunti kerrallaan (tunti * ruutuja + ruutu).
  posterior = round(c(tulos$posterior_start), 4),
  zones = sarakkeet(data.frame(id = alueet$zone_id, x = alueet$zone_xmin - alue[["xmin"]],
                               y = alueet$zone_ymin - alue[["ymin"]])),
  grit = list(targeted = huolto(kohdistettu), baseline = huolto(vertailu)),
  falls = sarakkeet(jarjesta(kaatumiset)),
  prevented = sarakkeet(jarjesta(estetyt)),
  detections = sarakkeet(jarjesta(havainnot)),
  expected = kertyma("expected_falls"),
  realized = kertyma("falls"),
  slipperiness = lapply(split(L$slipperiness, L$date), function(x) round(x, 3)),
  monteCarlo = monte_carlo)

jsonlite::write_json(demo, file.path(kohde, "simulation.json"), auto_unbox = TRUE, digits = NA)
file.copy(kartta$polku, file.path(kohde, "turku-vpk.png"), overwrite = TRUE)
# Paperit demon linkeille, jos ne on käännetty (paperi/kaanna.sh).
for (paperi in c("paperi/paper_en.pdf", "paperi/paperi_fi.pdf")) {
  if (file.exists(paperi)) file.copy(paperi, file.path(kohde, basename(paperi)), overwrite = TRUE)
}
message(sprintf("Demo: %d kaatumista (%d havaittu), %d estetty, %d lisää, %d tärinähavaintoa -> %s",
                nrow(kaatumiset), sum(kaatumiset$captured), nrow(estetyt), sum(kaatumiset$extra),
                nrow(havainnot), kohde))
