# Avoin data ja muut viralliset taustalähteet

Lähdesivut tarkistettu 16.10.2026. Tämä on ideointia tukeva lähdekartta, ei ladattu
datakokoelma tai valmis integraatio. Viranomaisen neuvontasivu ei välttämättä ole
avoin, koneluettava datasetti; erot on merkitty alle.

| Lähde | Saatavilla oleva tieto ja mahdollinen käyttö | Käytännön huomio |
| --- | --- | --- |
| [Ilmatieteen laitoksen avoin data](https://www.ilmatieteenlaitos.fi/avoin-data) | Sää-, meri- ja ilmastohavainnot, ennusteet ja varoitukset; muuton, autoilun ja mökin käytön olosuhteet | Rajaa alue ja ajanjakso; sääilmiön yleisyys ei ole vakuutusvahingon todennäköisyys |
| [Maanmittauslaitoksen ortokuvat ja korkeusmallit](https://www.maanmittauslaitos.fi/ortokuvien-ja-korkeusmallien-kyselypalvelu) | Ilmakuvat ja korkeusmalli 2 m; maaston vietto, pinnanmuodot ja ympäristön tarkastelu | WCS vaatii henkilökohtaisen API-avaimen; aineiston lähdemerkintä CC BY 4.0 -ehtojen mukaan |
| [Syken paikkatietorajapinnat](https://www.syke.fi/fi/ymparistotieto/avoimet-rajapinnat/paikkatietorajapinnat) | Muun muassa tulvariskialueet ja tulvavaaravyöhykkeet; paikan altistumisen tarkastelu | Tarkista aineiston maantieteellinen kattavuus ja tulvatyyppi; jokitulva ei kuvaa kaikkia hulevesiongelmia. Latausrajapintojen pidempiaikaiseen tai kuormittavaan käyttöön pyydetään sovellustunniste |
| [Digitraffic, tieliikenne](https://www.digitraffic.fi/en/road-traffic/) | Tiesää, olosuhteet, liikenteen tiedotteet ja kamerat; autoilun ja muuttomatkan valmistelu | Kameroiden kattavuus on paikallinen; nykydata ja historia ovat eri aineistoja |
| [Traficomin katsastustilastot](https://tieto.traficom.fi/fi/tilastot/katsastustilasto) | Auton iän ja mallisarjan mukaiset katsastustulokset ja yleiset hylkäyssyyt | Mallikohtaiseen julkaisuun vähintään 100 katsastustapahtumaa; ajomäärät vaihtelevat. Katsastushylkäys ei ole vahinko- tai korjauskustannustodennäköisyys |
| [Tilastokeskuksen Paavo](https://stat.fi/fi/palvelut/tilastodatapalvelut/tilastotietokannat/paavo) | Postinumeroalueiden asuminen, kotitaloudet ja väestörakenne; alueiden kuvaus ja vertailuryhmät | Aluetason tieto ei kuvaa yksittäistä ihmistä tai rakennusta; luokitusvuosi ja tilastovuosi pitää erottaa |
| [Tilastokeskuksen kotitalouksien kulutus](https://stat.fi/fi/tilasto/ktutk) | Kotitaloustyyppien kulutuksen vertailut; yhteenmuuton tai omilleen muuton budjettiskenaariot | Keskiarvo ei ole henkilökohtainen ennuste; tutkimusvuosi ja hintataso on huomioitava |
| [Ulkoministeriön matkustustiedotteet](https://um.fi/matkustustiedotteet-a-o) | Viralliset maakohtaiset matkustusohjeet; ensimmäisen pitkän ulkomaanmatkan valmistelu | Julkista viranomaissisältöä; sisältö on päivittyvää eikä sitä pidä nimetä valmiiksi avoimeksi riskitodennäköisyysdataksi |
| [Tukes: turvallinen koti lapselle](https://tukes.fi/koti-ja-vapaa-aika/lasten-lelut-ja-tuotteet) | Viranomaisohjeita lapsiperheen kodin vaarojen tunnistamiseen | Neuvontasisältöä, ei kuvantunnistusmallin opetusdataa; kuvan havainto on tarkistettava. Sivun kuvaus löytyi virallisesta hakutuloksesta, mutta suora sivunavaus ei onnistunut käytetyllä verkkotyökalulla |
| [Ifin kodin turvallisuus](https://www.if.fi/henkiloasiakkaat/vakuutukset/kotivakuutus/kodin-turvallisuus) | Ifin oma ehkäisyneuvonta ja nykyiset palvelut | Taustalähde ja vertailukohta idean uutuudelle; ei avoin tilastoaineisto |

## Tarkistetut metatietorajapinnat

Seuraavat kolme HTTP-pyyntöä palauttivat onnistuneen vastauksen 16.10.2026 ilman
kirjautumista. Tarkistus koski metatietojen saatavuutta; varsinaista mallinnusdataa
ei vielä koottu tai laadunvarmistettu.

- [FMI WFS GetCapabilities](https://opendata.fmi.fi/wfs?service=WFS&request=GetCapabilities)
- [Digitraffic tiesääasemien metatiedot](https://tie.digitraffic.fi/api/weather/v1/stations)
- [Paavo PxWeb API:n juuri](https://pxweb2.stat.fi/PxWeb/api/v1/fi/Postinumeroalueittainen_avoin_tieto/)

Tarkistusten tekninen yhteenveto on tiedostossa
[open-data-access-checks.json](open-data-access-checks.json).

## Tilastollinen rajaus

Alueellinen altistuminen, sääilmiön toistuvuus, katsastushylkäysten yleisyys ja
vakuutusvahingon todennäköisyys ovat eri suureita. Ensimmäisiä voidaan kuvata
julkisista aineistoista. Viimeisen luotettava kalibrointi vaatisi myös sopivaa
vahinko- ja altistusdataa, jota tässä kokoelmassa ei ole.

Prototyypissä voidaan näyttää perusteltuja havaintoja, vertailuja ja epävarmuutta
sekä pyytää käyttäjältä olennaiset puuttuvat tiedot. Käyttöliittymän väitteiden
tarkkuuden on vastattava käytetyn aineiston tarkkuutta.
