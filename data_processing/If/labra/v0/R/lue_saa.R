# FMI:n suomenkielinen CSV. Tunnin sisäisten 10 minuutin arvojen aritmeettinen keskiarvo.
lue_saa <- function(polku) {
  d <- read.csv(polku, check.names = FALSE, fileEncoding = "UTF-8-BOM",
                na.strings = c("", "-"))
  aika <- as.POSIXct(sprintf("%04d-%02d-%02d %s", d$Vuosi, d$Kuukausi,
                            d$Päivä, d[["Aika [Paikallinen aika]"]]),
                    format = "%Y-%m-%d %H:%M", tz = "Europe/Helsinki")
  stopifnot(!anyNA(aika), !anyDuplicated(aika),
            all(diff(as.numeric(aika)) == 600))
  tunti <- floor(as.numeric(aika) / 3600) * 3600
  ryhmat <- split(seq_len(nrow(d)), tunti)
  sarakkeet <- c("Ilman lämpötila keskiarvo [°C]", "Lumensyvyys keskiarvo [cm]",
                "Sademäärä keskiarvo [mm]")
  tulos <- data.frame(time_utc = as.POSIXct(as.numeric(names(ryhmat)),
                                          origin = "1970-01-01", tz = "UTC"))
  nimet <- c("temp_c", "snow_cm", "rain_mean_mm")
  for (j in seq_along(sarakkeet)) {
    tulos[[nimet[j]]] <- vapply(ryhmat, function(i) {
      v <- d[[sarakkeet[j]]][i]
      if (all(is.na(v))) NA_real_ else mean(v, na.rm = TRUE)
    }, numeric(1))
  }
  tulos$valid_10min <- vapply(ryhmat, function(i) {
    sum(complete.cases(d[i, sarakkeet]))
  }, integer(1))
  tulos$filled <- !complete.cases(tulos[, nimet])
  # Kokonaan puuttuva tuntiarvo korvataan viimeisellä aiemmalla tuntiarvolla.
  for (nimi in nimet) {
    stopifnot(!is.na(tulos[[nimi]][1]))
    for (i in seq_len(nrow(tulos))[-1]) {
      if (is.na(tulos[[nimi]][i])) tulos[[nimi]][i] <- tulos[[nimi]][i - 1]
    }
  }
  tulos
}
