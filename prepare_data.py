import csv
import json

input_file = "IT.txt"
output_file = "orte_suedtirol.json"

raw_data = []
merged = []

# Lade alle Zeilen
with open(input_file, encoding="utf-8") as f:
    reader = csv.reader(f, delimiter='\t')

    for row in reader:
        try:
        	provinz = row[11].strip()
            if provinz != "BZ":
                continue
            name = row[1].strip()
            if not name:
                continue
            alt_names = [n.strip() for n in row[3].strip('"').split(",") if n.strip()]
            lat = float(row[4])
            lon = float(row[5])
            einwohner = int(row[14])

            raw_data.append({
                "name": name,
                "alt": alt_names,
                "lat": lat,
                "lon": lon,
                "einwohner": einwohner,
                "ratbar": einwohner >= 1000  # Neue Info
            })
        except Exception as e:
            print("Fehler bei Zeile:", row, e)

# Merge ähnliche Orte (Namens-Substring)
used = set()
groups = {}
for i, ort in enumerate(raw_data):
    base_name = ort["name"]
    cont = False

    if "/" not in base_name:
        for j, other in enumerate(raw_data):
            if "/" in other["name"] and base_name in other["name"].strip().split("/"):
                if other["name"] not in groups:
                    groups[other["name"]] = []
                groups[other["name"]].append(other)
                cont = True
    if cont:
        continue
    
    if base_name not in groups:
        groups[base_name] = []
    groups[base_name].append(ort)

for gname, group in groups.items():
    # Merge die Gruppe
    base_name_long = ([None]+[o["name"] for o in group if "/" in o["name"]])[-1] or group[0]["name"]
#     if len(group) >= 2:
#         print(base_name_long)
    lat_avg = sum(o["lat"] for o in group) / len(group)
    lon_avg = sum(o["lon"] for o in group) / len(group)
    alt_combined = list(set(sum((o["alt"] for o in group), [])))
    einwohner_max = max(o["einwohner"] for o in group)
    ratbar = any(o["ratbar"] for o in group)

    merged.append({
        "name": base_name_long,
        "alternativen": alt_combined,
        "lat": lat_avg,
        "lon": lon_avg,
        "einwohner": einwohner_max,
        "ratbar": ratbar
    })

# JSON schreiben
with open(output_file, "w", encoding="utf-8") as f_out:
    json.dump(merged, f_out, ensure_ascii=False, indent=2)