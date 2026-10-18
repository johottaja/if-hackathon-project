"""Check the JSON Schema keywords used here; not a general-purpose validator."""
import csv
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parent


def validate(value,schema,where):
    if "const" in schema:
        assert value==schema["const"],where+" const"
    if "enum" in schema:
        assert value in schema["enum"],where+" enum"
    types=schema.get("type")
    if types:
        types=types if isinstance(types,list) else [types]
        matches={"null":value is None,"boolean":type(value) is bool,"integer":type(value) is int,
                 "number":type(value) in (int,float) and math.isfinite(value),
                 "string":isinstance(value,str),"array":isinstance(value,list),"object":isinstance(value,dict)}
        assert any(matches[t] for t in types),where+" type"
    if value is None:
        return
    if isinstance(value,dict):
        assert all(k in value for k in schema.get("required",[])),where+" missing field"
        if schema.get("additionalProperties") is False:
            assert set(value)<=set(schema.get("properties",{})),where+" extra field"
        for key,sub in schema.get("properties",{}).items():
            if key in value:
                validate(value[key],sub,where+"."+key)
    elif isinstance(value,list):
        assert len(value)>=schema.get("minItems",0),where+" minItems"
        assert len(value)<=schema.get("maxItems",math.inf),where+" maxItems"
        for i,item in enumerate(value):
            validate(item,schema.get("items",{}),where+f"[{i}]")
    elif type(value) in (int,float):
        for key,ok in [("minimum",lambda x:value>=x),("maximum",lambda x:value<=x),
                       ("exclusiveMinimum",lambda x:value>x),("exclusiveMaximum",lambda x:value<x)]:
            if key in schema:
                assert ok(schema[key]),where+" "+key
    elif isinstance(value,str):
        if "pattern" in schema:
            assert re.search(schema["pattern"],value),where+" pattern"
        if schema.get("format")=="date-time":
            dt.datetime.fromisoformat(value.replace("Z","+00:00"))
        elif schema.get("format")=="date":
            dt.date.fromisoformat(value)


def main():
    catalog=json.loads((ROOT/"catalog.json").read_text())
    row_count=0
    for data in catalog["datasets"]:
        path=ROOT/"examples"/data["filename"]
        if path.suffix==".csv":
            with path.open(newline="",encoding="utf-8") as handle:
                rows=list(csv.DictReader(handle))
            for row in rows:
                for f in data["fields"]:
                    if row[f["name"]]=="":
                        row[f["name"]]=None
                    elif f["type"]=="number":
                        row[f["name"]]=float(row[f["name"]])
        elif path.suffix==".geojson":
            rows=[json.loads(path.read_text())]
        else:
            rows=[json.loads(line) for line in path.read_text().splitlines() if line]
        for i,row in enumerate(rows):
            validate(row,data["schema"],data["id"]+":"+str(i+1))
        row_count+=len(rows)
    def rows(name):
        return [json.loads(line) for line in (ROOT/"examples"/(name+".jsonl")).read_text().splitlines() if line]
    cells=json.loads((ROOT/"examples"/"cells.geojson").read_text())["features"]
    cell_ids={c["properties"]["cell_id"] for c in cells}
    for cell in cells:
        ring=cell["geometry"]["coordinates"][0]
        assert ring[0]==ring[-1]
        assert all(-180<=p[0]<=180 and -90<=p[1]<=90 for p in ring)
    pids={r["passage_id"] for r in rows("passages")}
    eids={r["event_id"] for r in rows("events")}
    source_ids={r["source_id"] for r in rows("source_registry")}
    for name in ["passages","events","responses","maintenance","coverage","weather","external_counts","claims","weather_observations"]:
        assert all(r["source_id"] in source_ids for r in rows(name)),name+" source_id"
    assert all(r["passage_id"] in pids for r in rows("events"))
    assert all(r["event_id"] in eids for r in rows("responses"))
    assert all(r["cell_id"] in cell_ids for name in ["passages","weather","coverage","maintenance","features","predictions"] for r in rows(name))
    for name,key in [("passages","passage_id"),("events","event_id"),("responses","response_id"),("maintenance","action_id")]:
        items=rows(name)
        assert len({r[key] for r in items})==len(items),name+" primary key"
    for f in rows("features"):
        if f["app_observed_passages"] is not None:
            assert 0<=f["anomalous_passages"]<=f["app_observed_passages"]
    meta=json.loads((ROOT/"examples"/"fmi-source-metadata.json").read_text())
    assert hashlib.sha256((ROOT/"examples"/"fmi-source.xml").read_bytes()).hexdigest()==meta["sha256"]
    html=(ROOT/"index.html").read_text()
    assert all(token not in html for token in ["/*__STYLE__*/","/*__APP__*/","/*__MODELS__*/","/*__PAYLOAD__*/"])
    assert not re.search(r"<script[^>]+src=",html)
    assert not re.search(r"\bfetch\s*\(",html)
    assert all(path.read_text().endswith("\n") for path in ROOT.glob("*.js"))
    print(f"{len(catalog['datasets'])} tiedostosopimusta ja {row_count} esimerkkiriviä tarkistettu.")
    print("Avainviitteet, n/y-säännöt, lähteen SHA-256 ja HTML:n offline-rakenne kunnossa.")


if __name__=="__main__":
    main()
