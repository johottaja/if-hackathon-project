# Pienet kontrollikokeet: sama työmäärä, paritus, ei päällekkäistä hiekoitusta,
# tulevan tiedon rajaaminen ja beta-binomiaalisen päivityksen oikeellisuus.
source("tammikuu_asetukset.R")
source("R/luo_grid.R")
source("R/luo_kulkupohja.R")
source("R/simuloi_tammikuu.R")

# Diskretoitu Beta säilyttää keskiarvon; yksi taso poistaa vaihtelun.
tasot <- liukkaustasot(0.25, 1, 40)
stopifnot(isTRUE(all.equal(mean(tasot), 0.2)), all(diff(tasot) > 0), tasot[1] > 0, tasot[40] < 1,
          isTRUE(all.equal(liukkaustasot(2, 3, 1), 0.4)))

# Päivitys vastaa suoraan laskettua posterioria: tasainen priori × tuntien binomiuskottavuudet.
p <- tammikuu
tasot <- liukkaustasot(0.25, 1, 5)
N <- c(30, 50, 10); D <- c(1, 3, 0); pii <- c(0.02, 0.03, 0.01); suoja <- c(1, 0.2, 1)
logw <- matrix(-log(5), 1, 5)
suora <- rep(1 / 5, 5)
for (h in 1:3) {
  q <- pii[h] * suoja[h] * tasot
  logw <- paivita_posteriori(logw, D[h], N[h], matrix(q, 1), p)
  suora <- suora * dbinom(D[h], N[h], p$virhehavainto_p + (p$tunnistus_p - p$virhehavainto_p) * q)
}
stopifnot(isTRUE(all.equal(drop(exp(logw)), suora / sum(suora))))

# Erikoistapaus: täydellinen tunnistus ja q = L antaa konjugaatin Beta(a + y, b + n - y).
p2 <- p; p2$tunnistus_p <- 1; p2$virhehavainto_p <- 0
tasot <- liukkaustasot(2, 5, 4000)
logw <- paivita_posteriori(matrix(-log(4000), 1, 4000), 7, 20, matrix(tasot, 1), p2)
stopifnot(abs(sum(exp(logw) * tasot) - (2 + 7) / (2 + 5 + 20)) < 1e-4)

grid <- luo_grid(c(xmin = 0, xmax = 60, ymin = 0, ymax = 40), 10)
reitit <- data.frame(reitti = rep(c("a", "b"), each = 2), jarjestys = rep(1:2, 2),
                     x = c(0, 60, 0, 60), y = c(5, 5, 25, 25), ohikulkuja_h = 100)
p$huoltoalue_m <- 20
p$liukastuminen_p <- 0.2
p$kaatuminen_liukastumisesta_p <- 0.5
p$virhehavainto_p <- 0
pohja <- luo_kulkupohja(grid, reitit, 10, p$huoltoalue_m)
saa <- data.frame(time_utc = as.POSIXct("2026-01-01", tz = "UTC") + 0:47 * 3600,
                  temp_c = -1, snow_cm = 2, rain_mean_mm = 0)
tulos <- simuloi_tammikuu(pohja, saa, p)
stopifnot(identical(tulos, simuloi_tammikuu(pohja, saa, p)))
q <- tulos$summary
huoltavat <- setdiff(politiikat, "ei_huoltoa")
toimia <- tapply(q$maintenance_actions, q$scenario, sum)
stopifnot(all(toimia[huoltavat] == toimia[["aikataulu"]]), toimia[["ei_huoltoa"]] == 0,
          all(sapply(politiikat, function(s) identical(q$passages[q$scenario == s],
                                                       q$passages[q$scenario == "aikataulu"]))))

# Tulevan sään muuttaminen ei muuta jo laskettua historiaa.
muutettu <- saa
muutettu$temp_c[5:8] <- 10
toinen <- simuloi_tammikuu(pohja, muutettu, p)
stopifnot(identical(tulos$frames[1:4], toinen$frames[1:4]),
          identical(head(tulos$summary, 4 * length(politiikat)),
                    head(toinen$summary, 4 * length(politiikat))))

# Päällekkäinen hiekoitus ei ole sallittu silloinkaan, kun vaikutus kestää huoltoväliä pidempään.
pitka <- p
pitka$huollon_kesto_h <- 12
h <- simuloi_tammikuu(pohja, saa, pitka)$maintenance
tunti <- as.numeric(as.POSIXct(h$time_utc, format = "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")) / 3600
valit <- unlist(lapply(split(tunti, paste(h$scenario, h$zone_id)), function(x) diff(sort(x))))
stopifnot(length(valit) > 0, all(valit >= pitka$huollon_kesto_h),
          all(table(h$scenario, h$time_utc) == pitka$huoltokohteita))

# Nollavaikutuksella vaihtoehtojen tapahtumat ovat samoja huoltopaikoista riippumatta.
p$huollon_teho <- 0
nolla <- simuloi_tammikuu(pohja, saa, p)$summary
stopifnot(all(sapply(politiikat, function(s) {
  identical(nolla$falls[nolla$scenario == s], nolla$falls[nolla$scenario == "aikataulu"]) &&
    identical(nolla$observations[nolla$scenario == s], nolla$observations[nolla$scenario == "aikataulu"])
})))

# Täysi vaikutus kaikkialla poistaa simuloidut liukastumiset ja kaatumiset.
p$huollon_teho <- 1
p$huoltokohteita <- max(pohja$zone_id)
kaikki <- simuloi_tammikuu(pohja, saa, p)$summary
kaikki <- kaikki[kaikki$scenario != "ei_huoltoa", ]
stopifnot(all(kaikki$falls == 0), all(kaikki$observations == 0))
message("Tammikuun kontrollikokeet läpäisty.")
