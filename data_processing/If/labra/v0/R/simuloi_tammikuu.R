# Paritettu vertailu: sama sää, kulkeminen, piilevä liukkaus ja satunnaisluvut kaikille politiikoille.
# Mallin ja todistuksen merkinnät: paperi/paperi_fi.tex (englanniksi paper_en.tex).

politiikat <- c("ei_huoltoa", "aikataulu", "kulku", "tuote", "oraakkeli")

# Beta(a, b) jaetaan G:hen yhtä todennäköiseen väliin. Taso on välin ehdollinen
# odotusarvo, joten tasojen keskiarvo on täsmälleen a / (a + b).
liukkaustasot <- function(a, b, G) {
  stopifnot(a > 0, b > 0, length(G) == 1, G >= 1, G == round(G))
  rajat <- qbeta(seq(0, 1, length.out = G + 1), a, b)
  a / (a + b) * diff(pbeta(rajat, a + 1, b)) * G
}

saakerroin <- function(saa) {
  0.7 + 1.2 * (saa$temp_c >= -3 & saa$temp_c <= 1) + 0.6 * (saa$snow_cm > 0) +
    0.5 * (saa$rain_mean_mm > 0 & saa$temp_c < 1)
}

# Beta-binomiaalinen päivitys: tasojen log-painoihin lisätään tunnin binomiuskottavuus.
# q[c, g] on liukastumisen todennäköisyys ohikulkua kohti, jos ruudun taso on g.
paivita_posteriori <- function(logw, havainnot, ohikulut, q, p) {
  theta <- p$virhehavainto_p + (p$tunnistus_p - p$virhehavainto_p) * q
  logw <- logw + dbinom(havainnot, ohikulut, theta, log = TRUE)
  mx <- logw[cbind(seq_len(nrow(logw)), max.col(logw, ties.method = "first"))]
  logw - mx - log(rowSums(exp(logw - mx)))
}

