# Ohjeet AI-agenteille

Nämä ohjeet koskevat koko repositoriota. Noudata myös mahdollisia hakemistokohtaisia
`AGENTS.md`-tiedostoja. Käyttäjän nimenomainen tehtävänanto ohjaa työtä.

## Konteksti ja viestintä

- Tämä on Eliaksen henkilökohtainen hackathon-repositorio. Älä oleta, että se on tiimin yhteinen repo.
- Lue juuren `README.md` sekä tehtävään liittyvät lähteet ennen muutoksia.
- Vastaa oletuksena suomeksi. Säilytä lähdeaineistojen nimet ja tekniset tunnisteet alkuperäisessä muodossa.
- Erota varmennetut tiedot, oletukset ja ehdotukset toisistaan. Älä esitä avoimia valintoja päätettyinä.
- Pidä dokumentaatio ajantasaisena ja tiiviinä. Kirjaa päätökset vasta, kun ne on tehty.
- AI-palveluja saa käyttää tarpeen mukaan; kaikkien palvelujen käyttöä ei edellytetä.

## Muutosten tekeminen

- Tarkista aluksi Git-tila ja tunnista olemassa olevat paikalliset muutokset.
- Rajaa muokkaukset annettuun tehtävään. Säilytä käyttäjän ja muiden työkalujen keskeneräinen työ.
- Suosi yksinkertaista, tehtävään riittävää toteutusta. Älä lisää riippuvuuksia tai työkaluja ilman tarvetta.
- Noudata olemassa olevia käytäntöjä. Kun toteutus puuttuu, älä keksi asennuskomentoja tai teknologiavalintoja valmiiksi.
- Kun lisäät ajettavaa koodia, dokumentoi tarvittavat riippuvuudet ja todelliset suorituskomennot.
- Käytä rinnakkaiseen tiedostojen muokkaukseen erillisiä työkopioita tai Git-worktree-kansioita.

## Aineistot ja lähteet

- Säilytä alkuperäiset PDF- ja CSV-aineistot muuttamattomina, ellei tehtävä nimenomaisesti vaadi niiden muokkaamista.
- Lue `tyx-mylab/data/README.md` ennen kyseisen aineiston analysointia.
- Huomioi aineistokuvauksen rajoitukset ja dokumentoi käytetyt suodatukset, liitokset ja laskentasäännöt.
- Tallenna johdetut aineistot ja tulokset erilleen alkuperäisistä. Tee analyysista toistettava tarvittavilta osin.
- Älä esitä synteettiseen aineistoon perustuvia havaintoja todellisia potilaita tai sairaaloita koskevina tuloksina.
- Viittaa olennaiseen lähdetiedostoon tai ulkoiseen lähteeseen, kun sen tieto vaikuttaa johtopäätökseen.
- Älä lisää repoon API-avaimia, salasanoja tai muita salaisuuksia.

## Tarkistaminen ja Git

- Tarkista muutosten diffi ja aja muutokseen sopivat saatavilla olevat tarkistukset.
- Käytä olemassa olevia testejä, jos ne liittyvät muutokseen. Lisää testejä, kun ne varmistavat olennaista toimintaa.
- Dokumentaatiomuutoksissa tarkista erityisesti väitteet, tiedostopolut ja komennot.
- Kerro lopuksi, mitä muutit, miten tarkistit tuloksen ja mitä jäi mahdollisesti varmistamatta.
- Lisää committiin vain tehtävään kuuluvat tiedostot. Älä sisällytä muita paikallisia muutoksia.
- Tee commit tai push käyttäjän pyynnön tai aiemman valtuutuksen perusteella.
- Älä kirjoita Git-historiaa uudelleen tai käytä force pushia ilman nimenomaista pyyntöä.
