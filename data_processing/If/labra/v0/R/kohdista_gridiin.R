# Syötekoordinaatit ovat samassa metrisessä koordinaatistossa kuin grid.
kohdista_gridiin <- function(x, y, grid, ruutukoko_m) {
  stopifnot(length(x) == length(y), all(is.finite(x)), all(is.finite(y)),
            length(ruutukoko_m) == 1, is.finite(ruutukoko_m), ruutukoko_m > 0)
  xmin <- min(grid$x) - ruutukoko_m / 2
  ymin <- min(grid$y) - ruutukoko_m / 2
  nx <- length(unique(grid$x))
  ny <- length(unique(grid$y))

  ix <- floor((x - xmin) / ruutukoko_m)
  iy <- floor((y - ymin) / ruutukoko_m)
  if (any(ix < 0 | ix >= nx | iy < 0 | iy >= ny)) {
    stop("Koordinaatti on ruudukon ulkopuolella.")
  }
  tulos <- grid[iy * nx + ix + 1, , drop = FALSE]
  rownames(tulos) <- NULL
  tulos
}
