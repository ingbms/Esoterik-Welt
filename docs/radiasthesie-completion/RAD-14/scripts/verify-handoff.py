"""Read-only validation of the RAD-14 handoff; run with Python 3."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from urllib.parse import unquote, urlsplit

BASE = Path(__file__).resolve().parents[1]
ROOT = BASE.parents[2]
SHA = 'ceddc84cfca44d53f1995dfd0981b7d70a554724'
errors = []
counts = {}

def check(ok, detail):
    if not ok:
        errors.append(detail)

mds = sorted(BASE.glob('*.md'))
counts['markdown_files'] = len(mds)
check(len(mds) == 17, 'Expected 17 top-level RAD-14 Markdown files')
manuals = sorted(BASE.glob('BEDIENUNG-*.md'))
counts['manuals'] = len(manuals)
check(len(manuals) == 4, 'Expected four manuals')
for p in manuals:
    text = p.read_text(encoding='utf-8')
    check(len(re.findall(r'^## ', text, re.M)) >= 4, f'Manual lacks structure: {p.name}')
    check('#pendeln/' in text, f'Manual lacks module route: {p.name}')

matrix = (BASE/'PAKETMATRIX.md').read_text(encoding='utf-8')
rows = re.findall(r'^\| (\d{2}) \|.*$', matrix, re.M)
check(rows == [f'{i:02}' for i in range(1,15)], 'Matrix must contain exactly 01..14 once')
counts['matrix_rows'] = len(rows)
for line in matrix.splitlines():
    if re.match(r'^\| \d{2} \|', line):
        check(bool(re.search(r'\]\([^)]+\)',line)), 'Matrix row lacks evidence link: '+line[:30])

links = 0
tables = 0
for p in mds + [BASE.parent/'CHECKPOINT.md', BASE.parent/'RELEASE-CANDIDATE.md']:
    text = p.read_text(encoding='utf-8')
    fence = False
    cols = None
    for n,line in enumerate(text.splitlines(),1):
        if line.startswith('```'):
            fence = not fence
            cols = None
            continue
        if fence:
            continue
        if line.startswith('|'):
            size = len(re.split(r'(?<!\\)\|',line))
            if cols is None:
                cols = size
                tables += 1
            check(size == cols, f'Table columns differ: {p.name}:{n}')
        else:
            cols = None
        for target in re.findall(r'\[[^\]\n]*\]\(([^)\s]+)\)',line):
            u = urlsplit(target)
            if u.scheme or target.startswith('#'):
                continue
            target_path = p.parent/unquote(u.path)
            links += 1
            check(target_path.exists(),f'Broken local link: {p.name}:{n} -> {target}')
    check(not fence, f'Unclosed code fence: {p.name}')
counts['tables'] = tables
counts['local_links'] = links

fp = json.loads((BASE/'evidence/product-sha256.json').read_text(encoding='utf-8'))
check(fp['commit'] == SHA, 'Product fingerprint commit mismatch')
for path,digest in fp['sha256'].items():
    data = subprocess.check_output(['git','show',f'{SHA}:{path}'],cwd=ROOT)
    check(hashlib.sha256(data).hexdigest() == digest,f'Product Git-blob hash mismatch: {path}')
counts['product_fingerprints'] = len(fp['sha256'])
archive = BASE/'evidence/RAD-13-F1-F2-REVIEW-EVIDENZ.zip'
check(hashlib.sha256(archive.read_bytes()).hexdigest() == '398fac79e6579d5ecfee15a58f8fa093aa1e0dea220ef94361c2546f5dd99684','Review ZIP checksum mismatch')
with zipfile.ZipFile(archive) as z:
    check(z.testzip() is None, 'Corrupt review ZIP')
    check(len(z.namelist()) == 47,'Review ZIP entry count mismatch')
counts['review_zip_entries'] = 47
sums = BASE/'SHA256SUMS.txt'
manifest_count = 0
if sums.exists():
    for line in sums.read_text(encoding='utf-8').splitlines():
        if not line or line.startswith('#'):
            continue
        digest, size, path = line.split('  ',2)
        data = (BASE/path).read_bytes()
        if (BASE/path).suffix != '.zip':
            data = data.replace(b'\r\n', b'\n')
        check(len(data) == int(size),f'Size mismatch: {path}')
        check(hashlib.sha256(data).hexdigest() == digest,f'Handoff hash mismatch: {path}')
        manifest_count += 1
counts['manifest_files_checked'] = manifest_count
before = json.loads((BASE/'evidence/preserved-before.json').read_text(encoding='utf-8'))
if '--check-preserved' in sys.argv:
    for path,digest in before.items():
        check(hashlib.sha256((ROOT/path).read_bytes()).hexdigest() == digest, f'Preserved artifact changed: {path}')
    counts['preserved_files_checked'] = len(before)
else:
    counts['preserved_files_checked'] = 0
print(json.dumps({'candidate':SHA,'counts':counts,'errors':errors,'status':'PASS' if not errors else 'FAIL','docs_renderer':'not tested; no project docs renderer'},ensure_ascii=False,indent=2))
sys.exit(1 if errors else 0)
