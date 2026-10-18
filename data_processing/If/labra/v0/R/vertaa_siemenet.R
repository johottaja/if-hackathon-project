# Näyttää, kuinka paljon tulos muuttuu satunnaissiemenen mukana. Yksi rivi siementä ja politiikkaa kohden.
vertaa_siemenet <- function(pohja, saa, p, siemenet, ytimia = 1) {
  rivit <- parallel::mclapply(siemenet, function(siemen) {
    p$seed <- siemen
    d <- simuloi_tammikuu(pohja, saa, p)$summary
    k <- aggregate(cbind(falls, expected_falls, maintenance_actions) ~ scenario, d, sum)
    data.frame(seed = siemen, k[match(politiikat, k$scenario), ], row.names = NULL)
  }, mc.cores = ytimia)
  do.call(rbind, rivit)
}
