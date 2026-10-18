# Turku: interaktiivinen data- ja mallikartta

Avaa [index.html](index.html) selaimessa. Se on yksi itsenäinen HTML-tiedosto:
ei verkkokirjastoja, API-avaimia, asennusta tai palvelinta. Datavirta, tarkat
formaatit, mallikokeet ja jatkoideat toimivat samassa tiedostossa.

FMI:n XML-näyte on oikea, ladattu 17.10.2026. Se sisältää Turku Artukaisen
lämpötilan, suhteellisen kosteuden ja tunnin sadekertymän arvoja 10.1.2026
klo 00–02 UTC: yhteensä 9 arvoa. Lähde: Ilmatieteen laitoksen avoin data,
säähavainnot, CC BY 4.0. Tarkka URL, latausaika ja SHA-256 ovat tiedostossa
[fmi-source-metadata.json](examples/fmi-source-metadata.json).

**Mallilaboratorion kaikki syötteet ovat synteettisiä.** Ne eivät käytä
FMI-näytteen arvoja. Ifin sisäistä vahinkoaineistoa ei ole, eikä sen
todellista tietomallia väitetä tunnetuksi. Huolto- ja puhelinaineiston
formaatit ovat ehdotettuja projektin tuontisopimuksia.

| Tiedosto | Tehtävä |
| --- | --- |
| index.html | Rakennettu, itsenäinen käyttöliittymä |
| template.html, explorer.css, explorer.js | Muokattavat käyttöliittymälähteet |
| models.js | Samat puhtaat laskentafunktiot selaimessa ja Nodessa |
| build.py | Esimerkkien, skeemojen, katalogin ja HTML:n rakentaminen |
| catalog.json | Rakennettu datakuvaus ja HTML:ään upotettava aineisto |
| examples/ | Synteettiset JSONL/CSV/GeoJSON-esimerkit ja erillinen oikea FMI-XML |
| schemas/ | JSON Schema 2020-12: yksi JSONL-rivi, CSV:n tyypitetty rivi tai koko GeoJSON |
| run_models.cjs | Komentoriviajo ja JSONL-tulosten vienti |
| test_models.cjs, verify.py | Olennaisten laskentasääntöjen ja esimerkkien tarkistukset |

Hakemiston komennot; riippuvuudet ovat Python 3:n standardikirjasto ja Node.js.
Ulkoisia paketteja ei tarvita.

    python build.py
    node test_models.cjs
    python verify.py
    node run_models.cjs --as-of 2026-01-10T09:00:00Z --cell B2

Viimeinen komento kirjoittaa generated-hakemistoon features.jsonl-,
predictions.jsonl- ja run-metadata.json-tiedostot. Oletusajankohta on klo 08 UTC;
ilman --cell-valintaa ajetaan kaikki ruudut. Esimerkkejä käyttävä ajo on
toistettava: run_id sisältää aikaleiman, malliparametrien, version ja
syötetiedostojen sisältöhashien vaikutuksen.

Omalle saman sopimuksen aineistolle voi antaa --input- ja --output-valinnoilla
omat hakemistot. Syötehakemistossa tarvitaan cells.geojson sekä passages-,
events-, responses-, maintenance-, coverage- ja weather-JSONL-tiedostot.

**Säilytä oma aineisto erillään examples-kansiosta.** Rakentaminen uusii työkalun
generoidut esimerkit, skeemat, catalog.json:n ja index.html:n. Oikeaa FMI-XML:ää
ja sen metadataa rakentaminen vain lukee ja tarkistaa. Se ei tee verkkohakuja.
Muokkaa käyttöliittymää lähdetiedostoissa ja aja rakentaminen uudelleen.

Mallien kohteet ja oletukset:

- **M0:** käsin valittu sääsignaali 0–100. Ei FMI:n säämalli eikä
  kaatumistodennäköisyys. Null-sää säilyy tuntemattomana.
- **M1:** anturirajan ylittävän ohikulun osuus y/n samasta sovellusotoksesta.
  Usea tapahtuma samalla ohikululla kasvattaa tapahtumamäärää mutta ei y:tä.
- **M2:** beta-binomimalli samalle havainto-osuudelle. Oletuspriori
  Beta(1,19), keskiarvo 5 % ja vahvuus 20, on kokeiluasetus.
  95 % väli on mallin posteriorin kvantiiliväli, ei tunnistimen mitattu tarkkuus.
- **M3:** tarkistamiseen ohjaava sääntö. Käyttää vahvistuksia ja M0/M2-tuloksia.
  Raja-arvot ovat demon valintoja. Hiekoitus ei itsessään nollaa havaintoja.

Ikkuna on [t−120 min,t), arviointihetki UTC. Mukaan otetaan valmistuneet
ohikulut exited_at:n mukaan ja vain viimeistään t:ssä saapuneet rivit.
Sovelluksen havaintojen nimittäjäksi ei vaihdeta kaupungin kokonaiskävijämäärää.
Vastaus täydentää olemassa olevaa tapahtumaa; myöhäinen vastaus ei vuoda
aikaisempaan tilannekuvaan. Ulkoiset laskurit ja If-historia eivät ole
nykyisten mallien syötteitä.

verify.py tarkistaa esimerkkien käyttämät JSON Schema -avainsanat ja
projektin avainviitteet; se ei ole yleiskäyttöinen JSON Schema -validaattori.
M2:n laskenta tarkistetaan myös tunnettuja beta-kvantiilien analyyttisiä
arvoja vastaan. Selaimessa tarkistettiin formaatit, mallien parametrien
vaihtaminen, puuttuvan tiedon esitys sekä asettelu 320 ja 736 pikselin leveyksillä.

Kaaviomaiset esimerkkiruudut ovat Turun koordinaateissa; ne eivät ole
virallinen kaupungin aineisto tai tarkka metrinen ruudukko. Kävelijöiden
riippuvuus, anturivirheet ja sovelluksen otanta rajoittavat mallien tulkintaa.
Simuloidut tulokset eivät osoita vaikutusta oikeisiin vahinkoihin.
