# Aja tästä kansiosta: Rscript tarkista.R
source("R/luo_grid.R")
source("R/kohdista_gridiin.R")
source("R/luo_true_falls.R")

grid <- luo_grid(c(xmin = 0, xmax = 20, ymin = 0, ymax = 30), 10)
stopifnot(nrow(grid) == 6, identical(unique(grid$x), c(5, 15)),
          identical(unique(grid$y), c(5, 15, 25)))

# Sisäraja kuuluu oikean/ylemmän ruudun puolelle. Ulkorajoista vain minimit mukana.
kohdistus <- kohdista_gridiin(c(0, 9.9, 10, 19.9), c(0, 9.9, 10, 29.9), grid, 10)
stopifnot(identical(kohdistus$cell_id, c(1L, 1L, 4L, 6L)))
virhe <- function(lause) inherits(try(lause, silent = TRUE), "try-error")
stopifnot(virhe(kohdista_gridiin(20, 0, grid, 10)),
          virhe(kohdista_gridiin(0, 30, grid, 10)),
          virhe(kohdista_gridiin(-0.1, 0, grid, 10)),
          virhe(kohdista_gridiin(0, -0.1, grid, 10)),
          virhe(luo_grid(c(xmin = 0, xmax = 21, ymin = 0, ymax = 30), 10)))

alku <- as.POSIXct("2026-01-10 06:00:00", tz = "UTC")
loppu <- alku + 3600
falls <- luo_true_falls(grid, alku, loppu, 100, 42)
ajat <- as.POSIXct(falls$event_at, format = "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
ruudut <- grid[match(falls$cell_id, grid$cell_id), ]
stopifnot(nrow(falls) == 100, !anyDuplicated(falls$fall_id),
          all(falls$x == ruudut$x), all(falls$y == ruudut$y),
          all(ajat >= alku & ajat < loppu), all(falls$is_simulated),
          identical(falls, luo_true_falls(grid, alku, loppu, 100, 42)),
          nrow(luo_true_falls(grid, alku, loppu, 0, 42)) == 0,
          virhe(luo_true_falls(grid, alku + 0.5, loppu + 0.5, 1, 42)),
          virhe(luo_true_falls(grid, loppu, alku, 100, 42)))

message("Tarkistukset läpäisty.")
