# PNG:n rajaus tarkistetaan rinnakkaisesta metatietotiedostosta.
lue_kartta <- function(polku, alue) {
  metatiedot <- jsonlite::fromJSON(sub("[.]png$", ".json", polku))
  stopifnot(metatiedot$crs == "EPSG:3067",
            all(unlist(metatiedot$bbox[names(alue)]) == unname(alue)))
  list(kuva = png::readPNG(polku), polku = polku, metadata = metatiedot)
}
