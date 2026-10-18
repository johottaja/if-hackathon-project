# Mihin simuloitu hyöty perustuu?

Täsmällinen malli, oletukset ja todistukset: [paperi/paperi_fi.pdf](paperi/paperi_fi.pdf), englanniksi [paperi/paper_en.pdf](paperi/paper_en.pdf).
Tämä tiedosto tiivistää ne.

Ruudun päivän piilevä liukkaus `L` vaihtelee voimakkaasti ruuduittain ja päivittäin.
Tapahtumat arvotaan toisistaan riippumattomina **ehdolla**, että liukkaus, sää,
kulkeminen ja huoltotila tunnetaan. Saman päivän aiemmat tärinähavainnot kertovat
siksi ruudun loppupäivän liukkaudesta. Yksi liukastuminen ei aiheuta seuraavaa.

Odotettu kaatumismäärä ruudussa tunnilla on

```
ohikulut × 0.01 × sääkerroin × L × (1 − 0.8 × hiekoitettu) × 0.02
```

Koska päällekkäinen hiekoitus on kielletty, jokainen ruutu-tunti on enintään yhden
hiekoituksen piirissä. Silloin politiikan hyöty jakautuu summaksi huoltokierroksittain.

## Mitä paperissa todistetaan

Oletusasetuksilla vaikutusaika on enintään huoltoväli ja huoltokierrokset alkavat
vuorokauden vaihteessa. Silloin odotusarvoissa pätee:

1. `kulku` on paras politiikka, joka ei käytä tärinähavaintoja; esimerkiksi
   `aikataulu` ei voi olla sitä parempi.
2. `tuote` on vähintään yhtä hyvä kuin mikä tahansa havaintoja käyttämätön politiikka.
3. `oraakkeli` on vähintään yhtä hyvä kuin mikä tahansa politiikka.
4. `tuote` on aidosti `kulku`a parempi, jos tunnistus erottelee liukastumiset
   virhehavainnoista (`tunnistus_p > virhehavainto_p`), liukkaus vaihtelee ja
   jollakin päivän kierroksella on saman päivän havaintoja.

Ilman liukkauden vaihtelua tai erottelevaa tunnistusta havainnoista ei ole hyötyä.
Väitteet koskevat simulaattorin maailmaa. Turun todellista liukkautta,
hiekoituksen vaikutusta tai Ifin vahinkoja ei ole mitattu.

## Kontrollit

`Rscript tarkista_hyoty.R` asettaa kaikille ruuduille saman liukkauden ja saman
kulkemisen. Kontrolli tarkistaa kymmenellä siemenellä, että kaikkien huoltavien
politiikkojen odotettu kaatumismäärä on sama.

`Rscript tarkista_tammikuu.R` tarkistaa muun muassa, että beta-binomiaalinen
päivitys vastaa suoraan laskettua posterioria, että täydellisellä tunnistuksella
saadaan konjugaatti Beta(a + y, b + n − y), ettei päällekkäistä hiekoitusta synny
pidemmälläkään vaikutusajalla ja ettei tuleva sää vaikuta menneisiin päätöksiin.
