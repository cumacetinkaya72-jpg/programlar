/* ==========================================================================
   EXCEL (.xlsx) OKUMA / YAZMA — harici kütüphane gerektirmez
   ========================================================================== */

const CRC_TABLO = (function () {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(u) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u.length; i++) c = CRC_TABLO[(c ^ u[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Sıkıştırmasız (store) ZIP arşivi
function zipOlustur(dosyalar, mime) {
  const enc = new TextEncoder();
  const parcalar = [], merkez = [];
  let ofset = 0;
  dosyalar.forEach(function (f) {
    const ad = enc.encode(f[0]), veri = typeof f[1] === "string" ? enc.encode(f[1]) : f[1], cr = crc32(veri);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
    h.setUint16(12, 33, true); h.setUint32(14, cr, true); h.setUint32(18, veri.length, true);
    h.setUint32(22, veri.length, true); h.setUint16(26, ad.length, true);
    parcalar.push(new Uint8Array(h.buffer), ad, veri);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(14, 33, true); c.setUint32(16, cr, true); c.setUint32(20, veri.length, true); c.setUint32(24, veri.length, true);
    c.setUint16(28, ad.length, true); c.setUint32(42, ofset, true);
    merkez.push(new Uint8Array(c.buffer), ad);
    ofset += 30 + ad.length + veri.length;
  });
  let mb = 0;
  merkez.forEach(function (p) { mb += p.length; });
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, dosyalar.length, true); e.setUint16(10, dosyalar.length, true);
  e.setUint32(12, mb, true); e.setUint32(16, ofset, true);
  return new Blob(parcalar.concat(merkez, [new Uint8Array(e.buffer)]), { type: mime || "application/zip" });
}

function xmlEsc(x) {
  return String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}
function sutunHarf(n) { let r = ""; while (n > 0) { const m = (n - 1) % 26; r = String.fromCharCode(65 + m) + r; n = Math.floor((n - 1) / 26); } return r; }

/* Stil numaraları:
   0 normal | 1 tablo başlığı (kalın, mavi dolgu, kenarlık, ortalı, kaydır) | 2 hücre (kenarlık, sol, kaydır)
   3 hücre (kenarlık, ortalı) | 4 büyük başlık (kalın 13, ortalı) | 5 kalın sol | 6 ortalı | 7 sağa yaslı
   8 kalın ortalı kenarlıklı | 9 metin biçimli kenarlıklı (numara/TCKN için) | 10 sol, kaydır (paragraf) */
const XLSX_STIL = (function () {
  const bd = '<border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border>';
  const xf = function (o) {
    return '<xf numFmtId="' + (o.num || 0) + '" fontId="' + (o.font || 0) + '" fillId="' + (o.fill || 0) + '" borderId="' + (o.border || 0) +
      '" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="' + (o.h || "general") +
      '" vertical="center"' + (o.wrap ? ' wrapText="1"' : "") + "/></xf>";
  };
  const xfs = [
    xf({}), xf({ font: 1, fill: 2, border: 1, h: "center", wrap: true }), xf({ border: 1, h: "left", wrap: true }), xf({ border: 1, h: "center", wrap: true }),
    xf({ font: 2, h: "center", wrap: true }), xf({ font: 1, h: "left" }), xf({ h: "center", wrap: true }), xf({ h: "right" }),
    xf({ font: 1, border: 1, h: "center", wrap: true }), xf({ num: 49, border: 1, h: "center" }), xf({ h: "left", wrap: true })
  ];
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="13"/><name val="Calibri"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDBEAFE"/></patternFill></fill></fills>' +
    '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' + bd + "</borders>" +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="' + xfs.length + '">' + xfs.join("") +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
})();

function sayfaXml(sf) {
  let sd = "";
  (sf.satirlar || []).forEach(function (satir, ri) {
    if (!satir) return;
    const r = ri + 1;
    let xml = "";
    satir.forEach(function (h, ci) {
      if (h === undefined) return;
      const a = sutunHarf(ci + 1) + r;
      const hc = (h !== null && typeof h === "object") ? h : { v: h };
      const st = hc.s != null ? hc.s : (sf.varsayilanStil || 0);
      if (hc.f) xml += '<c r="' + a + '" s="' + st + '"><f>' + xmlEsc(hc.f) + "</f>" + (hc.v != null ? "<v>" + xmlEsc(hc.v) + "</v>" : "") + "</c>";
      else if (typeof hc.v === "number") xml += '<c r="' + a + '" s="' + st + '"><v>' + hc.v + "</v></c>";
      else if (hc.v == null || hc.v === "") xml += '<c r="' + a + '" s="' + st + '"/>';
      else xml += '<c r="' + a + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(hc.v) + "</t></is></c>";
    });
    const ht = sf.yukseklik && sf.yukseklik[r];
    sd += '<row r="' + r + '"' + (ht ? ' ht="' + ht + '" customHeight="1"' : "") + ">" + xml + "</row>";
  });
  const dondur = sf.dondur ? '<pane ySplit="' + sf.dondur + '" topLeftCell="A' + (sf.dondur + 1) + '" activePane="bottomLeft" state="frozen"/>' : "";
  const cols = (sf.genislik || []).map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("");
  const birlesik = (sf.birlesik || []).length ? '<mergeCells count="' + sf.birlesik.length + '">' + sf.birlesik.map(function (m) { return '<mergeCell ref="' + m + '"/>'; }).join("") + "</mergeCells>" : "";
  const dv = (sf.dogrulama || []).length ? '<dataValidations count="' + sf.dogrulama.length + '">' + sf.dogrulama.map(function (d) {
    return '<dataValidation type="list" allowBlank="1" showErrorMessage="' + (d.serbest ? 0 : 1) + '" sqref="' + d.sqref + '"><formula1>"' + xmlEsc(d.liste.join(",")) + '"</formula1></dataValidation>';
  }).join("") + "</dataValidations>" : "";
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    (sf.sigdir ? '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' : "") +
    '<sheetViews><sheetView workbookViewId="0">' + dondur + '</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>' +
    (cols ? "<cols>" + cols + "</cols>" : "") + "<sheetData>" + sd + "</sheetData>" + birlesik + dv +
    '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>' +
    '<pageSetup paperSize="9" orientation="' + (sf.yatay ? "landscape" : "portrait") + '"' + (sf.sigdir ? ' fitToWidth="1" fitToHeight="0"' : "") + "/></worksheet>";
}

function xlsxOlustur(sayfalar) {
  const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const dosyalar = [
    ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      sayfalar.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("") +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="' + R + '/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ["xl/workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="' + R + '"><sheets>' +
      sayfalar.map(function (s, i) { return '<sheet name="' + xmlEsc(s.ad.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("") + "</sheets></workbook>"],
    ["xl/_rels/workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sayfalar.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="' + R + '/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join("") +
      '<Relationship Id="rId' + (sayfalar.length + 1) + '" Type="' + R + '/styles" Target="styles.xml"/></Relationships>'],
    ["xl/styles.xml", XLSX_STIL]
  ];
  sayfalar.forEach(function (s, i) { dosyalar.push(["xl/worksheets/sheet" + (i + 1) + ".xml", sayfaXml(s)]); });
  return zipOlustur(dosyalar, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function dosyaIndir(blob, ad) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function dosyaAdi(s) {
  return String(s || "IYEP").replace(/[ğĞ]/g, "g").replace(/[üÜ]/g, "u").replace(/[şŞ]/g, "s").replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o").replace(/[çÇ]/g, "c").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "IYEP";
}

/* ---------- okuma ---------- */
async function xlsxSatirlariOku(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const dv = new DataView(buf.buffer);
  const dec = new TextDecoder();
  let e = buf.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("Geçerli bir .xlsx dosyası değil.");
  const adet = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  const girdiler = {};
  for (let i = 0; i < adet; i++) {
    const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    girdiler[dec.decode(buf.subarray(p + 46, p + 46 + nl))] = { yontem: dv.getUint16(p + 10, true), boyut: dv.getUint32(p + 20, true), lho: dv.getUint32(p + 42, true) };
    p += 46 + nl + el + cl;
  }
  const oku = async function (ad) {
    const g = girdiler[ad];
    if (!g) return null;
    const n = dv.getUint16(g.lho + 26, true), x = dv.getUint16(g.lho + 28, true);
    const bas = g.lho + 30 + n + x, veri = buf.subarray(bas, bas + g.boyut);
    if (g.yontem === 0) return dec.decode(veri);
    if (typeof DecompressionStream === "undefined") throw new Error("Tarayıcınız sıkıştırılmış Excel dosyalarını açamıyor. Güncel Chrome / Edge / Firefox kullanın.");
    const akis = new Blob([veri]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return dec.decode(await new Response(akis).arrayBuffer());
  };
  const xml = function (s) { return new DOMParser().parseFromString(s, "application/xml"); };
  const etiket = function (node, n) { return Array.from(node.getElementsByTagNameNS("*", n)); };
  const ss = [];
  const ssXml = await oku("xl/sharedStrings.xml");
  if (ssXml) etiket(xml(ssXml), "si").forEach(function (si) { ss.push(etiket(si, "t").map(function (t) { return t.textContent; }).join("")); });
  let yol = "xl/worksheets/sheet1.xml";
  const wb = await oku("xl/workbook.xml"), rels = await oku("xl/_rels/workbook.xml.rels");
  if (wb && rels) {
    const ilk = etiket(xml(wb), "sheet")[0];
    const rid = ilk && (ilk.getAttribute("r:id") || ilk.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id"));
    const rel = etiket(xml(rels), "Relationship").find(function (r) { return r.getAttribute("Id") === rid; });
    if (rel) { const t = rel.getAttribute("Target"); yol = t.charAt(0) === "/" ? t.slice(1) : "xl/" + t.replace(/^\.\//, ""); }
  }
  const sh = await oku(yol);
  if (!sh) throw new Error("Çalışma sayfası okunamadı.");
  const satirlar = [];
  etiket(xml(sh), "row").forEach(function (row) {
    const dizi = [];
    etiket(row, "c").forEach(function (c) {
      const ref = (c.getAttribute("r") || "").replace(/[0-9]/g, "");
      let ci = 0;
      for (let k = 0; k < ref.length; k++) ci = ci * 26 + (ref.charCodeAt(k) - 64);
      const t = c.getAttribute("t"), vEl = etiket(c, "v")[0];
      let val = "";
      if (t === "s") val = vEl ? (ss[parseInt(vEl.textContent, 10)] || "") : "";
      else if (t === "inlineStr") val = etiket(c, "t").map(function (x) { return x.textContent; }).join("");
      else if (vEl) val = vEl.textContent;
      dizi[ci - 1] = String(val).trim();
    });
    satirlar.push(dizi);
  });
  return satirlar;
}
async function tabloDosyasiOku(file) {
  if (/\.xlsx$/i.test(file.name)) return xlsxSatirlariOku(file);
  if (/\.(csv|txt|tsv)$/i.test(file.name)) {
    const metin = (await file.text()).replace(/^﻿/, "");
    return metinSatirlari(metin);
  }
  throw new Error("Lütfen .xlsx veya .csv dosyası seçin. Eski .xls dosyalarını Excel'de \"Farklı Kaydet → .xlsx\" ile dönüştürebilirsiniz.");
}
function metinSatirlari(metin) {
  return metin.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) {
    const ayrac = l.indexOf("\t") >= 0 ? "\t" : (l.indexOf(";") >= 0 ? ";" : (l.split(",").length > 2 ? "," : null));
    const parca = ayrac ? l.split(ayrac) : l.trim().split(/\s{2,}/);
    return parca.map(function (x) { return x.replace(/^"|"$/g, "").trim(); });
  });
}
