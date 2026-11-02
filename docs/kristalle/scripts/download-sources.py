import json, os, hashlib, urllib.request, time

ROOT = 'C:/Users/mas/Arbeit/Esoterik-Welt'
SRC = 'C:/Users/mas/AppData/Local/hermes/profiles/coder/cache/scratch/crystal-src'
os.makedirs(SRC, exist_ok=True)
sel = json.load(open(ROOT + '/docs/kristalle/.selection.json', encoding='utf-8'))
UA = 'Esoterik-Welt/1.0 (https://github.com/ingbms/Esoterik-Welt; static site image integration)'

report = []
for e in sel:
    path = os.path.join(SRC, e['slug'] + '.jpg')
    if os.path.exists(path):
        h = hashlib.sha256(open(path, 'rb').read()).hexdigest()
        if h == e['w1280_sha256']:
            report.append((e['id'], 'cached-ok', os.path.getsize(path)))
            continue
    req = urllib.request.Request(e['w1280_url'], headers={'User-Agent': UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            break
        except Exception as ex:
            print('retry', e['slug'], attempt, ex)
            time.sleep(3)
    else:
        report.append((e['id'], 'FAILED', 0))
        continue
    open(path, 'wb').write(data)
    h = hashlib.sha256(data).hexdigest()
    ok = 'ok' if h == e['w1280_sha256'] else 'HASH-MISMATCH'
    report.append((e['id'], ok, len(data)))
    time.sleep(0.3)

for r in report:
    print(*r)
print('failures:', [r for r in report if r[1] not in ('ok', 'cached-ok')])
print('total bytes:', sum(r[2] for r in report))
