#!/usr/bin/env python3
"""Örnek 27 Excel şablonunu src/app.html içine gömerek tek dosyalık programı üretir.

Kullanım:  python3 tools/build.py
Çıktı:     gecici-gorev-yollugu.html

Şablondaki calcChain ve yazıcı ayarları atılır (formüller değiştiği için Excel
açılışta yeniden hesaplar); geri kalan tüm parçalar (stiller, tema, birleştirmeler,
sütun genişlikleri) aynen korunur.
"""
import json
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "app.html"
XLSX = ROOT / "sablon" / "ornek27_sablon.xlsx"
OUT = ROOT / "gecici-gorev-yollugu.html"
MARKER = "/*@@SABLON@@*/null"

KEEP = [
    "[Content_Types].xml",
    "_rels/.rels",
    "docProps/app.xml",
    "docProps/core.xml",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "xl/sharedStrings.xml",
    "xl/theme/theme1.xml",
    "xl/worksheets/sheet1.xml",
]


def main():
    parts = {}
    with zipfile.ZipFile(XLSX) as z:
        for name in KEEP:
            parts[name] = z.read(name).decode("utf-8")

    ct = parts["[Content_Types].xml"]
    ct = re.sub(r'<Default Extension="bin"[^>]*/>', "", ct)
    ct = re.sub(r'<Override PartName="/xl/calcChain.xml"[^>]*/>', "", ct)
    parts["[Content_Types].xml"] = ct

    rels = parts["xl/_rels/workbook.xml.rels"]
    rels = re.sub(r'<Relationship Id="[^"]*" Type="[^"]*/calcChain" Target="calcChain.xml"/>', "", rels)
    parts["xl/_rels/workbook.xml.rels"] = rels

    wb = parts["xl/workbook.xml"]
    wb = re.sub(r"<mc:AlternateContent.*?</mc:AlternateContent>", "", wb, flags=re.S)
    wb = re.sub(r"<calcPr[^>]*/>", '<calcPr calcId="162913" fullCalcOnLoad="1"/>', wb)
    parts["xl/workbook.xml"] = wb

    sh = parts["xl/worksheets/sheet1.xml"]
    sh = sh.replace(' r:id="rId1"', "")
    parts["xl/worksheets/sheet1.xml"] = sh

    # Eski "YTL" sütun başlıkları güncel para birimiyle değiştirilir.
    parts["xl/sharedStrings.xml"] = parts["xl/sharedStrings.xml"].replace("YTL", "TL")

    for name, text in parts.items():
        assert "calcChain" not in text or name == "xl/workbook.xml", name

    src = SRC.read_text(encoding="utf-8")
    assert MARKER in src, "işaretçi bulunamadı"
    payload = json.dumps(parts, ensure_ascii=False).replace("</", "<\\/")
    OUT.write_text(src.replace(MARKER, payload), encoding="utf-8")
    print(f"{OUT.name} yazıldı ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
