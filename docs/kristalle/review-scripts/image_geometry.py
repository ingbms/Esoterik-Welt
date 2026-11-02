import json, os, sys
from PIL import Image
import numpy as np

base = r"C:/Users/mas/Arbeit/Esoterik-Welt"
man = json.load(open(os.path.join(base, "assets/crystals/manifest.json"), encoding="utf-8"))
src = json.load(open(os.path.join(base, "docs/kristalle/image-sources.json"), encoding="utf-8"))
src_by_id = {}
for c in src["crystals"]:
    cand = next(x for x in c["candidates"] if x.get("selected"))
    sid = cand.get("crystal_id") or c["crystal_id"]
    src_by_id[sid] = (cand["source"]["renditions"]["w1280"]["delivered_width_px"],
                      cand["source"]["renditions"]["w1280"]["delivered_height_px"])

BG = (11, 16, 18)
print(f"{'id':8} {'level':5} {'dims':10} {'corners==bg':11} {'content_wh':13} {'asp_plate':9} {'asp_src':9} {'dev%':7} verdict")
bad = []
for e in man["images"]:
    for level in ("320", "1280"):
        p = os.path.join(base, "assets/crystals", e["levels"][level])
        im = Image.open(p).convert("RGB")
        a = np.asarray(im).astype(int)
        corners = [tuple(a[0, 0]), tuple(a[0, -1]), tuple(a[-1, 0]), tuple(a[-1, -1])]
        c_ok = all(c == BG for c in corners)
        diff = (np.abs(a - np.array(BG)).sum(axis=2) > 12)
        ys, xs = np.where(diff)
        if len(xs):
            w = xs.max() - xs.min() + 1
            h = ys.max() - ys.min() + 1
        else:
            w = h = 0
        # sample the middle row/col to avoid outliers (retouch etc.)
        asp_p = w / h if h else 0
        sw, sh = src_by_id[e["id"]]
        asp_s = sw / sh
        dev = abs(asp_p - asp_s) / asp_s * 100 if asp_s else 999
        mode = e["production"]["mode"]
        ok = im.size == (int(level), int(level)) and c_ok and (mode != "pad" or dev < 2.0)
        if not ok:
            bad.append((e["id"], level, im.size, c_ok, round(asp_p, 4), round(asp_s, 4), round(dev, 2)))
        if level == "1280":
            print(f"{e['id']:8} {level:5} {str(im.size):10} {str(c_ok):11} {f'{w}x{h}':13} {asp_p:9.4f} {asp_s:9.4f} {dev:7.2f} {'OK' if ok else 'CHECK'} {mode}")

print("\nBAD:", bad if bad else "keine")
