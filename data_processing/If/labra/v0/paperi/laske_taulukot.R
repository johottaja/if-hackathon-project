# Paperin numeeriset tulokset. Aja v0-kansiosta: Rscript paperi/laske_taulukot.R
# Simuloi asetelmat (noin 10 min neljällä ytimellä), kirjoittaa paperi/tulokset.csv
# ja sen jälkeen taulukot kummallekin kielelle (paperi/kirjoita_taulukot.R).
source("tammikuu_asetukset.R")
source("asetukset.R")
source("R/luo_grid.R")
source("R/lue_saa.R")
source("R/luo_kulkupohja.R")
source("R/simuloi_tammikuu.R")
source("R/vertaa_siemenet.R")
source("paperi/asetelmat.R")

saa <- lue_saa(list.files("data/alkuperainen/saa", pattern = "[.]csv$", full.names = TRUE))
pohja <- luo_kulkupohja(luo_grid(alue, ruutukoko_m), read.csv("data/oletukset/reitit.csv"),
                        ruutukoko_m, tammikuu$huoltoalue_m)
ytimia <- max(1, parallel::detectCores())

kaikki <- list()
for (i in seq_along(asetelmat)) {
  p <- modifyList(tammikuu, asetelmat[[i]]$muutos)
  d <- vertaa_siemenet(pohja, saa, p, asetelmat[[i]]$siemenet, ytimia)
  d$asetelma <- i
  kaikki[[i]] <- d
  message(asetelmat[[i]]$fi, ": valmis")
}
write.csv(do.call(rbind, kaikki), "paperi/tulokset.csv", row.names = FALSE)
source("paperi/kirjoita_taulukot.R")
