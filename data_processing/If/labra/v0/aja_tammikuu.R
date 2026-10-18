# Aja v0-kansiosta: Rscript aja_tammikuu.R
source("setup.R")
source("asetukset.R")
source("tammikuu_asetukset.R")
source("R/luo_grid.R")
source("R/lue_saa.R")
source("R/lue_kartta.R")
source("R/luo_kulkupohja.R")
source("R/simuloi_tammikuu.R")
source("R/kirjoita_toisto.R")

polku <- list.files("data/alkuperainen/saa", pattern = "[.]csv$", full.names = TRUE)
stopifnot(length(polku) == 1)
saa <- lue_saa(polku)
grid <- luo_grid(alue, ruutukoko_m)
reitit <- read.csv("data/oletukset/reitit.csv")
pohja <- luo_kulkupohja(grid, reitit, ruutukoko_m, tammikuu$huoltoalue_m)
kartta <- lue_kartta("data/alkuperainen/kartta/turku.png", alue)
tulos <- simuloi_tammikuu(pohja, saa, tammikuu)

dir.create("data/johdettu", showWarnings = FALSE)
dir.create("tulokset", showWarnings = FALSE)
write.csv(saa, "data/johdettu/saa_tunti.csv", row.names = FALSE)
write.csv(pohja, "data/johdettu/kulkupohja.csv", row.names = FALSE)
write.csv(tulos$passages, "data/johdettu/ohikulut.csv", row.names = FALSE)
write.csv(tulos$events, "data/johdettu/tapahtumat_tunti.csv", row.names = FALSE)
write.csv(tulos$maintenance, "data/johdettu/huoltotoimet.csv", row.names = FALSE)
write.csv(tulos$slipperiness, "data/johdettu/liukkaus_paiva.csv", row.names = FALSE)
write.csv(tulos$summary, "data/johdettu/vertailu_tunti.csv", row.names = FALSE)
saveRDS(tulos, "data/johdettu/tammikuu.rds")
jsonlite::write_json(list(params = tammikuu, area = as.list(alue), cell_size_m = ruutukoko_m,
                         weather_file = basename(polku), weather_md5 = unname(tools::md5sum(polku)),
                         routes_md5 = unname(tools::md5sum("data/oletukset/reitit.csv")),
                         map_metadata = kartta$metadata, r_version = R.version.string),
                    "data/johdettu/ajotiedot.json", auto_unbox = TRUE, pretty = TRUE)
kirjoita_toisto(tulos, pohja, saa, alue, ruutukoko_m, tammikuu, kartta, "tulokset/tammikuu.html")
print(aggregate(cbind(falls, expected_falls, maintenance_actions) ~ scenario,
                tulos$summary, sum))
