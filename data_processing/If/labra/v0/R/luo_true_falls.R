# Kiinteä tapahtumamäärä: tasainen ruutujakauma ja riippumaton tasainen aikajakauma.
luo_true_falls <- function(grid, alku, loppu, maara, seed) {
  stopifnot(nrow(grid) > 0, length(maara) == 1, is.finite(maara),
            maara >= 0, maara == floor(maara),
            inherits(alku, "POSIXct"), inherits(loppu, "POSIXct"),
            length(alku) == 1, length(loppu) == 1,
            !is.na(alku), !is.na(loppu), loppu > alku)
  kesto_s <- as.numeric(difftime(loppu, alku, units = "secs"))
  stopifnot(kesto_s == floor(kesto_s),
            as.numeric(alku) == floor(as.numeric(alku)))

  set.seed(seed)
  ruudut <- grid[sample.int(nrow(grid), maara, replace = TRUE), , drop = FALSE]
  ajat <- alku + floor(runif(maara, min = 0, max = kesto_s))
  tulos <- data.frame(
    fall_id = seq_len(maara), ruudut,
    event_at = format(ajat, "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
    is_simulated = rep(TRUE, maara)
  )
  tulos <- tulos[order(tulos$event_at, tulos$fall_id), , drop = FALSE]
  rownames(tulos) <- NULL
  tulos
}
