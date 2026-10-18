# Labra v0

Turun kartta, 10 × 10 metrin ruudut ja tammikuun 2026 toistettava simulaatio.
Laskenta on R:ssä. Ruutu on pienin sijaintiyksikkö; tapahtuman koordinaatti on keskipiste.

## Ajo

Riippuvuudet: R, `spatstat`, `png` ja `jsonlite`. Asenna kerran R:ssä:

```r
install.packages(c("spatstat", "png", "jsonlite"), repos = "https://cloud.r-project.org")
```

Linuxissa `png`-paketin kääntäminen tarvitsee libpng-kehitystiedostot.
`setup.R` sisältää vain `library(spatstat)`. Muut paketit kutsutaan nimellään.

Aja repon juuresta:

```sh
cd If/labra/v0
Rscript aja_tammikuu.R
Rscript tarkista.R
Rscript tarkista_tammikuu.R
Rscript tarkista_hyoty.R
```

Avaa `tulokset/tammikuu.html` selaimessa. Tiedosto sisältää kartan ja tulokset;
se toimii ilman palvelinta tai verkkoyhteyttä. Toista, pysäytä tai siirrä aikajanaa.
Yksi askel vastaa yhtä tuntia. Karttojen luvut ovat näytetyn tunnin lopun tilanteita.

Alkuperäinen tasainen arvonta ja sen karttakuva: `Rscript aja.R`.
Se tuottaa `grid.csv`, `true_falls.csv` ja `tulokset/kaatumiset.png`.

## Tiedostot

| Tiedosto tai kansio | Tehtävä |
| --- | --- |
| `asetukset.R` | Aluerajaus ja alkuperäisen tasaisen arvonnan asetukset |
| `tammikuu_asetukset.R` | Tammikuun simulaation oletukset ja satunnaissiemen |
| `aja_tammikuu.R` | Lukee aineistot, laskee vertailun ja kirjoittaa tulokset |
| `R/luo_grid.R` | Luo ruudut ja niiden keskipisteet |
| `R/kohdista_gridiin.R` | Kohdistaa tarkat koordinaatit ruutuihin |
| `R/luo_true_falls.R` | Alkuperäinen tasainen ruutu- ja aika-arvonta |
| `R/piirra_grid.R`, `R/lue_kartta.R` | Staattinen karttakuva ja kartan rajauksen tarkistus |
| `R/lue_saa.R` | Sää-CSV:n luku ja tuntikeskiarvot |
| `R/luo_kulkupohja.R` | Reittien lähellä olevat ruudut ja oletetut kulkemismäärät |
| `R/simuloi_tammikuu.R` | Viiden huoltopolitiikan paritettu simulaatio ja beta-binomiaalinen posteriori |
| `R/vertaa_siemenet.R` | Toistaa vertailun eri satunnaissiemenillä, valinnaisesti rinnakkain |
| `R/kirjoita_toisto.R`, `toisto/` | Tulosten esittäminen selaimessa; ei mallilaskentaa |
| `lataa_kartta.R` | Kartan lataaminen uudelleen, jos aluerajausta muutetaan |
| `tarkista.R`, `tarkista_tammikuu.R`, `tarkista_hyoty.R` | Kohdistuksen, simulaation ja hyödyn kontrollikokeet |
| `data/alkuperainen/` | Ladattu kartta ja käyttäjän toimittama sää-CSV |
| `data/oletukset/reitit.csv` | Käsin hahmotellut esimerkkireitit ja oletetut tuntimäärät |
| `data/johdettu/`, `tulokset/` | Uudelleen tuotettavat tulokset, Gitin ulkopuolella |
| `paperi/` | Mallin matemaattinen kuvaus ja todistukset suomeksi (`paperi_fi.pdf`) ja englanniksi (`paper_en.pdf`), taulukoiden laskenta |
| `aja_demo.R` | Live-demon data (`simulation.json`) ja taustakartta Pito-dashboardin demosivulle |

## Kartta ja sijainti

