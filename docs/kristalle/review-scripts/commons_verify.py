import json, urllib.request, urllib.parse, time, os, sys

base = r"C:/Users/mas/Arbeit/Esoterik-Welt"
m = json.load(open(os.path.join(base, "assets/crystals/manifest.json"), encoding="utf-8"))
imgs = m["images"]
UA = "KristalleReview/1.0 (independent license audit; contact: local reviewer)"
API = "https://commons.wikimedia.org/w/api.php"

def api(titles):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "formatversion": "2",
        "prop": "imageinfo", "iiprop": "extmetadata|url|size|mime|sha1",
        "titles": "|".join(titles),
    })
    req = urllib.request.Request(API + "?" + q, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode("utf-8"))

out = {}
titles = [e["title"] for e in imgs]
for i in range(0, len(titles), 10):
    batch = titles[i:i+10]
    data = api(batch)
    pages = data.get("query", {}).get("pages", [])
    for p in pages:
        out[p.get("title", "")] = p
    time.sleep(1.0)

# normalize
norm = {k.replace("_", " ").lower(): v for k, v in out.items()}
print("fetched pages:", len(out))

import html, re
def clean(s):
    s = re.sub(r"<[^>]+>", "", s or "")
    return html.unescape(s).strip()

report = []
for e in imgs:
    key = e["title"].replace("_", " ").lower()
    p = norm.get(key)
    rec = {"id": e["id"], "slug": e["slug"], "title": e["title"],
           "declared_license": e["credit"]["license"],
           "declared_author": e["credit"]["author"],
           "declared_url": e["credit"]["source_url"],
           "declared_license_url": e["credit"]["license_url"],
           "declared_share_alike": e["credit"]["share_alike"]}
    if not p:
        rec["status"] = "PAGE_NOT_FOUND"
        report.append(rec); continue
    if p.get("missing"):
        rec["status"] = "MISSING_ON_COMMONS"
        report.append(rec); continue
    ii = (p.get("imageinfo") or [{}])[0]
    em = ii.get("extmetadata", {})
    rec["status"] = "ok"
    rec["cm_license_short"] = clean(em.get("LicenseShortName", {}).get("value", ""))
    rec["cm_license"] = clean(em.get("License", {}).get("value", ""))
    rec["cm_license_url"] = clean(em.get("LicenseUrl", {}).get("value", ""))
    rec["cm_artist"] = clean(em.get("Artist", {}).get("value", ""))[:160]
    rec["cm_credit"] = clean(em.get("Credit", {}).get("value", ""))[:160]
    rec["cm_usage_terms"] = clean(em.get("UsageTerms", {}).get("value", ""))[:120]
    rec["cm_restrictions"] = clean(em.get("Restrictions", {}).get("value", ""))[:160]
    rec["cm_copyrighted"] = clean(em.get("Copyrighted", {}).get("value", ""))
    rec["cm_attribution_required"] = clean(em.get("AttributionRequired", {}).get("value", ""))
    rec["cm_sha1"] = ii.get("sha1", "")
    rec["cm_url"] = ii.get("url", "")
    rec["cm_size"] = ii.get("width", 0), ii.get("height", 0)
    report.append(rec)

json.dump(report, open(r"C:/Users/mas/AppData/Local/hermes/profiles/reviewer/cache/scratch/commons_verify.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print("\n=== SUMMARY ===")
for r in report:
    if r["status"] != "ok":
        print(r["id"], r["status"], r["title"]); continue
    print(f"{r['id']:8} {r['cm_license_short'][:28]:30} | {r['cm_license']:10} | "
          f"attr_req={r['cm_attribution_required']:5} | restr={r['cm_restrictions'][:20]:20} | {r['cm_artist'][:45]}")
