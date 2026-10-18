# Aja tästä kansiosta: Rscript aja.R
source("setup.R")
source("asetukset.R")
source("R/luo_grid.R")
source("R/kohdista_gridiin.R")
source("R/luo_true_falls.R")
source("R/piirra_grid.R")
source("R/lue_kartta.R")

grid <- luo_grid(alue, ruutukoko_m)
true_falls <- luo_true_falls(grid, alku, loppu, maara, seed)
kartta <- lue_kartta("data/alkuperainen/kartta/turku.png", alue)

dir.create("data/johdettu", recursive = TRUE, showWarnings = FALSE)
dir.create("tulokset", showWarnings = FALSE)
write.csv(grid, "data/johdettu/grid.csv", row.names = FALSE)
write.csv(true_falls, "data/johdettu/true_falls.csv", row.names = FALSE)

png("tulokset/kaatumiset.png", width = 1000, height = 1000)
piirra_grid(grid, true_falls, ruutukoko_m, kartta)
dev.off()
