# Turun liukkauskartta: ehdotus Eliaksen seuraavaksi työpaketiksi

Laadittu 17.10.2026 käyttäjän muistiinpanojen pohjalta. Työvaiheet, mittakaava ja
palveluratkaisut ovat ehdotuksia. Tässä ei ole toteutettua sovellusta tai koottua
mallinnusaineistoa.

Lähtökohtana on käyttäjän rajaus: anturidataa voidaan käyttää tai tapahtumia
simuloida. Anturitunnistimen kehittäminen ei ole tämän työpaketin painopiste.

**Tavoite:** tuota Joonaksen käyttöliittymälle Turkuun sijoittuva, ajassa etenevä
aineisto, jossa sää ja paikalliset havainnot vaikuttavat alueen tilaan. Näytä,
miten havainto johtaa tarkistukseen tai huoltotehtävään. Anna Niilon
hyötyarvioon läpinäkyvät oletukset ja simulaation tulokset.

**Ensimmäinen rajaus:** esimerkiksi Kupittaa–yliopistoalue, 30–80 karttakohdetta
ja 48 tunnin toistettava demoskenaario. Karttakohde voi olla aluksi noin sadan
metrin ruutu tai käsin rajattu kulkuväylän osa. Ruutu soveltuu alueellisen
havainnon näyttämiseen; tietylle kiinteistölle tehtävä huoltoilmoitus tarvitsee
tarkemmin varmennetun kohdistuksen. Rajaus on ehdotus, ei toteutuspäätös.

**1. Sovi käyttöliittymälle annettava tieto ensin.**

Sovi Joonaksen kanssa yksi kohteen tilan kuvaus: kohdetunniste, geometria,
ajankohta, suhteellinen riski-indeksi, näytön vahvuus, perustelut ja huollon
tila. Indeksi 0–100 kuvaa demon suhteellista vaaratasoa; se ei ole
kaatumistodennäköisyys. Huollon erillinen tärkeysjärjestys huomioi lisäksi
kulkemisen määrän, seuraukset ja toimenpiteen mahdollisuuden. Näytön vahvuus
pidetään erillään riskistä: korkea
ennakoitu riski voi perustua vain säähän ja vähäiseen paikallistietoon.

Valmistumisen tunnistaa siitä, että yksi kohde voidaan näyttää kartalla ja sen
värin sekä ehdotetun toiminnan syy voidaan selittää yhdellä lauseella.

**2. Rakenna havaintojen lisäksi vertailupohja.**

Seuraavat ovat ehdotuksia tulevien tiedostojen sisällöksi. Niitä ei ole luotu.

| Aineisto | Yhden rivin tai kohteen merkitys | Olennaiset tiedot |
| --- | --- | --- |
| `areas.geojson` | Yksi karttakohde | Tunniste, geometria, nimi, huollon vastaanottaja ja sen tiedon alkuperä |
| `weather.csv` | Yhden lähteen sääarvo tiettynä aikana | Asema tai ennusteruutu, havainto-/voimassaoloaika, ennusteen julkaisuhetki, saatavilla olevat sääsuureet |
| `observations.csv` | Yksi epäilty tai vahvistettu tapahtuma | Tapahtuma- ja saapumisaika, sijainti, sijainnin tarkkuus, tapahtumatyyppi, anturipisteytys, käyttäjän vastaus, alkuperä |
| `exposure.csv` | Kohteen havaittu kulkeminen aikavälillä | Kohde, aikaväli, havaittujen ohikulkujen määrä; demossa simuloitu |
| `maintenance.csv` | Yksi ilmoitettu huoltotoimi | Kohde, toimenpiteen aika ja kirjausaika, toimityyppi, lähde |
| `claims.csv` | Yksi synteettinen vahinkotapaus | Tapahtuma- ja ilmoitusaika, sijaintitarkkuus, vahinkoluokka, oletettu kustannus |
| `simulation_truth.csv` | Simulaattorin piilossa oleva vertailutieto | Todellinen simuloitu vaarajakso ja huoltotoimen oletettu vaikutus |

