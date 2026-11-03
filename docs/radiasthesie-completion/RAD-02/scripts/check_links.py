import json, subprocess, os, time

OUT = r"C:/Users/mas/Arbeit/esow-rad-t_878c59c7/docs/radiasthesie-completion/RAD-02"
parts = os.path.join(OUT, "scripts", "parts")
srcs = json.load(open(os.path.join(parts, "sources-1.json"), encoding="utf-8")) + \
       json.load(open(os.path.join(parts, "sources-2.json"), encoding="utf-8"))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
res = []
for s in srcs:
    url = s["locator"]
    if url.startswith("OpenAlex"):
        res.append({"id": s["id"], "url": url, "http": None, "note": "kein URL-Locator"})
        continue
    r = subprocess.run(["curl", "-sL", "-m", "45", "-o", "/dev/null",
                        "-A", UA, "-w", "%{http_code}", url], capture_output=True, text=True)
    res.append({"id": s["id"], "url": url, "http": r.stdout.strip()})
    print(s["id"], r.stdout.strip(), url[:90])
    time.sleep(0.3)
json.dump(res, open(os.path.join(OUT, "scripts", "parts", "http-check.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
