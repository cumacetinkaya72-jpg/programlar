#!/usr/bin/env python3
"""index.html'i pdf.js gömülü, internetsiz çalışan tek HTML dosyasına dönüştürür.

Kullanım: python3 build.py <pdfjs-dist-3.11.174/build klasörü>
Çıktı: devamsizlik-analizi.html
"""
import pathlib
import sys

PDFJS_VERSION = "3.11.174"
here = pathlib.Path(__file__).resolve().parent
build = pathlib.Path(sys.argv[1])
lib = (build / "pdf.min.js").read_text(encoding="utf-8")
worker = (build / "pdf.worker.min.js").read_text(encoding="utf-8")
for name, code in (("pdf.min.js", lib), ("pdf.worker.min.js", worker)):
    if "</script" in code.lower():
        sys.exit(f"{name} içinde </script geçiyor; gömülemez")

src = (here / "index.html").read_text(encoding="utf-8")
tag = f'<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/{PDFJS_VERSION}/pdf.min.js"></script>'
if tag not in src:
    sys.exit("index.html içinde pdf.js betik etiketi bulunamadı")
inline = f"<script>{lib}</script>\n<script type=\"text/plain\" id=\"pdfjs-worker\">{worker}</script>"
body = src.replace(tag, inline)

out = (
    "<!doctype html>\n<html lang=\"tr\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
    "<style>body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n"
    + body + "\n</body>\n</html>\n"
)
(here / "devamsizlik-analizi.html").write_text(out, encoding="utf-8")
print(f"devamsizlik-analizi.html yazıldı ({len(out.encode()) // 1024} KB)")