Pidä alkuperäiset ladatut anturitiedostot erillään johdetuista tapahtumista.
Kirjaa lähde, lisenssi ja mahdollinen alkuperäisen tallenteen tunniste. Turkuun
siirretyn tallenteen sijainti ja tapahtuma-aika ovat simuloituja, vaikka sen
kiihtyvyyssignaali olisi oikea. Älä laske saman tallenteen kopioita erilliseksi
näytöksi tunnistimen tarkkuudesta. Demon simuloitu toimijatunniste voi auttaa
erottamaan eri kävelijät; se ei ole oikean käyttäjädatan anonymisointiratkaisu.

Ohikulkujen määrä tarvitaan, jotta vilkas paikka ei muutu riskialueeksi vain
suuren tapahtumamäärän vuoksi. Oikeassa palvelussa sovelluksen havaitsemat
ohikulut eivät automaattisesti edusta koko jalankulkijakuntaa. Puuttuva
altistustieto säilytetään puuttuvana, ei nollana.

**3. Hae oikea sää ja lisää siihen simuloitu paikallinen vaihtelu.**

FMI tarjoaa avoimia säähavaintoja ja ennusteita. Aloita Turun historiallisesta
talvijaksosta ja valitse demon aikajaksoksi kiinnostava osa. Tarkista tarjolla
olevat sade- ja lumisuureet ennen niiden sisällyttämistä aineistosopimukseen.
Ilman lämpötila ei ole tienpinnan lämpötila. Yhden aseman arvo ei itsessään
anna sadan metrin sääennustetta.

FMI:n jalankulkusäämallissa huomioidaan usean päivän historiaa ja useita
sääsuureita. Demon yksinkertainen sääpisteytys on oma kokeellinen malli,
ei FMI:n jalankulkuindeksi tai sen toisinto.

Käsittele aikaleimat sisäisesti UTC-ajassa ja näytä käyttäjälle Europe/Helsinki.
Historiallisessa toistossa päätös saa käyttää vain siihen mennessä saapuneita
havaintoja ja jo julkaistuja ennusteita. Myöhempää toteutunutta säätä ei käytetä
menneisyyden ennusteena.

**4. Tee muutama selkeä skenaario.**

- Yhteinen sää nostaa alueen ennakoitua riskiä ennen paikallisia havaintoja.
- Yhdellä kulkuväylällä kertyy usean simuloidun kävelijän havaintoja ja
  vapaaehtoisia vahvistuksia. Tarkistuspyyntö kohdistuu tähän paikkaan.
- Vilkkaalla paikalla on paljon havaintoja mutta vähän tapahtumia ohikulkua
  kohti. Hiljaisemman kohteen havaintotiheys voi olla korkeampi. Huollon
  tärkeysjärjestys huomioi myös kulkemisen määrän ja toimenpiteen hyödyn.
- Portaissa tai puhelimen käsittelyssä syntyy vääriä havaintoja. Käyttäjän
  kielteinen vastaus heikentää tapahtuman näyttöä.
- Hiekoitus kirjataan. Huollon tila muuttuu heti, mutta kohdetta ei julisteta
  turvalliseksi pelkän kuittauksen perusteella. Myöhemmät havainnot täydentävät
  tilannetta, ja havaintojen vähenemää suhteutetaan ohikulkuihin.
- Havaintoja on liian vähän tai ne vanhenevat. Kartta näyttää epävarmuuden.

Pidä simulaattorin vaaratilanne erillään palvelun käyttämistä havainnoista.
Lisää kohinaa, puuttuvia havaintoja ja viiveitä. Käytä tallennettua satunnaissiementä
toistettavuuteen ja muita siemeniä sekä skenaarioita arviointiin. Suoraan omasta
pisteytyssäännöstä tuotettu testiaineisto ei osoita mallin hyödyllisyyttä.

**5. Aloita selitettävästä mallista ja vertaa lisätiedon hyötyä.**

Ensimmäinen versio voi yhdistää sääpisteytyksen, tuoreet tapahtumat, käyttäjien
vahvistukset ja ohikulkujen määrän. Pidä tapahtumien luokat erillään ja vähennä
vanhojen havaintojen painoa. Näytä perustelut pisteen rinnalla.

Vertaa samaa simuloitua maailmaa kolmella tietotasolla: sää; sää ja
paikallishavainnot; sää, paikallishavainnot ja käyttäjän vahvistukset.
Vertailu tehdään samalla huollon kapasiteetilla ja samalla hälytysbudjetilla.
Se selvittää, mistä lisätiedosta on hyötyä ja kannattaako kuluttajalta kysyä.

