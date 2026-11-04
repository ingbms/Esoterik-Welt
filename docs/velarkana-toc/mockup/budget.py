"""Budgetmessung: minifizierte und gzip-komprimierte Größe von toc.css."""

import gzip
import re
from pathlib import Path

css = Path(__file__).resolve().parent.joinpath("toc.css").read_text(encoding="utf-8")
mini = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
mini = re.sub(r"\s+", " ", mini)
mini = re.sub(r"\s*([{}:;,>])\s*", r"\1", mini).strip()
raw = len(css.encode())
mini_b = len(mini.encode())
gz = len(gzip.compress(mini.encode(), 9))
print(f"toc.css roh={raw} B  minifiziert={mini_b} B  gzip={gz} B ({gz / 1024:.2f} KiB)")

js = Path(__file__).resolve().parent.joinpath("toc.js").read_text(encoding="utf-8")
js_mini = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
js_mini = re.sub(r"//[^\n]*", "", js_mini)
js_mini = re.sub(r"\s+", " ", js_mini).strip()
js_gz = len(gzip.compress(js_mini.encode(), 9))
print(f"toc.js  roh={len(js.encode())} B  minifiziert={len(js_mini.encode())} B  gzip={js_gz} B ({js_gz / 1024:.2f} KiB)")
Path(__file__).resolve().parent.joinpath("budget.txt").write_text(
    f"css_raw={raw}\ncss_minified={mini_b}\ncss_gzip={gz}\njs_minified={len(js_mini.encode())}\njs_gzip={js_gz}\n",
    encoding="utf-8",
)
