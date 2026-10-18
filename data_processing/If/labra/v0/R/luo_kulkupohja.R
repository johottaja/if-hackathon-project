# Käsin hahmoteltujen reittien lähellä olevat ruudut ja oletettu tuntikulkeminen.
luo_kulkupohja <- function(grid, reitit, ruutukoko_m, huoltoalue_m) {
  pohja <- grid
  pohja$ohikulkuja_h <- 0
  for (reitti in split(reitit, reitit$reitti)) {
    reitti <- reitti[order(reitti$jarjestys), ]
    etaisyys <- rep(Inf, nrow(grid))
    for (i in seq_len(nrow(reitti) - 1)) {
      dx <- reitti$x[i + 1] - reitti$x[i]
      dy <- reitti$y[i + 1] - reitti$y[i]
      u <- pmax(0, pmin(1, ((grid$x - reitti$x[i]) * dx +
                            (grid$y - reitti$y[i]) * dy) / (dx^2 + dy^2)))
      etaisyys <- pmin(etaisyys, sqrt((grid$x - reitti$x[i] - u * dx)^2 +
                                    (grid$y - reitti$y[i] - u * dy)^2))
    }
    pohja$ohikulkuja_h <- pohja$ohikulkuja_h +
      (etaisyys <= ruutukoko_m / 2) * reitti$ohikulkuja_h[1]
  }
  pohja <- pohja[pohja$ohikulkuja_h > 0, ]
  xmin <- min(grid$x) - ruutukoko_m / 2
  ymin <- min(grid$y) - ruutukoko_m / 2
  zx <- floor((pohja$x - xmin) / huoltoalue_m)
  zy <- floor((pohja$y - ymin) / huoltoalue_m)
  tunniste <- paste(zx, zy, sep = "_")
  pohja$zone_id <- match(tunniste, unique(tunniste))
  pohja$zone_xmin <- xmin + zx * huoltoalue_m
  pohja$zone_ymin <- ymin + zy * huoltoalue_m
  rownames(pohja) <- NULL
  pohja
}
