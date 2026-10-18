# Paperin herkkyysasetelmat: muutos oletusasetuksiin, siemenet ja nimet kummallakin kielellä.
asetelmat <- list(
  list(muutos = list(), siemenet = 1:200, fi = "Oletus ($\\rho = 0$)", en = "Default ($\\rho = 0$)"),
  list(muutos = list(pysyvyys = 0.5), siemenet = 1:100, fi = "$\\rho = 0{,}5$", en = "$\\rho = 0.5$"),
  list(muutos = list(pysyvyys = 0.9), siemenet = 1:100, fi = "$\\rho = 0{,}9$", en = "$\\rho = 0.9$"),
  list(muutos = list(liukkaustasoja = 1), siemenet = 1:100, fi = "Ei vaihtelua ($G = 1$)", en = "No variation ($G = 1$)"),
  list(muutos = list(tunnistus_p = 0.0002), siemenet = 1:100, fi = "Ei erottelua ($\\eta = \\varepsilon$)",
       en = "No discrimination ($\\eta = \\varepsilon$)"),
  list(muutos = list(huollon_kesto_h = 12), siemenet = 1:100, fi = "$H = 12 > \\Delta$", en = "$H = 12 > \\Delta$")
)
