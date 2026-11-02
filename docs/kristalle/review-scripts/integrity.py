import json, os, hashlib
base = r"C:/Users/mas/Arbeit/Esoterik-Welt"
man = json.load(open(os.path.join(base, "assets/crystals/manifest.json"), encoding="utf-8"))
bad = []
n = 0
for e in man["images"]:
    for lvl in ("320", "640", "960", "1280"):
        p = os.path.join(base, "assets/crystals", e["levels"][lvl])
        n += 1
        if not os.path.exists(p):
            bad.append((e["id"], lvl, "missing")); continue
        b = open(p, "rb").read()
        h = hashlib.sha256(b).hexdigest()
        if len(b) != e["bytes"][lvl]: bad.append((e["id"], lvl, f"bytes {len(b)}!={e['bytes'][lvl]}"))
        if h != e["sha256"][lvl]: bad.append((e["id"], lvl, "sha mismatch"))
print("files checked:", n, "| deviations:", len(bad))
for x in bad[:10]: print(" ", x)
# data/crystals.json vs manifest consistency
data = json.load(open(os.path.join(base, "data/crystals.json"), encoding="utf-8"))["crystals"]
dm = {c["id"]: c for c in data}
diffs = []
for e in man["images"]:
    c = dm.get(e["id"])
    if not c: diffs.append((e["id"], "missing in data")); continue
    if c["attribution_text_short"] != e["attribution_text_short"]: diffs.append((e["id"], "short differs"))
    if c["image"] != "assets/crystals/640/" + e["slug"] + ".webp": diffs.append((e["id"], "image path " + c["image"]))
    cr = c["image_credit"]
    for k_m, k_d in [("author", "author"), ("source_url", "source_url"), ("license", "license"), ("license_url", "license_url"), ("changes", "changes"), ("retrieved", "retrieved")]:
        if cr.get(k_d) != e["credit"][k_m]: diffs.append((e["id"], f"credit.{k_d} differs"))
    if c.get("image_alt") != e["credit"]["alt"]: diffs.append((e["id"], "alt differs"))
print("data/manifest diffs:", len(diffs))
for d in diffs[:10]: print(" ", d)
