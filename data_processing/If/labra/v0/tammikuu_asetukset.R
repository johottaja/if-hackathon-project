# Kaikki alla olevat luvut ovat simulaation oletuksia.
tammikuu <- list(
  seed = 42,
  liukkaus_a = 0.25,            # Ruudun piilevä liukkaus L ~ Beta(a, b) välillä 0–1.
  liukkaus_b = 1,               # a = 0.25, b = 1: neljännes ruuduista L < 0.004, joka kuudes L > 0.5.
  liukkaustasoja = 40,          # Beta diskretoidaan yhtä todennäköisiin tasoihin; 1 poistaa vaihtelun.
  pysyvyys = 0,                 # Todennäköisyys, että ruudun liukkaus säilyy seuraavaan päivään.
  kulkeminen_satunnainen = TRUE,
  liukastuminen_p = 0.01,       # Liukastuminen ohikulkua kohti, kun L = 1 ja sääkerroin = 1.
  kaatuminen_liukastumisesta_p = 0.02,
  tunnistus_p = 0.8,            # Tärinätunnistus havaitsee liukastumisen.
  virhehavainto_p = 0.0002,     # Tärinätunnistus hälyttää ohikulussa ilman liukastumista.
  havaintoikkuna_h = 12,        # Vain kartan väritys; ohjaus käyttää koko posteriorijakaumaa.
  huoltovali_h = 6,
  huoltokohteita = 2,
  huoltoalue_m = 50,
  huollon_kesto_h = 6,          # Vaikutusaika ≤ huoltoväli: todistuksen ehto, ks. paperi/.
  huollon_teho = 0.8
)
