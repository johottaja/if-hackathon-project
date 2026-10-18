# Aja tarvittaessa uudelleen, jos muutat aluerajausta. Vaatii verkkoyhteyden.
source("asetukset.R")
polku <- "data/alkuperainen/kartta/turku.png"
bbox <- paste(alue[c("xmin", "ymin", "xmax", "ymax")], collapse = ",")
url <- paste0("https://tiles.kartat.kapsi.fi/taustakartta?SERVICE=WMS&VERSION=1.1.1",
              "&REQUEST=GetMap&LAYERS=taustakartta&STYLES=&SRS=EPSG:3067",
              "&BBOX=", bbox, "&WIDTH=1000&HEIGHT=1000&FORMAT=image/png")
download.file(url, polku, mode = "wb")
invisible(png::readPNG(polku)) # Tarkista, että vastaus on PNG.
metadata <- list(source_url = url, retrieved_at = format(Sys.time(), tz = "UTC", usetz = TRUE),
                 provider = "Maanmittauslaitos / Kapsi", dataset = "Taustakarttasarja",
                 license = "CC BY 4.0", license_url = "https://creativecommons.org/licenses/by/4.0/",
                 crs = "EPSG:3067", bbox = as.list(alue), width = 1000, height = 1000,
                 md5 = unname(tools::md5sum(polku)))
jsonlite::write_json(metadata, sub("[.]png$", ".json", polku), auto_unbox = TRUE, pretty = TRUE)
