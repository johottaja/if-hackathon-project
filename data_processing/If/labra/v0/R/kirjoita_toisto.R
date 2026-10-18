# Pakkaa R:n laskemat tulokset ja kartan yhteen selaimella avattavaan tiedostoon.
kirjoita_toisto <- function(tulos, pohja, saa, alue, ruutukoko_m, p, kartta, polku) {
  kuva <- readBin(kartta$polku, "raw", n = file.info(kartta$polku)$size)
  vyohykkeet <- unique(pohja[, c("zone_id", "zone_xmin", "zone_ymin")])
  data <- list(
    area = as.list(alue), cellSize = ruutukoko_m, blockSize = p$huoltoalue_m,
    window = p$havaintoikkuna_h, params = p, policies = tulos$policies,
    cells = pohja[, c("cell_id", "x", "y")], zones = vyohykkeet,
    times = paste0(format(saa$time_utc, "%d.%m.%Y %H:%M", tz = "Europe/Helsinki"),
                   "–", format(saa$time_utc + 3600, "%H:%M", tz = "Europe/Helsinki")),
    weather = saa[, c("temp_c", "filled", "valid_10min")],
    frames = tulos$frames, summary = tulos$summary,
    map = gsub("\n", "", jsonlite::base64_enc(kuva)),
    mapDate = substr(kartta$metadata$retrieved_at, 1, 10)
  )
  html <- readLines("toisto/pohja.html", encoding = "UTF-8")
  lisa <- function(teksti, merkki, sisalto) {
    i <- match(merkki, teksti)
    c(head(teksti, i - 1), sisalto, tail(teksti, length(teksti) - i))
  }
  html <- lisa(html, "@@CSS@@", readLines("toisto/toisto.css", encoding = "UTF-8"))
  html <- lisa(html, "@@DATA@@", paste0("const D = ",
               jsonlite::toJSON(data, auto_unbox = TRUE, digits = 5), ";"))
  html <- lisa(html, "@@JS@@", readLines("toisto/toisto.js", encoding = "UTF-8"))
  writeLines(html, polku, useBytes = TRUE)
}
