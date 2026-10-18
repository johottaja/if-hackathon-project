# If-haasteen tausta-aineistot

Koottu 16.10.2026 Ifin virallisilta verkkosivuilta. Tarkoitus on tukea haasteeseen
tutustumista, ratkaisujen ideointia ja lähteisiin perustuvaa prototyypin rakentamista.
Tämä kansio ei lukitse projektin pääideaa tai teknologiavalintoja.

## Aloita näistä

| Aineisto | Sisältö |
| --- | --- |
| [Alkuperäinen haastekuvaus](If%20Challenge%20description.pdf) | Hackathonin tehtävänanto ja arviointikriteerit |
| [Vakuutusehdot ja oppaat](contracts/README.md) | 12 ehtodokumenttia, viisi opasta ja kolme IPID-tuotetietoa |
| [Tulosraportit](business/reports/README.md) | If Holdingin vuosikertomukset 2023–2025, H1/2026-väliraportti ja If helps a lot Q2/2026 |
| [Liiketoimintamallin kuvaus](business/businessmodel/README.md) | Suomenkielinen lähteistetty yhteenveto, virallisten verkkosivujen kopiot ja kunnossapitosuunnitelman malliraportti |
| [Avoimen datan lähteet](research/README.md) | Ideointiin sopivia virallisia tietolähteitä ja niiden käytännön rajoituksia |
| [Lähdeluettelo](SOURCES.md) | Jokaisen ladatun alkuperäislähteen paikallinen polku ja verkko-osoite |
| [Koneluettava lähdeluettelo](sources.json) | Hakuajat, lähdeosoitteet, tiedostokoot, SHA-256-tiivisteet ja tekstiversioiden polut |

## Aineiston rakenne

- Alkuperäiset PDF-tiedostot on tallennettu muuttamattomina.
- Tekstiä sisältävien PDF-tiedostojen `text/`-alihakemistoissa on `pdftotext -layout` -tekstipoiminnat.
  Sivunvaihdot on säilytetty. Sarakkeiden lukujärjestys ja taulukot on tarvittaessa
  tarkistettava alkuperäisestä PDF:stä.
- Kunnossapitosuunnitelman malliraportti on kuva-PDF ilman poimittavaa tekstikerrosta.
  Sen koneluettava käsittely vaatisi OCR:n tai kuvamallin; tyhjää tekstiversiota ei ole tallennettu.
- Verkkosivujen `sources/`-alihakemistoissa on HTML-kopiot sekä pääsisällöstä poimitut
  TXT-versiot. HTML-kopiot ovat lähdearkistoa; ulkoiset kuvat ja tyylit eivät sisälly niihin.
- Avoimen datan osalta on kerätty kuvaukset ja linkit. Varsinaisia kartta-, sää- tai
  tilastoaineistoja ei ole ladattu kokonaisuudessaan.

## Lähteiden tulkinta

Ehdot, tuoteoppaat ja yksittäisen asiakkaan vakuutuskirja ovat eri asioita.
Tallennetut ehdot ovat hakupäivänä Ifin julkisesta ehtoluettelosta linkitettyjä versioita;
ne eivät yksin osoita, mitä jonkun olemassa oleva vakuutus sisältää.

If Holdingin raportit kuvaavat If-konsernia, eivät koko Sampo-konsernia tai pelkkää
Suomen liiketoimintaa. Topdanmarkin mukaan tulo vaikuttaa vuosien vertailuun.
Raporttikansion yhteenveto avaa tämän tarkemmin.

Lähteiden julkinen saatavuus ei yksin tarkoita avointa uudelleenjulkaisulisenssiä.
Aineisto on kerätty taustatyöskentelyä varten. Avoimen datan käyttölupa ja lähdemerkinnät
tarkistetaan erikseen käytetyn aineiston mukaan.