Rajaus on 300 × 300 metriä VPK-talon ympärillä (Eskelinkatu 5):
E 239280–239580, N 6710600–6710900, ETRS-TM35FIN (EPSG:3067).
`x` on itäkoordinaatti ja `y` pohjoiskoordinaatti metreinä. Ruudukossa on 900 ruutua.
Joki jää rajauksen ulkopuolelle. Sijainnin lähde: [Suomi.fi, Turun VPK](https://www.suomi.fi/palvelut/palvelupiste/turun-vpk-varsinais-suomen-pelastuslaitos/4fbf2d65-d776-4e3b-8bb5-22e978113125).

Taustakartta: [Maanmittauslaitoksen taustakarttasarja Kapsin WMS-palvelusta](https://kartat.kapsi.fi/),
CC BY 4.0. `data/alkuperainen/kartta/turku.json` sisältää lähdeosoitteen,
hakuajan, koordinaatiston, rajauksen ja kuvan tiivisteen. Kartalla on täsmälleen
sama rajaus kuin ruudukolla. Rajauksen muuttamisen jälkeen aja `Rscript lataa_kartta.R`.

`kohdista_gridiin(x, y, grid, ruutukoko_m)` käyttää `luo_grid()`-funktion ruudukkoa.
Syötteen pitää olla EPSG:3067-koordinaatteja. Ruudun minimi kuuluu mukaan ja maksimi
seuraavaan ruutuun. Alueen ulkopuolinen koordinaatti aiheuttaa virheen.
Rajauksen tai ruutukoon muuttaminen voi muuttaa tunnisteita.

## Mitattu sää ja oletettu kulkeminen

Sääkansiossa pitää olla yksi käyttäjän toimittama CSV. Nyt käytössä on
Turku Artukainen 1.–31.1.2026: 4464 kymmenen minuutin aikaleimaa, joista
28:lta puuttuvat sääarvot. Paikallinen aika tulkitaan `Europe/Helsinki`-ajaksi
ja laskennan aika on UTC. Tunteja on 744.

Lämpötilasta, lumensyvyydestä ja sadearvoista lasketaan tunnin aritmeettinen
keskiarvo saatavilla olevista mittauksista. `rain_mean_mm` on keskiarvo,
ei tunnin sadekertymä. `valid_10min` kertoo täydellisten mittausrivien määrän.
Kokonaan puuttuva tuntiarvo korvattaisiin aiemmalla tuntiarvolla ja merkittäisiin
`filled = TRUE`; tässä aineistossa tällaisia tunteja ei ole.

Ohikulut ovat simuloituja. Neljä reittiä on hahmoteltu kartalta käsin;
ne eivät ole virallinen väyläaineisto. Reitin lähellä olevan ruudun kulkeminen
arvotaan Poisson-jakaumasta. Oletettu määrä vaihtelee reitin, kellonajan ja
viikonpäivän mukaan. Kyse on ruutujen ohikuluista, ei yksilöllisten ihmisten määrästä.

Mahdollinen oikea lähde on [Digitrafficin Turun kävely- ja pyöräilylaskentapistedata](https://www.digitraffic.fi/en/road-traffic/#walking-and-cycling-counting-site-values).
Laskentapisteet eivät suoraan kata kaikkia ruutuja. Metatietokysely palautti tässä
ympäristössä HTTP 406; tammikuun laskuridataa ei ole ladattu.

## Mitä simulaatio vertaa

Mallin tarkka matemaattinen kuvaus ja todistus ovat kansiossa `paperi/`.

1. Kaikilla politiikoilla on samat sääolot, ohikulut, piilevä liukkaus ja satunnaisluvut.
2. Jokaisella kulkuruudulla on päivän piilevä liukkaus `L` välillä 0–1. Se arvotaan
   Beta(0.25, 1) -jakaumasta, joka on diskretoitu 40 yhtä todennäköiseen tasoon.
   Neljänneksellä ruuduista `L < 0.004`, joka kuudennella `L > 0.5`. Liukkaus
   arvotaan uudelleen jokaisen paikallisen vuorokauden alussa; `pysyvyys` on
   todennäköisyys, että ruudun edellisen päivän liukkaus säilyy (oletus 0).
3. Liukastumisen todennäköisyys ohikulkua kohti on
   `0.01 × sääkerroin × L × (1 − 0.8 × hiekoitettu)`. Sääkerroin on oma kokeellinen
   sääntö tiedostossa `R/simuloi_tammikuu.R`; sitä ei ole kalibroitu tienpinnan havaintoihin.
4. Kaikki ohikulut havaitaan. Tärinätunnistus havaitsee liukastumisista 80 % ja
   tekee virhehavainnon 0.02 %:ssa muista ohikuluista. Liukastumisista 2 % johtaa kaatumiseen.
5. Huolletaan kaksi 50 × 50 metrin aluetta kuuden tunnin välein: tammikuussa 248
   toimea jokaisessa huoltavassa politiikassa. Hiekoitus vaikuttaa 6 tuntia.
   Päällekkäinen hiekoitus ei ole sallittu: aluetta ei valita, jos sen edellinen
   hiekoitus on vielä voimassa. Todellisia työaikoja, siirtymiä tai kustannuksia ei mallinneta.
6. Politiikat:
   - `ei_huoltoa`: vertailukohta.
   - `aikataulu`: kiertää alueita järjestyksessä.
   - `kulku`: hiekoittaa alueet, joilla odotettu ohikulkumäärä on suurin. Paras
     politiikka, joka ei käytä tärinähavaintoja (paperin lause 1).
   - `tuote`: laskee jokaiselle ruudulle päivän liukkauden posteriorin
     tärinähavainnoista ja ohikuluista (Beta-priori, binomiaalinen havaintomalli)
     ja hiekoittaa alueet, joilla odotettu liukastumisaltistus on suurin.
   - `oraakkeli`: tuntee piilevän liukkauden; alaraja kaatumisille.

   Ohjaus käyttää vain päätöstä edeltäviä tunteja. Piilevä liukkaus on vain
   simulaattorin ja oraakkelin tiedossa.

Kartalla näytetään `aikataulu` ja `tuote`. Väri kertoo viimeisten 12 tunnin
tärinähavainnot samalla asteikolla molemmille. Vihreä rajaus kertoo voimassa
olevan simuloidun hiekoituksen ja H uuden huoltotoimen. Sivulla näkyvät myös
kaikkien politiikkojen kertyneet odotetut kaatumiset.

`vertailu_tunti.csv` sisältää jokaiselle politiikalle toteutuneet ja odotetut
kaatumismäärät sekä huoltotoimien määrän. Odotusarvo lasketaan simulaattorin
todennäköisyyksistä toteutuneilla ohikuluilla ja liukkaudella; se on
yksittäistä arvontaa luotettavampi vertailumittari. Piilevä liukkaus on
tiedostossa `liukkaus_paiva.csv`. Muut tulokset: `saa_tunti.csv`, `kulkupohja.csv`,
`ohikulut.csv`, `tapahtumat_tunti.csv`, `huoltotoimet.csv`, `tammikuu.rds` ja
`ajotiedot.json`. Viimeinen sisältää asetukset, R-version ja syötteiden tiivisteet.

Kaikki huolto on simuloitua: aikatauluvaihtoehto ei kuvaa Turun todellista toimintaa.
Ifin asiakkaita tai euroja ei ole eroteltu. Hyötymittari on odotettujen kaatumisten
erotus samalla toimimäärällä. Yksi ajo ei osoita tuotteen todellista vaikuttavuutta;
vaihda siementä ja oletuksia tuloksen herkkyyden tutkimiseksi.

Hyödyn ehdot ja kontrollit: [HYOTY.md](HYOTY.md).

Paperin tulokset lasketaan uudelleen ja paperit käännetään v0-kansiosta.
Laskenta kestää neljällä ytimellä noin 10 minuuttia; kääntämiseen tarvitaan pdfLaTeX.
Pelkät taulukot saa tallennetuista tuloksista komennolla `Rscript paperi/kirjoita_taulukot.R`.

```sh
Rscript paperi/laske_taulukot.R
paperi/kaanna.sh
```

Esimerkiksi 40 siementä neljällä ytimellä R:ssä v0-kansiosta:

```r
source("aja_tammikuu.R")
source("R/vertaa_siemenet.R")
herkkyys <- vertaa_siemenet(pohja, saa, tammikuu, 1:40, ytimia = 4)
write.csv(herkkyys, "tulokset/herkkyys.csv", row.names = FALSE)
```

## Live-demo

Pito-dashboardin demosivu (`dashboard/demo.html` repossa
[Johottaja/if-hackathon-project](https://github.com/Johottaja/if-hackathon-project))
lukee tämän simulaattorin tuottaman datan. Kun repot ovat rinnakkain, aja v0-kansiosta:

```sh
Rscript aja_demo.R ../../../../if-hackathon-project/dashboard/public/demo
```

Skripti ajaa oletussimulaation (siemen 42), kopioi käännetyt paperit ja kirjoittaa kohdistetun huollon (`tuote`)
kaatumiset, tärinähavainnot ja hiekoitukset sekä aikataulun mukaisen huollon
(`aikataulu`) hiekoitukset. Asiakas- ja If-näkymiä varten mukana ovat myös tuotteen
liukkausarvio (posteriorin odotusarvo) jokaisen tunnin alussa, ruutujen reitit ja
vuorokausirytmi. Kaatumisten esitysminuutit, sijainnit ruudun sisällä ja
tieto siitä, havaitsiko tärinätunnistus kaatumisen, arvotaan erillisellä siemenellä.
Simulaation tulokset eivät siksi muutu. Havaittujen kaatumisten määrä on
hypergeometrinen, koska kaatuminen ja tunnistus ovat liukastumisesta riippumattomia.
Estetyt kaatumiset ja "lisäkaatumiset" lasketaan ruutu-tunneittain yhteisillä
satunnaisluvuilla. Jos `paperi/tulokset.csv` on olemassa, mukaan tulee myös 200 siemenen keskiarvo.