simuloi_tammikuu <- function(pohja, saa, p) {
  n <- nrow(pohja)
  nt <- nrow(saa)
  nz <- max(pohja$zone_id)
  S <- length(politiikat)
  K <- p$huoltokohteita
  H <- p$huollon_kesto_h
  stopifnot(nz >= K * ceiling(H / p$huoltovali_h), p$huollon_teho >= 0, p$huollon_teho <= 1,
            p$pysyvyys >= 0, p$pysyvyys <= 1, p$virhehavainto_p <= p$tunnistus_p)
  set.seed(p$seed)
  tasot <- liukkaustasot(p$liukkaus_a, p$liukkaus_b, p$liukkaustasoja)
  G <- length(tasot)
  mu <- mean(tasot)
  kerroin <- saakerroin(saa)
  pii <- p$liukastuminen_p * kerroin
  stopifnot(max(pii) * max(tasot) <= 1)

  tunti <- as.integer(format(saa$time_utc, "%H", tz = "Europe/Helsinki"))
  viikonpaiva <- as.integer(format(saa$time_utc, "%u", tz = "Europe/Helsinki"))
  rytmi <- (0.1 + 0.8 * exp(-((tunti - 8) / 2)^2) +
              0.9 * exp(-((tunti - 17) / 3)^2)) * ifelse(viikonpaiva >= 6, 0.7, 1)
  pvm <- format(saa$time_utc, "%Y-%m-%d", tz = "Europe/Helsinki")
  paiva <- match(pvm, unique(pvm))

  L <- numeric(n)
  logw <- matrix(-log(G), n, G)   # tuotteen posteriori; muut politiikat eivät käytä havaintoja
  tuore <- lapply(seq_len(S), function(i) matrix(0L, n, p$havaintoikkuna_h))
  huollettu <- matrix(-Inf, nz, S)
  seuraava <- 0L
  aikaleima <- format(saa$time_utc, "%Y-%m-%dT%H:%M:%SZ", tz = "UTC")
  kehykset <- vector("list", nt)
  kooste <- matrix(0, nt * S, 5, dimnames = list(NULL, c("passages", "observations", "falls",
                                                          "expected_falls", "maintenance_actions")))
  ohikulkumatriisi <- matrix(0L, n, nt)
  posteriori <- matrix(0, n, nt)   # tuotteen liukkausarvio kunkin tunnin alussa (demoa varten)
  huolto <- tapahtumat <- piilo <- list()

  for (t in seq_len(nt)) {
    if (t == 1 || paiva[t] != paiva[t - 1]) {
      # Päivän piilevä liukkaus: säilyy todennäköisyydellä pysyvyys, muuten arvotaan uudelleen.
      sailyy <- runif(n) < p$pysyvyys & t > 1
      L <- ifelse(sailyy, L, tasot[sample.int(G, n, replace = TRUE)])
      logw <- log(p$pysyvyys * exp(logw) + (1 - p$pysyvyys) / G)
      piilo[[pvm[t]]] <- L
    }
    posteriori[, t] <- drop(exp(logw) %*% tasot)
    odotetut_ohikulut <- pohja$ohikulkuja_h * rytmi[t]
    ohikulut <- if (p$kulkeminen_satunnainen) rpois(n, odotetut_ohikulut) else round(odotetut_ohikulut)
    u <- matrix(runif(n * 4), ncol = 4)
    slotti <- (t - 1) %% p$havaintoikkuna_h + 1
    kierros <- (t - 1) %% p$huoltovali_h == 0
    if (kierros) {
      # Odotettu altistus vaikutusaikana. Sää on ikkunan sisällä kaikille ruuduille yhteinen
      # tekijä, joten sitä ei tarvita järjestykseen; seuraavan päivän liukkaus palautuu kohti mu:ta.
      ikkuna <- t:min(nt, t + H - 1)
      A0 <- sum(rytmi[ikkuna])
      A1 <- sum(rytmi[ikkuna] * p$pysyvyys^(paiva[ikkuna] - paiva[t]))
      alueittain <- function(m) as.numeric(rowsum(pohja$ohikulkuja_h * (mu * A0 + (m - mu) * A1),
                                                  pohja$zone_id))
    }
    kehys <- list()

    for (s in seq_len(S)) {
      kohteet <- integer(0)
      if (kierros && politiikat[s] != "ei_huoltoa") {
        vapaa <- t - huollettu[, s] >= H   # päällekkäinen hiekoitus ei ole sallittu
        if (politiikat[s] == "aikataulu") {
          jarjestys <- (seuraava + seq_len(nz) - 1) %% nz + 1
          kohteet <- head(jarjestys[vapaa[jarjestys]], K)
          seuraava <- kohteet[K]
        } else {
          m <- switch(politiikat[s], kulku = rep(mu, n), tuote = drop(exp(logw) %*% tasot),
                      oraakkeli = L)
          piste <- alueittain(m)
          piste[!vapaa] <- -Inf
          kohteet <- head(order(-piste, seq_len(nz)), K)
        }
        stopifnot(length(kohteet) == K, all(vapaa[kohteet]))
        huollettu[kohteet, s] <- t
        huolto[[length(huolto) + 1]] <- list(s = rep(s, K), t = rep(t, K), zone_id = kohteet)
      }
      voimassa <- t - huollettu[pohja$zone_id, s] < H
      suoja <- 1 - p$huollon_teho * voimassa
      todennakoisyys <- pii[t] * L * suoja
      liuk <- qbinom(u[, 1], ohikulut, todennakoisyys)
      kaatumiset <- qbinom(u[, 2], liuk, p$kaatuminen_liukastumisesta_p)
      tunnistetut <- qbinom(u[, 3], liuk, p$tunnistus_p)
      havainnot <- tunnistetut + qbinom(u[, 4], ohikulut - liuk, p$virhehavainto_p)
      if (politiikat[s] == "tuote") {
        logw <- paivita_posteriori(logw, havainnot, ohikulut, outer(pii[t] * suoja, tasot), p)
      }
      tuore[[s]][, slotti] <- havainnot
      kehys[[s]] <- list(havainnot = I(as.integer(rowSums(tuore[[s]]))),
                         huoltoalueet = I(which(t - huollettu[, s] < H)),
                         uudet = I(kohteet))
      kooste[(t - 1) * S + s, ] <- c(sum(ohikulut), sum(havainnot), sum(kaatumiset),
        sum(ohikulut * todennakoisyys * p$kaatuminen_liukastumisesta_p), length(kohteet))
      mukana <- which(havainnot > 0 | kaatumiset > 0)
      tapahtumat[[length(tapahtumat) + 1]] <- list(s = rep(s, length(mukana)),
                                                   t = rep(t, length(mukana)), i = mukana,
                                                   havainnot = havainnot[mukana],
                                                   kaatumiset = kaatumiset[mukana],
                                                   liukastumiset = liuk[mukana],
                                                   tunnistetut = tunnistetut[mukana])
    }
    ohikulkumatriisi[, t] <- ohikulut
    kehykset[[t]] <- kehys
  }
  # Taulukot kootaan vasta lopuksi; data.framen luonti silmukassa hidastaisi ajoa moninkertaisesti.
  kentta <- function(lista, nimi) unlist(lapply(lista, `[[`, nimi))
  list(policies = politiikat, frames = kehykset,
       summary = data.frame(scenario = rep(politiikat, nt), time_utc = rep(aikaleima, each = S),
                            kooste, is_simulated = TRUE),
       maintenance = data.frame(scenario = politiikat[kentta(huolto, "s")],
                                time_utc = aikaleima[kentta(huolto, "t")],
                                zone_id = kentta(huolto, "zone_id"), is_simulated = TRUE),
       events = data.frame(scenario = politiikat[kentta(tapahtumat, "s")],
                           time_utc = aikaleima[kentta(tapahtumat, "t")],
                           cell_id = pohja$cell_id[kentta(tapahtumat, "i")],
                           observations = kentta(tapahtumat, "havainnot"),
                           falls = kentta(tapahtumat, "kaatumiset"),
                           slips = kentta(tapahtumat, "liukastumiset"),
                           detected_slips = kentta(tapahtumat, "tunnistetut"), is_simulated = TRUE),
       passages = data.frame(time_utc = rep(aikaleima, each = n), cell_id = pohja$cell_id,
                             passages = c(ohikulkumatriisi), is_simulated = TRUE),
       slipperiness = data.frame(date = rep(names(piilo), each = n), cell_id = pohja$cell_id,
                                 slipperiness = unlist(piilo, use.names = FALSE), is_simulated = TRUE),
       posterior_start = posteriori, rhythm = rytmi, levels = tasot, weather_factor = kerroin)
}
