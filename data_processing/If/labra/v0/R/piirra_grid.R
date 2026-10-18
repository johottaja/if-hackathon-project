# Koko aikavälin tapahtumamäärä ruuduittain; nolla on valkoinen.
piirra_grid <- function(grid, true_falls, ruutukoko_m, kartta = NULL) {
  n <- tabulate(match(true_falls$cell_id, grid$cell_id), nbins = nrow(grid))
  varit <- colorRampPalette(c("white", "steelblue4"))(max(n) + 1)
  puoli <- ruutukoko_m / 2
  plot(NA, xlim = range(grid$x) + c(-puoli, puoli),
       ylim = range(grid$y) + c(-puoli, puoli), asp = 1,
       xaxs = "i", yaxs = "i", xlab = "E (m)", ylab = "N (m)",
       main = "Simuloidut kaatumiset / ruutu")
  vari <- varit[n + 1]
  if (!is.null(kartta)) {
    a <- kartta$metadata$bbox
    rasterImage(kartta$kuva, a$xmin, a$ymin, a$xmax, a$ymax)
    vari <- ifelse(n == 0, NA, adjustcolor(vari, alpha.f = 0.7))
    mtext("Maanmittauslaitos, taustakarttasarja / Kapsi, CC BY 4.0", side = 1, line = 4, cex = 0.7)
  }
  rect(grid$x - puoli, grid$y - puoli, grid$x + puoli, grid$y + puoli,
       col = vari, border = adjustcolor("grey50", alpha.f = 0.25))
  legend("topright", legend = 0:max(n), fill = varit, title = "Lukumäärä",
         bg = "white", cex = 0.8)
}