Tilastollinen jatko voisi olla esimerkiksi hierarkkinen tapahtumataajuuden
malli, jossa ohikulkujen määrä on altistus ja havaintoja jaetaan varovasti
lähellä olevien kohteiden kesken. Väärät anturihavainnot ja puuttuvat tapahtumat
tarvitsevat oman käsittelynsä, ennen kuin havaintotaajuutta tulkitaan
liukastumisriskiksi. Aluksi suhteellinen tärkeysjärjestys riittää.

Mittaa simulaatiossa vaarakohteen löytämisviivettä, turhia huoltopyyntöjä,
löydettyjä vaarajaksoja samalla tehtävämäärällä ja kuluttajalle lähetettyjen
kysymysten määrää. Vahinkojen tai eurojen vähentyminen on tässä vaiheessa
simulaation oletuksista riippuva tulos, ei todistettu vaikutus Turussa.

**6. Anna muille konkreettinen luovutuspaketti.**

Joonakselle sopii GeoJSON- tai JSON-tilannekuva eri ajanhetkiltä, yksi
aikajanalla toistettava skenaario ja lyhyt kenttäkuvaus. Niilolle sopii
hyötylaskelman rakenne: tavoitettu altistus, lähtöriski, toimenpiteen oletettu
vaikutus, Ifin nettokustannus vältettyä vahinkoa kohti ja palvelun kustannukset.
Luvut ja niiden alkuperä erotetaan oletuksista. Rakenne ei lukitse tiimin työnjakoa.

Ensimmäiseksi valmistuva kokonaisuus voisi olla yksi ilta ja seuraava aamu:
säämuutos, paikallinen havaintorypäs, huollon tarkistuspyyntö, kirjattu hiekoitus
ja myöhempi tilannekuva.

**Kuluttajan vastine ja kysymisen logiikka.**

Ehdotettu hyöty on omaan valittuun alueeseen tai lähtöaikaan liittyvä tieto ja
mahdollisuus saada havaittu vaarapaikka huollon tietoon. Oma alue voidaan
valita käsin, joten jokaisen palvelun käyttäjän ei tarvitse kerätä anturidataa.
Kerääjälle annettava hyöty pitää silti testata käyttäjillä.

Yksi vapaaehtoinen kysymys voisi olla: ”Oliko kulkuväylä liukas?” Vastaukset:
kyllä, ei, en osaa sanoa. Kysy silloin, kun vastaus voi muuttaa kohteen
luokitusta tai toimintaa; vastaamatta jättäminen ei tarkoita kielteistä vastausta.
Kysymys voidaan näyttää myöhemmin kävelyn jälkeen. Demossa verrataan
esimerkiksi kyselymäärän ylärajaa ja sen tuottamaa lisähyötyä.

Ehdotus ilmoituksille: käyttäjän valitsema aamun yhteenveto vain merkittävän
riskin päivinä, tarvittaessa paikallinen päivitys muuttuneesta tilanteesta ja
kartta omaan tarkasteluun. Huollon vastaanottajalle kuuluu kohdistettu tehtävä.

**Ifin rooli ja jatkoideat.**

If voisi välittää havaintoja asiakkaan nykyiselle huollolle ja hyödyntää
havaintojen sekä huoltotoimien aikajanaa vahinkoselvityksen tukena. ”If
hiekoittaa” tai vakuutukseen sisältyvä kiinteistöhuolto on uusi tuotehypoteesi;
tässä selvityksessä sellaista nykyetua ei ole varmennettu. Mahdollisessa
kumppanimallissa palvelulaajuus, kustannus ja toteuttaja täytyy sopia erikseen.

Kesän kuopat ja epätasaisuudet voisivat käyttää samaa karttaa ja tehtävien
käsittelyä. Havaintotavan toimivuus arvioidaan erikseen. Myös märät lehdet
olisivat luonteva jatkoskenaario jalankulun liukkaudelle. Elämäntilannekulma
voisi olla ensimmäinen talvi uudella asuinalueella tai uuden työmatkan varrella.

