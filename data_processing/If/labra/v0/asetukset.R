# VPK-talon ympäristö, 300 × 300 m. ETRS-TM35FIN (EPSG:3067), metrejä.
alue <- c(xmin = 239280, xmax = 239580, ymin = 6710600, ymax = 6710900)
ruutukoko_m <- 10

alku <- as.POSIXct("2026-01-10 06:00:00", tz = "UTC")
loppu <- as.POSIXct("2026-01-10 18:00:00", tz = "UTC")
maara <- 100
seed <- 42
