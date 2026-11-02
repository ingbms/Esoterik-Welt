import json, os, hashlib, urllib.request, urllib.error, time, io

base = r"C:/Users/mas/Arbeit/Esoterik-Welt"
src = json.load(open(os.path.join(base, "docs/kristalle/image-sources.json"), encoding="utf-8"))
man = json.load(open(os.path.join(base, "assets/crystals/manifest.json"), encoding="utf-8"))
man_by_id = {e["id"]: e for e in man["images"]}
UA = "EsoterikWelt-Review/1.0 (independent provenance audit)"

def head(url):
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.geturl()
    except urllib.error.HTTPError as ex:
        return ex.code, url
    except Exception as ex:
        return f"ERR:{type(ex).__name__}", url

def get(url, limit=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        data = r.read()
        return data, r.headers.get("Content-Type", ""), r.geturl()

results = []
for c in src["crystals"]:
    cand = next(x for x in c["candidates"] if x.get("selected"))
    sid = cand.get("crystal_id") or c["crystal_id"]
    ren = cand["source"]["renditions"]["w1280"]
    rec = {"id": sid, "slug": c["slug"], "url": ren["url"], "expected_sha": ren["sha256"],
           "expected_bytes": ren.get("bytes"), "expected_dims": (ren.get("delivered_width_px"), ren.get("delivered_height_px"))}
    try:
        data, ctype, final = get(ren["url"])
        rec["status"] = "ok"
        rec["got_bytes"] = len(data)
        rec["sha256"] = hashlib.sha256(data).hexdigest()
        rec["ctype"] = ctype
        rec["final_url"] = final
        rec["hash_match"] = rec["sha256"] == rec["expected_sha"]
        rec["bytes_match"] = (rec["expected_bytes"] is None) or (len(data) == rec["expected_bytes"])
        # dims via PIL
        try:
            from PIL import Image
            im = Image.open(io.BytesIO(data))
            rec["dims"] = im.size
            rec["dims_match"] = (rec["expected_dims"] == im.size)
        except Exception as ex:
            rec["dims"] = f"ERR {ex}"
    except Exception as ex:
        rec["status"] = f"DOWNLOAD_FAIL {type(ex).__name__}: {ex}"
    results.append(rec)
    print(f"{sid} {c['slug'][:18]:18} {rec['status']:10} sha_match={rec.get('hash_match')} bytes={rec.get('got_bytes')}/{rec.get('expected_bytes')} dims={rec.get('dims')}/{rec.get('expected_dims')}", flush=True)
    time.sleep(0.3)

print("\n=== SUMMARY provenance ===")
print("downloaded ok:", sum(1 for r in results if r["status"] == "ok"))
print("sha256 match:", sum(1 for r in results if r.get("hash_match")))
mism = [r["id"] for r in results if not r.get("hash_match")]
print("sha mismatches:", mism)
json.dump(results, open(r"C:/Users/mas/AppData/Local/hermes/profiles/reviewer/cache/scratch/provenance.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print("\n=== LICENSE / SOURCE URL STATUS ===")
lic_urls = {}
for e in man["images"]:
    lic_urls.setdefault(e["credit"]["license_url"], []).append(e["id"])
for u, ids in lic_urls.items():
    st, final = head(u)
    print(f"{st}  {u}  ({len(ids)} Bilder)  final={final}")

print("\n-- source page URLs --")
src_status = {}
for e in man["images"]:
    u = e["credit"]["source_url"]
    st, final = head(u)
    src_status[e["id"]] = st
    print(f"{st}  {e['id']:8} {u}")
    time.sleep(0.15)
print("\nnon-200 source pages:", [k for k, v in src_status.items() if v != 200])
