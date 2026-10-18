"""Build the offline explorer, explicit contracts and reproducible demo fixtures.

Python standard library only. Never downloads data automatically.
"""
from pathlib import Path
import csv
import datetime as dt
import hashlib
import io
import json
import math
import shutil
import subprocess
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
EXAMPLES = ROOT / "examples"
SCHEMAS = ROOT / "schemas"


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def write_jsonl(name, rows):
    (EXAMPLES / name).write_text("".join(json.dumps(row, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n" for row in rows), encoding="utf-8")


def at(hour, minute=0):
    return f"2026-01-10T{hour:02d}:{minute:02d}:00Z"


def field(name, kind, description, nullable=False, unit=None, **rules):
    schema = {"type": [kind, "null"] if nullable else kind, "description": description, **rules}
    return {"name": name, "type": kind, "nullable": nullable, "unit": unit or "—", "description": description, "schema": schema}


def timestamp(name, description, nullable=False):
    return field(name, "string", description, nullable, "UTC", format="date-time", pattern=r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$")


def obj_schema(fields, title):
    return {"$schema": "https://json-schema.org/draft/2020-12/schema", "title": title, "type": "object", "properties": {f["name"]: f["schema"] for f in fields}, "required": [f["name"] for f in fields], "additionalProperties": False}


PROVENANCE = [field("source_id", "string", "Viite source_registry.jsonl-tiedoston source_id:hen."),
              field("is_simulated", "boolean", "Tämän rivin mittausarvot on simuloitu.")]
INGEST = timestamp("ingested_at", "Hetki, jolloin tämä rivi saapui palveluun. Ei sama kuin tapahtuma-aika.")


def dataset(id_, title, filename, fields, grain, pk, joins, source, status, raw_format, notes):
    return dict(id=id_, title=title, filename=filename, fields=fields, grain=grain, primary_key=pk,
                joins=joins, source=source, status=status, raw_format=raw_format, notes=notes)


def create_fixtures():
    EXAMPLES.mkdir(exist_ok=True)
    SCHEMAS.mkdir(exist_ok=True)
    cells = []
    # Explicit synthetic lon/lat rectangles; not a surveyed 100-m grid.
    for index in range(16):
        row, col = divmod(index, 4)
        west, south = 22.28 + col * .0018, 60.45 - row * .0009
        ring = [[round(x, 7), round(y, 7)] for x, y in [(west, south), (west+.0018, south), (west+.0018, south+.0009), (west, south+.0009), (west, south)]]
        cell_id = "ABCD"[row] + str(col+1)
        cells.append({"type": "Feature", "id": cell_id, "properties": {"cell_id": cell_id, "grid_version": "demo-v1", "is_simulated": True}, "geometry": {"type": "Polygon", "coordinates": [ring]}})
    write_json(EXAMPLES / "cells.geojson", {"type": "FeatureCollection", "features": cells})
    passages, events, responses, coverage, weather = [], [], [], [], []
    hourly_n = [16,24,20,0,30,60,35,8,20,40,28,16,3,12,18,0]
    counts = {"A2": 1, "B1": 2, "B2": 4, "B3": 1, "C2": 3, "D1": 1}
    centers = {}
    for feature in cells:
        cid = feature["id"]
        ring = feature["geometry"]["coordinates"][0]
        centers[cid] = ((ring[0][0]+ring[1][0])/2, (ring[0][1]+ring[2][1])/2)
        index = "ABCD".index(cid[0])*4 + int(cid[1])-1
        coverage.append({"cell_id": cid, "app_collection_status": "missing" if cid == "D4" else "complete", "source_id": "demo-coverage", "is_simulated": True})
        for hour in range(5, 10):
            n = max(1, round(hourly_n[index] * (0.6 if hour == 5 else 1))) if cid != "D4" and hourly_n[index] else 0
            for j in range(n):
                minute = 1 + int(57*j/max(n, 1))
                pid = f"p-{cid}-{hour:02d}-{j:03d}"
                passages.append({"passage_id": pid, "cell_id": cid, "entered_at": at(hour, max(0, minute-1)), "exited_at": at(hour, minute), "ingested_at": at(hour, minute), "complete": True, "source_id": "demo-app", "is_simulated": True})
                is_candidate = hour in (7, 8) and j < counts.get(cid, 0)
                if is_candidate:
                    eid = f"e-{cid}-{hour:02d}-{j:03d}"
                    lon, lat = centers[cid]
                    events.append({"event_id": eid, "passage_id": pid, "event_at": at(hour, minute), "ingested_at": at(hour, minute), "lon": round(lon, 7), "lat": round(lat, 7), "accuracy_m": 12.0, "sensor_score": round(.76 + .04*(j % 4), 2), "score_kind": "uncalibrated_score", "trace_id": "demo-trace-001", "source_id": "demo-sensor", "is_simulated": True})
                    if cid in ("B1", "B2", "D1") and j < 2:
                        answer = "slip"
                    elif cid == "C2":
                        answer = "no_event"
                    else:
                        answer = None
                    if answer:
                        # One deliberately delayed confirmation.
                        answer_hour = hour+1 if cid == "B1" and hour == 7 and j == 1 else hour
                        answer_minute = min(59, minute+3)
                        responses.append({"response_id": "r-"+eid, "event_id": eid, "answer": answer, "fall_occurred": False if answer == "slip" else None, "answered_at": at(answer_hour, answer_minute), "ingested_at": at(answer_hour, answer_minute), "source_id": "demo-response", "is_simulated": True})
        for hour in range(7, 11):
            weather.append({"cell_id": cid, "evaluation_at": at(hour), "window_start": "2026-01-09T"+f"{hour:02d}:00:00Z", "air_temp_c": {7:1,8:-1,9:-2,10:-1}[hour], "rain_24h_mm": 2.0, "min_temp_24h_c": -3.0, "max_temp_24h_c": 2.0, "warning_active": None, "ingested_at": at(hour), "source_id": "demo-weather", "is_simulated": True})
    # Duplicate-looking sensor pulses on one passage: two events, one positive passage.
    original = next(e for e in events if e["event_id"] == "e-B2-07-000")
    events.append({**original, "event_id": original["event_id"]+"-second-pulse", "sensor_score": .95})
    maintenance = [{"action_id": "a-B2-001", "cell_id": "B2", "site_id": "demo-site-B2", "action": "gritting", "started_at": at(8,20), "completed_at": at(8,30), "ingested_at": at(8,31), "coverage_fraction": 1.0, "target_verified": True, "source_id": "demo-maintenance", "is_simulated": True}]
    # A second phase contains observations AFTER the known gritting time.
    for j in range(2):
        pid=f"p-B2-post-{j}"
        passages.append({"passage_id":pid,"cell_id":"B2","entered_at":at(8,39+j*5),"exited_at":at(8,40+j*5),"ingested_at":at(8,40+j*5),"complete":True,"source_id":"demo-app","is_simulated":True})
        eid=f"e-B2-post-{j}"
        lon,lat=centers["B2"]
        events.append({"event_id":eid,"passage_id":pid,"event_at":at(8,40+j*5),"ingested_at":at(8,40+j*5),"lon":round(lon,7),"lat":round(lat,7),"accuracy_m":12.0,"sensor_score":.91,"score_kind":"uncalibrated_score","trace_id":"demo-trace-001","source_id":"demo-sensor","is_simulated":True})
        responses.append({"response_id":"r-"+eid,"event_id":eid,"answer":"slip","fall_occurred":False,"answered_at":at(8,42+j*5),"ingested_at":at(8,42+j*5),"source_id":"demo-response","is_simulated":True})
    data = {"passages":passages,"events":events,"responses":responses,"maintenance":maintenance,"coverage":coverage,"weather":weather}
    for name,rows in data.items():
        write_jsonl(name+".jsonl",rows)
    counts_rows=[{"counting_site_id":"demo-counter-1","interval_start":at(7),"interval_end":at(8),"travel_mode":"pedestrian","count":800,"lon":22.28,"lat":60.45,"ingested_at":at(8,5),"source_id":"demo-external-counter","is_simulated":True}]
    write_jsonl("external_counts.jsonl", counts_rows)
    claims=[{"claim_case_id":"DEMO-CLAIM-001","occurred_on":"2025-02-01","occurred_at":None,"reported_at":"2025-02-03T10:00:00Z","location_precision":"postcode","postal_code":"20520","lon":None,"lat":None,"cause":"slip","incurred_cost_eur":None,"source_id":"demo-claim","is_simulated":True}]
    write_jsonl("claims.jsonl",claims)
    raw_sensor = "recording_id,timestamp_utc,ax_m_s2,ay_m_s2,az_m_s2,gx_rad_s,gy_rad_s,gz_rad_s\n"
    raw_sensor += "demo-trace-001,2026-01-10T07:01:00.000Z,0.15,-0.12,9.79,0.01,0.00,-0.01\n"
    raw_sensor += "demo-trace-001,2026-01-10T07:01:00.020Z,0.40,-0.25,10.20,0.02,0.01,-0.01\n"
    (EXAMPLES/"sensor_raw.csv").write_text(raw_sensor,encoding="utf-8")
    return data


def normalize_fmi():
    ns={"om":"http://www.opengis.net/om/2.0","gml":"http://www.opengis.net/gml/3.2","wml":"http://www.opengis.net/waterml/2.0"}
    raw=(EXAMPLES/"fmi-source.xml").read_bytes()
    metadata=json.loads((EXAMPLES/"fmi-source-metadata.json").read_text())
    assert hashlib.sha256(raw).hexdigest()==metadata["sha256"]
    root=ET.fromstring(raw)
    rows=[]
    for member in root.findall("{http://www.opengis.net/wfs/2.0}member"):
        prop=member.find(".//om:observedProperty",ns).attrib["{http://www.w3.org/1999/xlink}href"]
        parameter=parse_qs(urlparse(prop).query)["param"][0]
        station=next(e.text for e in member.findall(".//gml:identifier",ns) if e.attrib.get("codeSpace","").endswith("/fmisid"))
        station_name=next(e.text for e in member.findall(".//gml:name",ns) if e.attrib.get("codeSpace","").endswith("/name"))
        lat,lon=map(float,member.find(".//gml:pos",ns).text.split())
        for point in member.findall(".//wml:MeasurementTVP",ns):
            value=float(point.findtext("wml:value",namespaces=ns))
            rows.append({"station_id":station,"station_name":station_name,"lon":lon,"lat":lat,"observed_at":point.findtext("wml:time",namespaces=ns),"parameter":parameter,"value":value if math.isfinite(value) else None,"unit":{"t2m":"degC","rh":"%","r_1h":"mm"}[parameter],"available_at":None,"downloaded_at":metadata["retrieved_at"][:19]+"Z","source_id":"fmi-observations-sample","is_simulated":False})
    write_jsonl("weather_observations.jsonl",rows)
    source_rows=[]
    for source_id,description in [
        ("demo-coverage","Keruun kattavuuden synteettinen tilatieto"),
        ("demo-app","Synteettiset sovelluksessa havaitut ohikulut"),
        ("demo-sensor","Synteettiset tapahtumaehdokkaat; raakamuoto on erillinen havainnollistus"),
        ("demo-response","Synteettiset käyttäjävastaukset"),
        ("demo-maintenance","Synteettiset huoltotoimet"),
        ("demo-weather","Synteettinen 24 h säätausta, ei johdettu FMI-näytteestä"),
        ("demo-external-counter","Synteettinen esimerkki ulkoisen laskurin omasta normalisoinnista"),
        ("demo-claim","Kuvitteellinen Ifille ehdotettava aineistorivi")]:
        source_rows.append({"source_id":source_id,"kind":"simulated","description":description,"native_format":"Projektin oma JSONL-esimerkki","source_url":None,"license":"Projektin synteettinen esimerkki","retrieved_at":None,"is_simulated":True})
    source_rows.append({"source_id":"fmi-observations-sample","kind":"observed","description":"Ilmatieteen laitoksen avoin data, Turku Artukaisen säähavainnot","native_format":"WFS 2.0 / WaterML 2.0 XML","source_url":metadata["source_url"],"license":"CC BY 4.0","retrieved_at":metadata["retrieved_at"][:19]+"Z","is_simulated":False})
    write_jsonl("source_registry.jsonl",source_rows)
    return rows,metadata


def catalog():
    ds=[]
    ds.append(dataset("sources","Lähderekisteri","source_registry.jsonl",[
        field("source_id","string","Lähteen pääavain; muiden rivien source_id viittaa tähän."),
        field("kind","string","Lähteen luonne.",enum=["observed","simulated","proposed"]),
        field("description","string","Mitä lähde sisältää."),
        field("native_format","string","Alkuperäinen tai tässä esimerkissä generoitu muoto."),
        field("source_url","string","Alkuperäinen osoite, jos tiedossa.",True),
        field("license","string","Käyttöehdon kuvaus; ei luvan korvike."),
        timestamp("retrieved_at","Latausaika, jos oikea lähde on ladattu.",True),
        field("is_simulated","boolean","Lähteen arvot ovat simuloituja.")],
        "Yksi rivi = yksi nimetty tietolähde.","source_id","Muiden tapahtuma- ja taustarivien source_id → source_id","Projektin alkuperäkirjanpito.","Oma sopimus · lähdeviitteet tarkistettu","JSON Lines","FMI-näytteen tarkka SHA-256 ja mikrosekuntitarkka latausaika säilyvät myös erillisessä fmi-source-metadata.json-tiedostossa. Lähteet ja niistä johdetut tapahtumat pidetään erillään."))
    ds.append(dataset("cells","Ruutugeometria","cells.geojson",[
        field("type","string","GeoJSON-ylätason tyyppi.",const="FeatureCollection"),
        field("features","array","Feature-oliot: id = properties.cell_id. Polygonin ensimmäinen ja viimeinen piste samat. Koordinaatit [pituusaste, leveysaste], WGS 84.",items={"type":"object","required":["type","id","properties","geometry"],"properties":{"type":{"const":"Feature"},"id":{"type":"string"},"properties":{"type":"object","required":["cell_id","grid_version","is_simulated"],"properties":{"cell_id":{"type":"string"},"grid_version":{"type":"string"},"is_simulated":{"type":"boolean"}},"additionalProperties":False},"geometry":{"type":"object","required":["type","coordinates"],"properties":{"type":{"const":"Polygon"},"coordinates":{"type":"array","items":{"type":"array","minItems":4,"items":{"type":"array","minItems":2,"maxItems":2,"items":{"type":"number"}}}}},"additionalProperties":False}},"additionalProperties":False})],
        "Yksi Feature = yksi ruutu.","features[].properties.cell_id","cell_id → passages, weather, maintenance","Itse muodostettu; tuotannossa Turun kartta-aineisto auttaa alueen rajauksessa.","Oma ehdotus · synteettinen esimerkki","GeoJSON (RFC 7946)","Esimerkin suorakulmiot sijaitsevat Turun koordinaateissa. Ne eivät ole kaupungin aineistoa tai tarkka metrinen 100 m ruudukko. GeoJSON:ssa ei käytetä erillistä crs-jäsentä."))
    ds.append(dataset("observations","Oikea FMI-lähdenäyte","weather_observations.jsonl",[
        field("station_id","string","FMI:n fmisid merkkijonona."),field("station_name","string","Havaintoaseman nimi."),
        field("lon","number","Pituusaste.",unit="degree",minimum=-180,maximum=180),field("lat","number","Leveysaste.",unit="degree",minimum=-90,maximum=90),
        timestamp("observed_at","Mittauksen ajankohta."),
        field("parameter","string","FMI-parametri.",enum=["t2m","rh","r_1h"]),
        field("value","number","Mittausarvo. XML:n NaN muunnetaan nulliksi. Parametrikohtaiset muut erikoisarvot vaativat erillisen tarkistuksen.",True),
        field("unit","string","Projektin yksikkömerkintä: t2m → degC, rh → %, r_1h → mm.",enum=["degC","%","mm"]),
        timestamp("available_at","Todellinen ensimmäinen saatavuusaika; historiallisesta latauksesta tuntematon.",True),
        timestamp("downloaded_at","Tämän näytteen latausaika."),*PROVENANCE],
        "Yksi rivi = yksi asema, aika ja suure.","station_id + observed_at + parameter","Paikka/asema ja aika → ruudun sääpiirteet","FMI WFS 2.0 / WaterML 2.0, oikea ladattu XML.","Oikea näyte · HTTP 200 · 9 arvoa","XML: wfs:FeatureCollection → wfs:member → wml2:MeasurementTVP","Mukana t2m, rh ja r_1h, Turku Artukainen 10.1.2026 klo 00–02 UTC. GML:n tässä vastauksessa pos on lat lon; GeoJSON käyttää lon lat. Mallilaboratorio käyttää erillistä synteettistä säätaustaa. available_at puuttuu: latausaikaa ei teeskennellä historialliseksi julkaisuajaksi."))
    ds.append(dataset("sensor","Anturin raakamuoto","sensor_raw.csv",[
        field("recording_id","string","Tallenteen tunniste; trace_id viittaa tähän."),
        timestamp("timestamp_utc","Näytteen ajankohta. Esimerkissä 20 ms askel = 50 Hz."),
        *[field(axis+"_m_s2","number","Laitteen "+axis+"-akselin kiihtyvyys; tässä sopimuksessa painovoima mukana.",unit="m/s²") for axis in ["ax","ay","az"]],
        *[field(axis+"_rad_s","number","Kulmanopeus; tyhjä CSV-kenttä tarkoittaa puuttuvaa gyroskooppia.",True,"rad/s") for axis in ["gx","gy","gz"]]],
        "Yksi rivi = yksi anturinäyte.","recording_id + timestamp_utc","recording_id ↔ events.trace_id","Valitsemanne anturidatasetti; tätä alkuperäistä formaattia ei ole toimitettu.","Oma tuontisopimus · synteettinen esimerkki","Lähteen todellinen sarakejärjestys, aikayksikkö ja akselit selvitetään datasetistä.","Tämä EI ole väite minkään tietyn netistä löytyvän datasetin sarakkeista. Muunna lähteen g-yksikkö m/s²:ksi tarvittaessa ja säilytä tieto painovoiman sisältymisestä. Raakasignaalia ei käytetä näissä malleissa."))
    ds.append(dataset("passages","Havaitut ohikulut","passages.jsonl",[
        field("passage_id","string","Yhden täydellisen ruudun läpikulun tunniste. Ei henkilön tunniste."),field("cell_id","string","Viite cells-ruutuun."),
        timestamp("entered_at","Ohikulun alku."),timestamp("exited_at","Ohikulun loppu; tämän mukaan tarkasteluikkuna valitaan."),INGEST,
        field("complete","boolean","Vain valmistuneet ohikulut ovat mallin n:ssä."),*PROVENANCE],
        "Yksi rivi = yksi sovelluksessa havaittu ohikulku yhden ruudun läpi.","passage_id","cell_id → cells; events.passage_id → passage_id","Oma puhelinsovellus tai simulaattori.","Oma sopimus · toteutettu demo","JSON Lines, UTF-8","n = eri passage_id:t, joiden exited_at ∈ [t−120 min,t), complete=true ja ingested_at ≤ t. Kaupungin kokonaiskävijämäärää ei käytetä tämän otoksen nimittäjänä."))
    ds.append(dataset("events","Anturin tapahtumaehdokkaat","events.jsonl",[
        field("event_id","string","Yksilöity tapahtuma; identtinen kopio poistetaan."),
        field("passage_id","string","Viite havaittuun ohikulkuun."),timestamp("event_at","Poikkeaman ajankohta."),INGEST,
        field("lon","number","Tapahtuman pituusaste.",unit="degree",minimum=-180,maximum=180),field("lat","number","Tapahtuman leveysaste.",unit="degree",minimum=-90,maximum=90),
        field("accuracy_m","number","Paikannuksen ilmoitettu tarkkuus; ei deterministinen virheraja.",unit="m",minimum=0),
        field("sensor_score","number","Anturiluokittimen pisteytys; ei kaatumistodennäköisyys.",minimum=0,maximum=1),
        field("score_kind","string","Pisteytyksen tulkinta.",const="uncalibrated_score"),
        field("trace_id","string","Viite raw sensor recording_id:hen."),*PROVENANCE],
        "Yksi rivi = yksi anturitapahtuma. Ohikululla voi olla useita.","event_id","passage_id → passages; event_id → responses","Oma tapahtumatulkinta valmiista aineistosta tai simulaatio.","Oma sopimus · toteutettu demo","JSON Lines, UTF-8","y = niiden n:ään kuuluvien ohikulkujen määrä, joilla on vähintään yksi sensor_score ≥ raja. Useat heilahdukset samalla ohikululla kasvattavat tapahtumamäärää mutta eivät y:tä. Epätarkka sijainti on käsiteltävä ennen kohteen varmistamista."))
    ds.append(dataset("responses","Käyttäjän vastaukset","responses.jsonl",[
        field("response_id","string","Vastauksen tunniste."),field("event_id","string","Viite olemassa olevaan tapahtumaan."),
        field("answer","string","Itse ilmoitettu tapahtumatyyppi.",enum=["slip","trip","other","no_event","unsure"]),
        field("fall_occurred","boolean","Kaaduttiinko? Eri asia kuin liukastuminen. null = ei tietoa.",True),
        timestamp("answered_at","Vastauksen antamishetki."),INGEST,*PROVENANCE],
        "Yksi rivi = yksi vastaus tai korjattu vastaus tapahtumaan.","response_id","event_id → events","Oma palvelu tai simulaatio.","Oma sopimus · toteutettu demo","JSON Lines, UTF-8","Arviointihetkellä käytetään viimeisintä jo saapunutta vastausta. Tasatilanne ratkaistaan ingested_at:n ja response_id:n mukaan. M1 ja M2 kuvaavat sensorirajan ylittäviä ohikulkuja: kielteinen vastaus ei muuta niiden kohdemuuttujaa. M3 käyttää vahvistuksia erikseen."))
    ds.append(dataset("maintenance","Toteutuneet huoltotoimet","maintenance.jsonl",[
        field("action_id","string","Toimenpiteen tunniste."),field("cell_id","string","Kohteen ruutu."),field("site_id","string","Varmennettu kulkuväylä tai huoltokohde."),
        field("action","string","Toimenpiteen tyyppi.",enum=["gritting","plowing","inspection"]),
        timestamp("started_at","Toimenpiteen alku."),timestamp("completed_at","Toteutuneen toimenpiteen loppu."),INGEST,
        field("coverage_fraction","number","Varmennetun kohteen peitto-osuus, ei automaattisesti koko ruutu.",minimum=0,maximum=1),
        field("target_verified","boolean","Onko kohdistus kyseiseen demokohteeseen varmistettu?"),*PROVENANCE],
        "Yksi rivi = yksi toteutunut toimenpide.","action_id","cell_id → cells; site_id → jatkossa erillinen kohdeluettelo","Kaupunki/huoltoyhtiö. Niiden todellista vientimuotoa ei ole saatu.","Oma normalisointi · synteettinen","Lähdekohtainen, toistaiseksi tuntematon","Mallin viimeisin hiekoitus edellyttää target_verified=true ja coverage_fraction ≥ 0.8. Raja on demo-oletus. Tehtävän luominen ei ole sama kuin tehty hiekoitus. Tuotannossa saman ruudun eri kohteet erotellaan; demossa yksi kohde per ruutu."))
    ds.append(dataset("weather","Mallin sääpiirteet","weather.jsonl",[
        field("cell_id","string","Ruutu, johon säätausta on kohdistettu."),timestamp("evaluation_at","Piirteiden arviointihetki."),
        timestamp("window_start","24 tunnin taustaikkunan alku."),
        field("air_temp_c","number","Viimeisin soveltuva ilman lämpötila.",True,"°C"),
        field("rain_24h_mm","number","24 h sadekertymä, vain kattavasta jaksosta.",True,"mm",minimum=0),
        field("min_temp_24h_c","number","24 h lämpötilaminimi.",True,"°C"),field("max_temp_24h_c","number","24 h lämpötilamaksimi.",True,"°C"),
        field("warning_active","boolean","Alueellinen jalankulkusäävaroitus; null = ei haettua tietoa.",True),INGEST,*PROVENANCE],
        "Yksi rivi = ruutu ja arviointihetki.","cell_id + evaluation_at","Sääaseman/hilan ja varoitusalueen kohdistus → cell_id","Johdettu FMI:stä; tässä vain synteettinen valmis piirre-esimerkki.","Johdettu sopimus · synteettinen demo","Oma JSONL; lähdehavainnot XML, varoitukset CAP/Atom","Normaalisoinnista puuttuu vielä tuotanto-adapteri. Sama asemadata voi kohdistua useaan ruutuun. Ilman lämpötila ei ole tienpinnan lämpötila. Demo ei kouluta tai validoi säämallia."))
    ds.append(dataset("coverage","Keruun kattavuus","coverage.jsonl",[
        field("cell_id","string","Ruutu."),field("app_collection_status","string","Demossa koko toiston kattava kiinteä keruun tila.",enum=["complete","missing","unknown"]),*PROVENANCE],
        "Yksi rivi = ruudun keruun tilanne koko demon ajaksi.","cell_id","cell_id → cells","Oman keruun diagnostiikka / simulaatio.","Oma sopimus · synteettinen","JSON Lines","missing tai unknown → mallien n ja y ovat null. complete + ei yhtään ohikulkua → n=0. Tuotannossa tämä on ajassa päivittyvä kattavuusloki, ei pysyvä ruudun ominaisuus."))
    ds.append(dataset("counters","Ulkoiset kävijälaskurit","external_counts.jsonl",[
        field("counting_site_id","string","Laskentapisteen tunniste."),timestamp("interval_start","Mittausjakson alku, mukana."),timestamp("interval_end","Mittausjakson loppu, ei mukana."),
        field("travel_mode","string","Mitattu kulkutapa.",enum=["pedestrian","bicycle","mixed"]),
        field("count","integer","Ohitusten määrä, ei välttämättä yksilöiden määrä.",True,minimum=0),
        field("lon","number","Pisteen pituusaste.",unit="degree"),field("lat","number","Pisteen leveysaste.",unit="degree"),INGEST,*PROVENANCE],
        "Yksi rivi = laskentapiste, aikaväli ja kulkutapa.","counting_site_id + interval_start + interval_end + travel_mode","Pisteen geometria; älä levitä automaattisesti ympäristön ruutuihin.","Digitraffic counting-site/v2 tai Turun palvelukartta.","Dokumentoitu lähde · oma esimerkkimuoto","Rajapintojen metatiedot GeoJSON; arvoille JSON ja CSV. Kenttiä ei vahvistettu tästä ympäristöstä.","Tämä on ehdotettu normalisointi, EI kopio varmennetusta Digitraffic-vastauksesta. Aiemmat koepyynnöt HTTP 406. Ei syötteenä M1/M2:n nimittäjään; otos ja koko jalankulkijakunta ovat eri joukkoja."))
    ds.append(dataset("claims","If:n vahinkohistoria","claims.jsonl",[
        field("claim_case_id","string","Tapahtumatason tunniste ja päällekkäisyyksien hallinta Ifin kanssa sovittava."),
        field("occurred_on","string","Päivämäärä, jos kellonaikaa ei tunneta.",format="date"),
        timestamp("occurred_at","Tapahtuman tarkka aika, jos saatavilla.",True),timestamp("reported_at","Ilmoittamisen aika, jos saatavilla.",True),
        field("location_precision","string","Sijaintitiedon todellinen tarkkuus.",enum=["coordinate","address","postcode","municipality","unknown"]),
        field("postal_code","string","Postinumero; ei muuteta tarkaksi koordinaatiksi.",True),
        field("lon","number","Pituusaste, jos tarkka sijainti oikeasti tunnetaan.",True,"degree"),field("lat","number","Leveysaste, jos tarkka sijainti oikeasti tunnetaan.",True,"degree"),
        field("cause","string","Luokitus sovittava Ifin kanssa.",enum=["slip","trip","other","unknown"]),
        field("incurred_cost_eur","number","Kustannuksen käsite ja kirjaushetki sovittava; esimerkissä tuntematon.",True,"EUR"),*PROVENANCE],
        "Yksi rivi = ehdotettu tapahtumatason aineistotoimitus.","claim_case_id","Vain todellisen sijaintitarkkuuden sallimalle tasolle.","Ifin julkinen lomake kysyy osoitetta, mutta sisäistä tietomallia ei ole saatu.","Ei käytettävissä · ehdotus Ifille","Sisäinen lähdeformaatti tuntematon","Älä oleta koordinaatteja, tarkkaa aikaa, kustannuksia tai kaikkien vahinkojen kattavuutta. Ei käytetä mallilaboratoriossa. Kuvitteellinen esimerkkirivi ei ole Ifin dataa."))
    weather_schema=obj_schema(next(item for item in ds if item["id"]=="weather")["fields"],"Valittu säätausta")
    weather_schema.pop("$schema")
    weather_schema["type"]=["object","null"]
    ds.append(dataset("features","Yhdistetty piirrerivi","features.jsonl",[
        field("cell_id","string","Ruututunniste."),timestamp("evaluation_at","Arviointihetki; syötteet saatavilla viimeistään tällöin."),
        timestamp("window_start","Ohikulkujen ja tapahtumien ikkunan alku, mukana."),timestamp("window_end","Ikkunan loppu, ei mukana."),
        field("window_minutes","number","Tarkasteluikkunan pituus.",unit="min",exclusiveMinimum=0),
        field("sensor_threshold","number","Anturin pisteytysraja.",minimum=0,maximum=1),
        *[field(name,"integer",desc,nullable,minimum=0) for name,desc,nullable in [
            ("app_observed_passages","n: eri valmiit ohikulut; null jos keruu puuttuu.",True),
            ("anomalous_passages","y: n:ään kuuluvat eri ohikulut, joilla anturiraja ylittyi.",True),
            ("candidate_event_count","Rajan ylittäneiden yksilöityjen tapahtumien määrä; voi olla suurempi kuin y.",True),
            ("confirmed_slip_passages","Eri ohikulut, joilla viimeisin vastaus ilmoittaa liukastumisen; myös rajan alittavat tapahtumat voivat saada vastauksen.",False),
            ("rejected_event_count","Eri tapahtumat, joilla viimeisin vastaus on no_event.",False),
            ("post_grit_confirmed_slip_passages","Eri ohikulut, joilla vahvistettu tapahtuma oli viimeisimmän tunnetun hiekoituksen jälkeen.",False)]],
        timestamp("last_known_gritting_at","Viimeisimmän kohdistetun hiekoituksen valmistuminen; null ei tarkoita ettei ole hiekoitettu.",True),
        {"name":"weather","type":"object","nullable":True,"unit":"—","description":"Viimeisin käytettävissä ollut ruudun sääpiirrerivi.","schema":weather_schema},
        field("coverage_status","string","Keruun tila.",enum=["complete","missing","unknown"]),field("is_simulated","boolean","Vähintään yksi tämän piirrerivin lähde on simuloitu.")],
        "Yksi rivi = ruutu ja arviointihetki.","cell_id + evaluation_at","M0–M3 käyttävät tätä yhteistä tilannekuvaa.","buildFeatures() models.js-tiedostossa.","Laskettu · toteutettu demo","JSON Lines","Jokainen lähde suodatetaan omassa rakeisuudessaan ennen yhdistämistä. n ja y samasta sovellusotoksesta. Kattavuus missing/unknown säilyttää n=null."))
    ds.append(dataset("predictions","Mallien tulosformaatti","predictions.jsonl",[
        field("run_id","string","Ajokohtainen tunniste. CLI:ssä syötehashit, parametrit ja versio."),field("model_id","string","Mallin tunniste.",enum=["m0","m1","m2","m3"]),
        field("model_version","string","Mallin versio."),field("cell_id","string","Ruudun tunniste."),timestamp("evaluation_at","Arviointihetki."),
        field("target","string","Mallin todellinen kohde.",enum=["weather_signal","anomalous_passage_share","maintenance_action"]),
        field("unit","string","estimate-arvon yksikkö.",enum=["index_0_100","fraction","category"]),
        field("estimate","number","M0: 0–100; M1/M2: osuus 0–1; M3: null.",True),
        field("lower95","number","M2:n posteriorin 2,5 % kvantiili; muilla null.",True,minimum=0,maximum=1),
        field("upper95","number","M2:n posteriorin 97,5 % kvantiili; muilla null.",True,minimum=0,maximum=1),
        field("sample_n","integer","Havaitut ohikulut M1/M2:ssa; muuten null.",True,minimum=0),
        field("positive_y","integer","Poikkeaman sisältävät ohikulut M1/M2:ssa.",True,minimum=0),
        field("prior_only","boolean","M2:ssa true kun n=0, muutoin null tai false.",True),
        field("decision","string","M3:n toimintaluokka; muilla null.",True,enum=["recheck","inspect","weather_watch","collect","observe",None]),
        field("priority","integer","M3:n tärkeys 0–3; muilla null.",True,minimum=0,maximum=3),
        field("reasons","array","Näytettävät perustelut.",items={"type":"string"}),
        field("parameters","object","threshold, windowMinutes, priorMean ja priorStrength.",properties={"threshold":{"type":"number","minimum":0,"maximum":1},"windowMinutes":{"type":"number","exclusiveMinimum":0},"priorMean":{"type":"number","exclusiveMinimum":0,"exclusiveMaximum":1},"priorStrength":{"type":"number","exclusiveMinimum":0}},required=["threshold","windowMinutes","priorMean","priorStrength"],additionalProperties=False),
        field("is_simulated","boolean","Tulos perustuu vähintään osittain simuloituihin syötteisiin.")],
        "Yksi rivi = ajo, malli, ruutu ja arviointihetki.","run_id + model_id + cell_id + evaluation_at","cell_id + evaluation_at → features","Samat models.js-funktiot selaimessa ja Node-ajossa.","Laskettu · toteutettu demo","JSON Lines","Sääindeksiä ja havainto-osuutta ei vertailla samana mitta-asteikkona. Malli tai rajapinta ei käytä henkilökohtaista vakuutuspäätöstä."))
    return ds


def main():
    data=create_fixtures()
    observations,metadata=normalize_fmi()
    node=shutil.which("node")
    if not node:
        raise SystemExit("Rakentaminen tarvitsee Node.js:n malliesimerkkien ajamiseen.")
    subprocess.run([node,str(ROOT/"run_models.cjs"),"--output",str(EXAMPLES)],check=True)
    datasets=catalog()
    for item in datasets:
        schema=obj_schema(item["fields"],item["title"])
        item["schema"]=schema
        write_json(SCHEMAS/(item["id"]+".schema.json"),schema)
        path=EXAMPLES/item["filename"]
        content=path.read_text(encoding="utf-8")
        item["example"]=content if item["filename"].endswith(".geojson") else "\n".join(content.splitlines()[:3])+"\n"
        item["download"]=content
        item["raw_example"]=((EXAMPLES/"fmi-source.xml").read_text(encoding="utf-8") if item["id"]=="observations" else None)
    models=[
        dict(id="m0",title="M0 · Sääsääntö",kind="Oma heuristiikka",target="weather_signal",unit="0–100 signaali",training="Ei opetusta · CPU / selain",inputs=["weather"],formula="S = 50·I(T≤0 ja R24≥0.1) + 25·I(Tmin24<0<Tmax24) + 25·I(varoitus=true)",meaning="Kuvaa vain valittujen ehtojen täyttymistä. Ei kaatumistodennäköisyys eikä FMI:n liukkausmalli.",notes="Puuttuva lämpötila-, sade- tai min/max-tieto → null. Tuntematon varoitus ei tuo 25 pistettä. Painot 50/25/25 ovat käsin valitut demo-oletukset."),
        dict(id="m1",title="M1 · Raaka havainto-osuus",kind="Vertailutaso",target="anomalous_passage_share",unit="osuus [0,1]",training="Ei opetusta · CPU / selain",inputs=["passages","events","features"],formula="p̂ = y / n; y = eri ohikulut, joissa ≥1 sensor_score ≥ raja; n = havaitut valmistuneet ohikulut",meaning="Mittaa anturirajan ylittävän ohikulun osuutta saman sovellusotoksen sisällä. Usea heilahdus samalla ohikululla lasketaan yhdeksi.",notes="n=0 → null, ei 0 %. Tästä ei voi päätellä todellista liukastumis- tai loukkaantumisriskiä ilman tunnistimen arviointia."),
        dict(id="m2",title="M2 · Beta-binomimalli",kind="Tasoittava vertailumalli",target="anomalous_passage_share",unit="osuus ja 95 % uskottavuusväli",training="Suljettu päivityskaava · CPU / selain",inputs=["features"],formula="p ~ Beta(α,β); y|p,n ~ Binomial(n,p); p|y,n ~ Beta(α+y, β+n−y)",meaning="Tasoittaa pienen otoksen havainto-osuutta kohti valittua prioria. Keskiarvo (α+y)/(α+β+n). 95 % väli = posteriorin kvantiilit 0.025 ja 0.975.",notes="Oletuspriori Beta(1,19): keskiarvo 5 %, vahvuus 20. Se on kokeiluasetus. n=0 → vain priori. Malli olettaa samankaltaiset ja riippumattomat ohikulut; samojen käyttäjien ja kelin riippuvuus voi tehdä välistä liian kapean."),
        dict(id="m3",title="M3 · Huollon toimintasääntö",kind="Toimintasääntö",target="maintenance_action",unit="luokka / tärkeys 0–3",training="Ei opetusta · CPU / selain",inputs=["features","responses","maintenance","m0","m2"],formula="1) ≥2 vahvistusta hiekoituksen jälkeen → recheck; 2) ≥2 vahvistusta TAI n≥20 ja M2:n alaraja≥5 % → inspect; 3) sääsignaali≥50 → weather_watch; 4) n puuttuu/0 → collect; muuten observe.",meaning="Näyttää, miten havainnot voivat muuttua tehtäväksi. Kynnykset ovat demo-oletuksia. Hiekoituksen kirjaus ei itsessään nollaa vaarasignaalia.",notes="Vahvistukset lasketaan eri ohikulkujen mukaan. Vastaus on itse ilmoitettu. Toimintasääntö ei arvioi oikeudellista vastuuta tai takaa turvallisuutta.")
    ]
    payload={"version":"1.0","created_on":"2026-10-17","default_cell":"B1","times":[at(h) for h in range(7,11)],"datasets":datasets,"models":models,"data":data,"fmi_metadata":metadata,"sources":[
        {"title":"FMI: WFS-latauspalvelun pikaohje","url":"https://www.ilmatieteenlaitos.fi/latauspalvelun-pikaohje"},
        {"title":"FMI: varoitukset, CAP ja arkisto","url":"https://www.ilmatieteenlaitos.fi/varoitusten-latauspalvelun-pikaohje"},
        {"title":"FMI:n avoin data · CC BY 4.0","url":"https://www.ilmatieteenlaitos.fi/avoin-data-lisenssi"},
        {"title":"Turun kartat, laskentapisteet ja kunnossapito","url":"https://www.turku.fi/tietoa-turusta/kartat-ja-paikkatieto"},
        {"title":"Digitraffic: counting-site ja tiesää","url":"https://www.digitraffic.fi/en/road-traffic/"},
        {"title":"If: julkinen liukastumisselvitys","url":"https://www.if.fi/yritysasiakkaat/ilmoita-vahingosta/henkilovahinko/ammattitauti/selvitys-liukastumisesta"},
        {"title":"GeoJSON · RFC 7946","url":"https://datatracker.ietf.org/doc/html/rfc7946"},
        {"title":"Beta-jakauman CDF ja kvantiilit","url":"https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.beta.html"}]}
    write_json(ROOT/"catalog.json",payload)
    template=(ROOT/"template.html").read_text()
    encoded=json.dumps(payload,ensure_ascii=False,separators=(",",":"),allow_nan=False).replace("<","\\u003c")
    output=template.replace("/*__STYLE__*/",(ROOT/"explorer.css").read_text()).replace("/*__MODELS__*/",(ROOT/"models.js").read_text()).replace("/*__APP__*/",(ROOT/"explorer.js").read_text()).replace("/*__PAYLOAD__*/",encoded)
    (ROOT/"index.html").write_text(output,encoding="utf-8")
    print(f"Rakennettu index.html, catalog.json, {len(datasets)} skeemaa ja esimerkit. Ei verkkohakuja.")


if __name__=="__main__":
    main()