5090 sopii myöhempiin opittavien aikasarjamallien kokeisiin, jos niille tulee
tarve ja sopivaa aineistoa. Tämän työpaketin sääliitokset, paikkatieto ja pieni
simulaatio voidaan toteuttaa CPU:lla. Aikataulun kannalta tärkein tuotos on
selitettävä aineisto ja vertailu.

**Mitä Ifiltä kannattaa selvittää.**

Julkisessa liukastumisselvityksessä kysytään muun muassa tarkkaa osoitetta,
olosuhteita ja ilmoittamista kunnossapidolle. Yrityksen vastuuvahinko-ohjeessa
kysytään myös edeltäviä liukkaudentorjuntatoimia ja niiden päivää sekä
kellonaikaa. Julkinen lomake ei osoita, että nämä tiedot olisivat kaikissa
tuotteissa samassa, analyysivalmiissa tietokannassa.

- Onko paikka koordinaatti, osoite, postinumero vai vapaa teksti, ja kuinka
  monessa tapauksessa tapahtumapaikka tunnetaan?
- Tunnetaanko tapahtuman kellonaika erillään ilmoituspäivästä?
- Ovatko liukastuminen, kompastuminen ja muu kaatuminen eroteltavissa?
- Voiko työmatka- ja vastuuvakuutuksissa olla samaan tapahtumaan liittyviä
  tietoja, ja miten päällekkäisyydet tunnistetaan?
- Mitä aggregoitua Turun aineistoa voidaan antaa, miltä ajalta ja millä viiveellä?
- Mitä huolto- tai kunnossapitotietoa Ifillä ja sen kumppaneilla on käytettävissä?

**Varmennetut lähteet ja saatavuusrajat, tarkistettu 17.10.2026.**

- [FMI:n avoin data](https://www.ilmatieteenlaitos.fi/avoin-data) ja
  [WFS-pikaohje](https://www.ilmatieteenlaitos.fi/latauspalvelun-pikaohje).
  Suora havaintokysely Turkuun ajalle 10.1.2026 00 UTC–11.1.2026 00 UTC,
  parametrilla `t2m` ja 60 minuutin askeleella, palautti HTTP 200 ja 25
  aikapistettä asemalta Turku Artukainen. Tämä tarkistus koski lämpötilaa.
- [FMI:n jalankulkusäämalli](https://www.ilmatieteenlaitos.fi/jalankulkusaamalli).
  Säämallin kuvaus; avoimen datan käyttö ei itsessään tarkoita mallin
  jalankulkuindeksin olevan saatavilla avoimena aineistona.
- [FMI:n liukkauspalvelu](https://www.ilmatieteenlaitos.fi/liukkauspalvelu).
  Kunnille ja yrityksille on jo olemassa liukkausvaroituspalvelu.
- [Turun kartat ja paikkatieto](https://www.turku.fi/tietoa-turusta/kartat-ja-paikkatieto).
  Kaupunki kuvaa avoimet karttarajapinnat sekä palvelukartan liikenteen
  laskentapisteet ja päivittyvät kunnossapitotiedot. Yksittäisen aineiston
  koneluettava saatavuus ja kattavuus on tarkistettava. Tässä ympäristössä
  WFS GetCapabilities -pyyntö palautti HTTP 403; toimivaa datalatausta ei
  siten vahvistettu. Tämä ei osoita rajapinnan olevan kaikille suljettu.
- [Turun talvikunnossapidon kuvaus](https://www.turku.fi/talvi-ei-paase-yllattamaan-turussa-nain-valmistaudumme-talvikunnossapitoon).
  Palvelukartalla esitetään viime päivien aurausta ja hiekoitusta. Vastuut
  jakautuvat kaupungin ja kiinteistönomistajien kesken. Koko kartan
  ominaisuuksia ei pidä olettaa saataviksi saman avoimen rajapinnan kautta.
- [If: selvitys liukastumisesta](https://www.if.fi/yritysasiakkaat/ilmoita-vahingosta/henkilovahinko/ammattitauti/selvitys-liukastumisesta) ja
  [yrityksen vastuuvahingon ohje](https://www.if.fi/yritysasiakkaat/ilmoita-vahingosta/vastuuvahinko).
  Julkiset tiedonkeruun esimerkit; sisäistä vakuutusdataa ei ole saatu.
