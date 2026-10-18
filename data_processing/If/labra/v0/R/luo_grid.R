# Palauttaa ruutujen tunnisteet ja keskipisteet. Rajojen on jaettava täysiä ruutuja.
luo_grid <- function(alue, ruutukoko_m) {
  stopifnot(
    all(c("xmin", "xmax", "ymin", "ymax") %in% names(alue)),
    all(is.finite(alue)), length(ruutukoko_m) == 1,
    is.finite(ruutukoko_m), ruutukoko_m > 0
  )
  nx <- unname((alue["xmax"] - alue["xmin"]) / ruutukoko_m)
  ny <- unname((alue["ymax"] - alue["ymin"]) / ruutukoko_m)
  stopifnot(nx >= 1, ny >= 1, abs(nx - round(nx)) < 1e-8,
            abs(ny - round(ny)) < 1e-8)

  grid <- expand.grid(
    x = alue["xmin"] + (seq_len(round(nx)) - 0.5) * ruutukoko_m,
    y = alue["ymin"] + (seq_len(round(ny)) - 0.5) * ruutukoko_m,
    KEEP.OUT.ATTRS = FALSE
  )
  data.frame(cell_id = seq_len(nrow(grid)), grid)
}
