/* ==========================================================================
   ÇEKİRDEK: veri modeli, saklama, yardımcılar, takvim motoru, uyum denetimi
   ========================================================================== */

const SURUM = "2026.1";
const STORAGE_KEY = "iyep2026_v1";
const ESKI_STORAGE_KEY = "iyep_pro_app_v3"; // 2022 yönergesine göre hazırlanmış eski sürüm
const GUN_KEYS = ["pzt", "sal", "car", "per", "cum", "cmt", "paz"];
const GUN_AD = { pzt: "Pazartesi", sal: "Salı", car: "Çarşamba", per: "Perşembe", cum: "Cuma", cmt: "Cumartesi", paz: "Pazar" };
const GUN_KISA = { pzt: "Pzt", sal: "Sal", car: "Çar", per: "Per", cum: "Cum", cmt: "Cmt", paz: "Paz" };
const HAFTA_SONU = { cmt: true, paz: true };
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

const DURUMLAR = {
  dahil: { ad: "Programa dâhil", kisa: "Dâhil", rozet: "green" },
  aday: { ad: "Komisyon kararı bekleniyor", kisa: "Aday", rozet: "amber" },
  dahil_degil: { ad: "Komisyonca dâhil edilmedi", kisa: "Dâhil değil", rozet: "gray" },
  ayrildi: { ad: "Programdan ayrıldı", kisa: "Ayrıldı", rozet: "red" }
};

function bosVeri() {
  return {
    surum: SURUM,
    settings: {
      il: "", ilce: "", okul: "", yil: "2026-2027",
      mudur: "", mudurYrd: "", rehber: "",
      obaTarihi: "", odaTarihi: "", baslama: "", bitis: "",
      yaziSayi: "",
      olurIlgi: "a) Millî Eğitim Bakanlığı İlkokullarda Yetiştirme Programı (İYEP), Türkiye Yüzyılı Maarif Modeli (2026).",
      grupIdeal: 6, grupMax: 10,
      varsayilanSinif: "3/A",
      tatiller: [],
      komisyon: [
        { gorev: "Komisyon Başkanı", ad: "", brans: "Okul Müdürü" },
        { gorev: "Üye", ad: "", brans: "Müdür Yardımcısı" },
        { gorev: "Üye", ad: "", brans: "Sınıf Öğretmeni" },
        { gorev: "Üye", ad: "", brans: "Sınıf Öğretmeni" },
        { gorev: "Üye", ad: "", brans: "Rehber Öğretmen / Psikolojik Danışman" }
      ],
      ilceKomisyon: { uyeler: [], mudur: "" },
      evrak: {},
      tutanak: {}
    },
    students: [],
    groups: [],
    ui: { tab: "dashboard", doc: "k_belirleme", docGrup: null, docUnit: null, docAy: null, izGrup: null, izUnit: null, takvimGrup: null }
  };
}

let appData = bosVeri();

/* ---------- yardımcılar ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function $(id) { return document.getElementById(id); }
function yeniId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function kopya(o) { return JSON.parse(JSON.stringify(o)); }
function sayi(v, d) { const n = parseInt(v, 10); return isNaN(n) ? (d || 0) : n; }
function trUpper(s) { return String(s || "").toLocaleUpperCase("tr-TR"); }
function trLower(s) { return String(s || "").toLocaleLowerCase("tr-TR"); }
function ilkHarfBuyuk(s) { s = trLower(s); return s.replace(/(^|\s)(\S)/g, function (m, a, b) { return a + trUpper(b); }); }
function bosNokta(v, uzun) { return v ? esc(v) : (uzun ? "..............................." : "................"); }
function siralaTr(a, b) { return String(a).localeCompare(String(b), "tr", { numeric: true }); }

/* ---------- tarih ---------- */
// Uygulama tarihleri ISO (yyyy-aa-gg) olarak saklar, belgelerde gg.aa.yyyy gösterir.
function isoParse(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}
function isoFormat(d) {
  if (!d) return "";
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function trTarih(v) {
  const d = v instanceof Date ? v : isoParse(v);
  if (!d) return "";
  return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + d.getFullYear();
}
function trTarihUzun(v) {
  const d = v instanceof Date ? v : isoParse(v);
  if (!d) return "";
  return d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear();
}
function tarihVeyaNokta(v) { return trTarih(v) || "..../..../20....."; }
function gunKey(d) { return GUN_KEYS[(d.getDay() + 6) % 7]; }
function gunEkle(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
function haftaBasi(d) { return gunEkle(d, -((d.getDay() + 6) % 7)); }
function bugunIso() { return isoFormat(new Date()); }

/* ---------- birimler (öğrenme alanı / tema) ---------- */
function siraliUnits(ids) {
  return (ids || []).filter(function (id) { return UNIT[id]; }).sort(function (a, b) { return UNIT_IDS.indexOf(a) - UNIT_IDS.indexOf(b); });
}
function unitSaatToplam(ids) { return siraliUnits(ids).reduce(function (a, id) { return a + UNIT[id].saat; }, 0); }
function dersUnits(ids, ders) { return siraliUnits(ids).filter(function (id) { return UNIT[id].ders === ders; }); }
function unitEtiket(ids, uzun) {
  const s = siraliUnits(ids);
  if (!s.length) return "–";
  return s.map(function (id) { return uzun ? UNIT[id].baslik + " (" + UNIT[id].ad + ")" : UNIT[id].kisa; }).join(", ");
}
function unitKodlar(ids) {
  // T1 T2 M3 M4 → "T1–T2, M3–M4" kısa gösterim
  const out = [];
  ["TR", "MAT"].forEach(function (ders) {
    const s = dersUnits(ids, ders);
    if (!s.length) return;
    if (s.length > 1 && UNIT_IDS.indexOf(s[s.length - 1]) - UNIT_IDS.indexOf(s[0]) === s.length - 1) out.push(s[0] + "–" + s[s.length - 1]);
    else out.push(s.join(" "));
  });
  return out.join(", ") || "–";
}
// "T1 T2 M3-M4", "T1+ M2+", "T 1-2" gibi kodları çözer
function kodCoz(metin) {
  const sonuc = [];
  const s = trUpper(metin).replace(/TÜRKÇE|TR/g, "T").replace(/MATEMATİK|MAT/g, "M");
  const re = /([TM])\s*([1-4])(?:\s*[-–]\s*[TM]?\s*([1-4]))?(\+)?/g;
  let m;
  while ((m = re.exec(s))) {
    const harf = m[1], bas = +m[2], max = harf === "T" ? 2 : 4;
    let bit = m[3] ? +m[3] : (m[4] ? max : bas);
    if (bas > max) continue;
    bit = Math.min(bit, max);
    for (let i = bas; i <= bit; i++) sonuc.push(harf + i);
  }
  return siraliUnits(Array.from(new Set(sonuc)));
}

/* ---------- öğrenci / grup sorguları ---------- */
function ogrenci(id) { return appData.students.find(function (s) { return s.id === id; }); }
function grup(id) { return appData.groups.find(function (g) { return g.id === id; }); }
function dahilOgrenciler() { return appData.students.filter(function (s) { return s.durum === "dahil"; }); }
function grupOgrencileri(g, hepsi) {
  return (g.ogrenciler || []).map(ogrenci).filter(function (s) { return s && (hepsi || s.durum === "dahil"); })
    .sort(function (a, b) { return siralaTr(a.no, b.no); });
}
function ogrenciGruplari(st) { return appData.groups.filter(function (g) { return (g.ogrenciler || []).indexOf(st.id) >= 0; }); }
function ogrenciDersleri(st) {
  const d = [];
  if (dersUnits(st.units, "TR").length) d.push("TR");
  if (dersUnits(st.units, "MAT").length) d.push("MAT");
  return d;
}
function haftalikSaat(gunler) { return GUN_KEYS.reduce(function (a, k) { return a + sayi((gunler || {})[k]); }, 0); }
function grupSaatToplam(g) { return unitSaatToplam(g.units); }
function hedefEtiket(st) {
  return (st.hedef || []).map(function (k) { const h = HEDEF_KITLE.find(function (x) { return x.k === k; }); return h ? h.kisa : k; }).join(", ") || "–";
}

/* ---------- saklama ---------- */
let kayitZamanlayici = null;
function kaydet(sessiz) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    if (!sessiz) bildir("Değişiklikler kaydedildi.");
  } catch (e) {
    bildir("Kaydedilemedi: tarayıcı depolaması kullanılamıyor. Yedek (JSON) almayı unutmayın.", "hata");
  }
}
function gecikmeliKaydet() {
  clearTimeout(kayitZamanlayici);
  kayitZamanlayici = setTimeout(function () { kaydet(true); }, 400);
}
function veriNormalize(d) {
  const b = bosVeri();
  d = d || {};
  d.settings = Object.assign({}, b.settings, d.settings || {});
  ["tatiller", "komisyon"].forEach(function (k) { if (!Array.isArray(d.settings[k])) d.settings[k] = b.settings[k]; });
  d.settings.ilceKomisyon = Object.assign({ uyeler: [], mudur: "" }, d.settings.ilceKomisyon || {});
  if (!Array.isArray(d.settings.ilceKomisyon.uyeler)) d.settings.ilceKomisyon.uyeler = [];
  d.settings.evrak = d.settings.evrak || {};
  d.settings.tutanak = d.settings.tutanak || {};
  d.students = Array.isArray(d.students) ? d.students : [];
  d.groups = Array.isArray(d.groups) ? d.groups : [];
  d.students.forEach(function (s) {
    s.id = s.id || yeniId();
    s.units = siraliUnits(s.units || []);
    s.hedef = Array.isArray(s.hedef) ? s.hedef : ["yetersiz"];
    s.durum = DURUMLAR[s.durum] ? s.durum : "aday";
    s.oda = Object.assign({ TR: "", MAT: "" }, s.oda || {});
    s.izleme = s.izleme || {};
    s.pg = s.pg || {};
    s.ozel = !!s.ozel;
  });
  const idler = {};
  d.students.forEach(function (s) { idler[s.id] = true; });
  d.groups.forEach(function (g) {
    g.id = g.id || yeniId();
    g.ders = g.ders === "MAT" ? "MAT" : "TR";
    g.units = dersUnits(g.units || [], g.ders);
    g.gunler = Object.assign({ pzt: 0, sal: 0, car: 0, per: 0, cum: 0, cmt: 0, paz: 0 }, g.gunler || {});
    g.ogrenciler = (g.ogrenciler || []).filter(function (id) { return idler[id]; });
    g.planNot = g.planNot || {};
    g.yansitma = g.yansitma || {};
    g.rehberlik = g.rehberlik || {};
    delete g.gorevTuru;
  });
  d.ui = Object.assign({}, b.ui, d.ui || {});
  d.surum = SURUM;
  return d;
}
function veriYukle() {
  let ham = null;
  try { ham = localStorage.getItem(STORAGE_KEY); } catch (e) { ham = null; }
  if (ham) {
    try { appData = veriNormalize(JSON.parse(ham)); return "kayit"; } catch (e) { console.error(e); }
  }
  appData = veriNormalize(ornekVeri());
  return "ornek";
}
function eskiVeriVarMi() {
  try { return !!localStorage.getItem(ESKI_STORAGE_KEY); } catch (e) { return false; }
}

/* ---------- eski sürümden (2022 yönergesi) aktarım ----------
   Okul bilgileri, komisyonlar ve öğrenci kimlik bilgileri taşınır. Eski modül
   bilgileri yeni programda karşılığı olmadığından taşınmaz; yeni ÖBA
   sonuçlarına göre öğrenme alanı / tema seçilmelidir. */
function eskiFormatMi(d) {
  return d && d.settings && Array.isArray(d.settings.commission) && Array.isArray(d.students) &&
    d.students.some(function (s) { return "turkce" in s || "komisyonDurum" in s; });
}
function eskiVeriDonustur(eski) {
  const yeni = bosVeri();
  const s = eski.settings || {};
  Object.assign(yeni.settings, {
    il: s.il || "", ilce: s.ilce || "", okul: s.okul || "", mudur: s.mudur || "", yaziSayi: s.yaziSayi || ""
  });
  if (Array.isArray(s.commission) && s.commission.length) {
    yeni.settings.komisyon = s.commission.map(function (c) { return { gorev: c.role || "Üye", ad: c.name || "", brans: c.branch || "" }; });
  }
  if (s.ilceKomisyon && Array.isArray(s.ilceKomisyon.uyeler)) {
    yeni.settings.ilceKomisyon = {
      uyeler: s.ilceKomisyon.uyeler.map(function (u) { return { ad: u.name || "", unvan: u.title || "" }; }),
      mudur: s.ilceKomisyon.mudur || ""
    };
  }
  yeni.students = (eski.students || []).map(function (st) {
    return {
      id: yeniId(), no: String(st.no || ""), ad: st.name || "", sinif: st.stClass || "", ogretmen: st.teacher || "",
      ozel: st.ozelEgitim === "var", hedef: ["yetersiz"], units: [], durum: "aday",
      gerekce: "", veli: "", not: "Önceki sürümden aktarıldı; yeni ÖBA sonucuna göre öğrenme alanı / tema seçiniz."
    };
  });
  return veriNormalize(yeni);
}

/* ---------- örnek veri (kurgusal) ---------- */
function ornekVeri() {
  const d = bosVeri();
  Object.assign(d.settings, {
    il: "ÖRNEK", ilce: "MERKEZ", okul: "ATATÜRK İLKOKULU", yil: "2026-2027",
    mudur: "Ali YILMAZ", mudurYrd: "Ayşe KAYA", rehber: "Elif DEMİR",
    obaTarihi: "2026-10-14", baslama: "2026-10-26", bitis: "2027-05-28", odaTarihi: "2027-06-02",
    yaziSayi: "12345678-135.04-",
    tatiller: [
      { ad: "1. Dönem Ara Tatili", bas: "2026-11-09", bit: "2026-11-13" },
      { ad: "Yarıyıl Tatili", bas: "2027-01-25", bit: "2027-02-05" },
      { ad: "2. Dönem Ara Tatili", bas: "2027-03-15", bit: "2027-03-19" }
    ],
    komisyon: [
      { gorev: "Komisyon Başkanı", ad: "Ali YILMAZ", brans: "Okul Müdürü" },
      { gorev: "Üye", ad: "Ayşe KAYA", brans: "Müdür Yardımcısı" },
      { gorev: "Üye", ad: "Mehmet ÖZ", brans: "Sınıf Öğretmeni" },
      { gorev: "Üye", ad: "Zeynep ARSLAN", brans: "Sınıf Öğretmeni" },
      { gorev: "Üye", ad: "Elif DEMİR", brans: "Rehber Öğretmen / Psikolojik Danışman" }
    ],
    ilceKomisyon: {
      uyeler: [{ ad: "Hasan ÇELİK", unvan: "Şube Müdürü (Başkan)" }, { ad: "Fatma ŞAHİN", unvan: "Okul Müdürü (Üye)" }, { ad: "Murat KOÇ", unvan: "Rehber Öğretmen (Üye)" }],
      mudur: "Kemal AYDIN"
    }
  });
  const ad = [
    ["101", "Deniz AKTAŞ", "3/A", "Mehmet ÖZ", "T1 T2 M1+", ["yetersiz"]],
    ["102", "Ece BULUT", "3/A", "Mehmet ÖZ", "T1 T2", ["yetersiz"]],
    ["103", "Kerem ÇINAR", "3/A", "Mehmet ÖZ", "M2+", ["yetersiz"]],
    ["104", "Mira DOĞAN", "3/A", "Mehmet ÖZ", "T2 M3+", ["gocmen"]],
    ["105", "Ömer ERDEM", "3/A", "Mehmet ÖZ", "M3+", ["yetersiz"]],
    ["106", "Selin GÜNEŞ", "3/A", "Mehmet ÖZ", "T2", ["mevsimlik"]],
    ["201", "Yusuf HAN", "3/B", "Zeynep ARSLAN", "T1 T2 M1+", ["gecici"]],
    ["202", "Ada IŞIK", "3/B", "Zeynep ARSLAN", "T2 M4", ["yetersiz"]],
    ["203", "Berk KARA", "3/B", "Zeynep ARSLAN", "M3+", ["yetersiz"]],
    ["204", "Nehir OK", "3/B", "Zeynep ARSLAN", "T1 T2", ["gocmen"]],
    ["205", "Emir POLAT", "3/B", "Zeynep ARSLAN", "M2+", ["yetersiz"], "dahil_degil", "Komisyon incelemesinde ÖBA sonucunun ölçme hatasından kaynaklandığı değerlendirildi."],
    ["206", "Lina SARI", "3/B", "Zeynep ARSLAN", "T2", ["yetersiz"], "aday"]
  ];
  d.students = ad.map(function (r) {
    return { id: yeniId(), no: r[0], ad: r[1], sinif: r[2], ogretmen: r[3], units: kodCoz(r[4]), hedef: r[5], ozel: false,
      durum: r[6] || "dahil", gerekce: r[7] || "", veli: "onay", not: "", oda: { TR: "", MAT: "" }, izleme: {}, pg: {} };
  });
  const byNo = function (nolar) { return nolar.map(function (n) { return d.students.find(function (s) { return s.no === n; }).id; }); };
  d.groups = [
    { id: yeniId(), ad: "Türkçe-1", ders: "TR", units: ["T1", "T2"], ogretmen: "Mehmet ÖZ", tc: "", kadro: "Kadrolu", brans: "Sınıf Öğretmeni",
      normalSaat: 30, digerKurs: 0, calismaSaatleri: "15:00 - 16:20", derslik: "3/A Sınıfı", gunler: { pzt: 2, sal: 0, car: 2, per: 0, cum: 2, cmt: 0, paz: 0 },
      ogrenciler: byNo(["101", "102", "201", "204"]) },
    { id: yeniId(), ad: "Türkçe-2", ders: "TR", units: ["T2"], ogretmen: "Zeynep ARSLAN", tc: "", kadro: "Kadrolu", brans: "Sınıf Öğretmeni",
      normalSaat: 30, digerKurs: 0, calismaSaatleri: "15:00 - 16:20", derslik: "3/B Sınıfı", gunler: { pzt: 0, sal: 2, car: 0, per: 2, cum: 0, cmt: 0, paz: 0 },
      ogrenciler: byNo(["104", "106", "202"]) },
    { id: yeniId(), ad: "Matematik-1", ders: "MAT", units: ["M1", "M2", "M3", "M4"], ogretmen: "Zeynep ARSLAN", tc: "", kadro: "Kadrolu", brans: "Sınıf Öğretmeni",
      normalSaat: 30, digerKurs: 0, calismaSaatleri: "15:00 - 16:20", derslik: "3/B Sınıfı", gunler: { pzt: 0, sal: 2, car: 0, per: 2, cum: 0, cmt: 0, paz: 0 },
      ogrenciler: byNo(["101", "103", "201", "203"]) },
    { id: yeniId(), ad: "Matematik-2", ders: "MAT", units: ["M3", "M4"], ogretmen: "Mehmet ÖZ", tc: "", kadro: "Kadrolu", brans: "Sınıf Öğretmeni",
      normalSaat: 30, digerKurs: 0, calismaSaatleri: "16:30 - 17:10", derslik: "3/A Sınıfı", gunler: { pzt: 1, sal: 0, car: 1, per: 0, cum: 1, cmt: 2, paz: 0 },
      ogrenciler: byNo(["104", "105", "202"]) }
  ];
  // birkaç izleme kaydı (örnek)
  const s101 = d.students[0];
  s101.izleme = { "İ.T.D.2.1": "E", "İ.T.D.2.2": "G", "İ.T.O.2.1": "G" };
  d.ui.doc = "k_belirleme";
  return d;
}

/* ---------- uygulama takvimi motoru ----------
   Grubun öğrenme alanı / temalarını, haftalık ders dağılımına göre başlangıç
   tarihinden itibaren tatil günlerini atlayarak takvime yerleştirir. Matematik
   temalarında süre, öğrenme çıktılarına sırasıyla eşit paylaştırılır (öneri);
   Türkçe öğrenme alanlarında beceriler bütünleşik işlendiğinden saat, öğrenme
   alanının tamamına aittir. */
function tatilMi(d, tatiller) {
  const t = isoFormat(d);
  return (tatiller || []).some(function (x) { return x.bas && t >= x.bas && t <= (x.bit || x.bas); });
}
function unitSaatDilimleri(uid) {
  const u = UNIT[uid];
  const dilim = [];
  if (u.ders === "MAT") {
    const n = u.ciktilar.length, taban = Math.floor(u.saat / n);
    let artan = u.saat - taban * n;
    u.ciktilar.forEach(function (c) {
      const h = taban + (artan > 0 ? 1 : 0);
      if (artan > 0) artan--;
      for (let i = 0; i < h; i++) dilim.push({ unit: uid, oc: c.kod });
    });
  } else {
    for (let i = 0; i < u.saat; i++) dilim.push({ unit: uid, oc: null });
  }
  dilim[0].ilk = true;
  dilim[dilim.length - 1].son = true;
  return dilim;
}
function grupPlan(g) {
  const s = appData.settings;
  const units = siraliUnits(g.units);
  const dilimler = [];
  units.forEach(function (uid) { unitSaatDilimleri(uid).forEach(function (x) { dilimler.push(x); }); });
  const sonuc = { saatler: [], oturumlar: [], haftalar: [], bitis: null, toplam: dilimler.length, hata: "" };
  const bas = isoParse(g.baslama || s.baslama);
  const haftalik = haftalikSaat(g.gunler);
  if (!dilimler.length) { sonuc.hata = "Grupta öğrenme alanı / tema seçilmemiş."; return sonuc; }
  if (!bas) { sonuc.hata = "Program başlama tarihi girilmemiş (Okul & Komisyon ayarları)."; return sonuc; }
  if (!haftalik) { sonuc.hata = "Haftalık ders dağılımı girilmemiş."; return sonuc; }
  let d = bas, i = 0, guvenlik = 0;
  while (i < dilimler.length && guvenlik < 1100) {
    guvenlik++;
    const k = gunKey(d), h = sayi(g.gunler[k]);
    if (h > 0 && !tatilMi(d, s.tatiller)) {
      const ot = { tarih: d, iso: isoFormat(d), gun: k, saatler: [] };
      for (let j = 0; j < h && i < dilimler.length; j++, i++) {
        const sa = Object.assign({ tarih: d, iso: ot.iso, gun: k, sira: j + 1, no: i + 1 }, dilimler[i]);
        ot.saatler.push(sa);
        sonuc.saatler.push(sa);
      }
      sonuc.oturumlar.push(ot);
    }
    d = gunEkle(d, 1);
  }
  if (i < dilimler.length) sonuc.hata = "Takvim iki yılı aşıyor; haftalık ders dağılımını kontrol edin.";
  sonuc.bitis = sonuc.oturumlar.length ? sonuc.oturumlar[sonuc.oturumlar.length - 1].tarih : null;
  // haftalara böl
  const hMap = {};
  sonuc.oturumlar.forEach(function (ot) {
    const hb = isoFormat(haftaBasi(ot.tarih));
    if (!hMap[hb]) { hMap[hb] = { bas: haftaBasi(ot.tarih), oturumlar: [], saatler: [] }; sonuc.haftalar.push(hMap[hb]); }
    hMap[hb].oturumlar.push(ot);
    ot.saatler.forEach(function (x) { hMap[hb].saatler.push(x); });
  });
  sonuc.haftalar.forEach(function (h, idx) {
    h.no = idx + 1;
    h.bit = gunEkle(h.bas, 6);
    h.units = siraliUnits(Array.from(new Set(h.saatler.map(function (x) { return x.unit; }))));
    h.ocs = [];
    h.saatler.forEach(function (x) { if (x.oc && h.ocs.indexOf(x.oc) < 0) h.ocs.push(x.oc); });
    h.ilk = h.saatler.filter(function (x) { return x.ilk; }).map(function (x) { return x.unit; });
    h.son = h.saatler.filter(function (x) { return x.son; }).map(function (x) { return x.unit; });
    h.kumulatif = h.saatler[h.saatler.length - 1].no;
  });
  return sonuc;
}
const planOnbellek = {};
function grupPlanCache(g) {
  const anahtar = JSON.stringify([g.units, g.gunler, g.baslama, appData.settings.baslama, appData.settings.tatiller]);
  const c = planOnbellek[g.id];
  if (c && c.anahtar === anahtar) return c.plan;
  const plan = grupPlan(g);
  planOnbellek[g.id] = { anahtar: anahtar, plan: plan };
  return plan;
}
function unitTarihAraligi(plan, uid) {
  const x = plan.saatler.filter(function (s) { return s.unit === uid; });
  if (!x.length) return null;
  return { bas: x[0].tarih, bit: x[x.length - 1].tarih };
}

/* ---------- uyum denetimi (İYEP 2026, 1.1 ve 1.2) ---------- */
function gunLimit(k) { return HAFTA_SONU[k] ? KURAL.haftaSonuGunluk : KURAL.haftaIciGunluk; }
function gunlerDenetle(gunler) {
  const sorun = [];
  GUN_KEYS.forEach(function (k) {
    const h = sayi(gunler[k]);
    if (h > gunLimit(k)) sorun.push(GUN_AD[k] + " " + h + " saat (en fazla " + gunLimit(k) + ")");
  });
  const t = haftalikSaat(gunler);
  if (t > KURAL.haftalik) sorun.push("haftalık " + t + " saat (en fazla " + KURAL.haftalik + ")");
  return sorun;
}
function ogrenciYuk(st) {
  const y = { pzt: 0, sal: 0, car: 0, per: 0, cum: 0, cmt: 0, paz: 0 };
  ogrenciGruplari(st).forEach(function (g) { GUN_KEYS.forEach(function (k) { y[k] += sayi(g.gunler[k]); }); });
  return y;
}
function uyumDenetimi() {
  const s = appData.settings;
  const liste = []; // {seviye: 'hata'|'uyari'|'bilgi', metin, hedef}
  const ekle = function (seviye, metin, hedef) { liste.push({ seviye: seviye, metin: metin, hedef: hedef || "" }); };

  appData.groups.forEach(function (g) {
    const sorun = gunlerDenetle(g.gunler);
    if (sorun.length) ekle("hata", g.ad + ": ders saati sınırı aşıldı (" + sorun.join("; ") + "). İYEP 1.2: hafta içi günde 2, hafta sonu günde 6, haftada toplam 10 ders saatini geçemez.", "groups");
    if (!haftalikSaat(g.gunler)) ekle("uyari", g.ad + ": haftalık ders dağılımı girilmemiş.", "groups");
    if (!g.units.length) ekle("uyari", g.ad + ": öğrenme alanı / tema seçilmemiş.", "groups");
    if (!g.ogretmen) ekle("uyari", g.ad + ": görevli öğretmen girilmemiş.", "groups");
    const ogr = grupOgrencileri(g);
    if (!ogr.length) ekle("uyari", g.ad + ": grupta programa dâhil öğrenci yok.", "groups");
    if (ogr.length > sayi(s.grupMax, 10)) ekle("uyari", g.ad + ": " + ogr.length + " öğrenci var; okul ayarlarındaki üst sınır " + s.grupMax + ".", "groups");
    const yabanci = ogr.filter(function (st) { return st.ogretmen && g.ogretmen && trLower(st.ogretmen) !== trLower(g.ogretmen); });
    if (yabanci.length) {
      ekle("bilgi", g.ad + ": " + yabanci.length + " öğrenci için öğretmen, öğrencinin kendi sınıf öğretmeni değil (İYEP 1.2: kendi sınıf öğretmeni önceliklidir).", "groups");
    }
    const ihtiyac = {};
    ogr.forEach(function (st) { dersUnits(st.units, g.ders).forEach(function (u) { ihtiyac[u] = true; }); });
    const fazla = g.units.filter(function (u) { return !ihtiyac[u]; });
    if (fazla.length && ogr.length) ekle("bilgi", g.ad + ": " + fazla.map(function (u) { return UNIT[u].kisa; }).join(", ") + " hiçbir öğrencinin ihtiyacında yok.", "groups");
    const plan = grupPlanCache(g);
    const bitis = isoParse(s.bitis);
    if (plan.bitis && bitis && plan.bitis > bitis) ekle("uyari", g.ad + ": takvime göre program " + trTarih(plan.bitis) + " tarihinde tamamlanıyor; planlanan bitiş (" + trTarih(bitis) + ") aşılıyor. Haftalık saati artırmayı değerlendirin.", "takvim");
  });

  dahilOgrenciler().forEach(function (st) {
    if (st.ozel) ekle("hata", st.ad + ": özel eğitim ihtiyacı işaretli öğrenci programa dâhil. İYEP hedef kitlesi özel eğitime ihtiyaç duymayan öğrencilerdir (İYEP 1.1).", "students");
    if (!st.units.length) ekle("uyari", st.ad + ": ÖBA sonucuna göre öğrenme alanı / tema seçilmemiş.", "students");
    const gr = ogrenciGruplari(st);
    const kapsanan = {};
    gr.forEach(function (g) { g.units.forEach(function (u) { kapsanan[u] = true; }); });
    const eksik = st.units.filter(function (u) { return !kapsanan[u]; });
    if (st.units.length && !gr.length) ekle("uyari", st.ad + ": hiçbir gruba atanmamış.", "groups");
    else if (eksik.length) ekle("uyari", st.ad + ": " + eksik.map(function (u) { return UNIT[u].kisa; }).join(", ") + " için grup yok.", "groups");
    const y = ogrenciYuk(st);
    const sorun = gunlerDenetle(y);
    if (gr.length > 1 && sorun.length) ekle("hata", st.ad + ": katıldığı grupların toplamında ders saati sınırı aşılıyor (" + sorun.join("; ") + ").", "groups");
    if (st.veli === "ret") ekle("uyari", st.ad + ": veli onay vermedi olarak işaretli ancak öğrenci programa dâhil.", "students");
  });
  const aday = appData.students.filter(function (st) { return st.durum === "aday"; });
  if (aday.length) ekle("bilgi", aday.length + " öğrenci için İYEP Okul Komisyonu kararı bekleniyor.", "students");
  if (!s.baslama) ekle("uyari", "Program başlama tarihi girilmemiş.", "settings");
  if (!s.okul) ekle("uyari", "Okul adı girilmemiş.", "settings");
  return liste;
}

/* ---------- süreç adımları ---------- */
function surecAdimlari() {
  const s = appData.settings, dahil = dahilOgrenciler();
  const sorunlar = uyumDenetimi();
  const atanmamis = dahil.filter(function (st) {
    const k = {};
    ogrenciGruplari(st).forEach(function (g) { g.units.forEach(function (u) { k[u] = true; }); });
    return !st.units.length || st.units.some(function (u) { return !k[u]; });
  });
  const izlemeVar = dahil.some(function (st) { return Object.keys(st.izleme || {}).some(function (k) { return st.izleme[k]; }); });
  let pgGerek = 0, pgVar = 0;
  appData.groups.forEach(function (g) {
    const ogr = grupOgrencileri(g);
    if (!ogr.length) return;
    g.units.forEach(function (u) {
      pgGerek++;
      if (ogr.some(function (st) { return st.pg && st.pg[u] && st.pg[u].puan; })) pgVar++;
    });
  });
  const odaTam = dahil.length > 0 && dahil.every(function (st) { return ogrenciDersleri(st).every(function (d) { return st.oda[d]; }); });
  return [
    { ad: "Okul bilgileri ve İYEP Okul Komisyonu", tamam: !!s.okul && s.komisyon.filter(function (k) { return k.ad; }).length >= 3, tab: "settings" },
    { ad: "ÖBA sonuçları (öğrenme alanı / tema ihtiyacı)", tamam: appData.students.some(function (st) { return st.units.length; }), tab: "students" },
    { ad: "Komisyon kararı (dâhil edilecek öğrenciler)", tamam: dahil.length > 0 && !appData.students.some(function (st) { return st.durum === "aday"; }), tab: "students" },
    { ad: "Gruplar ve öğretmen görevlendirmeleri", tamam: dahil.length > 0 && appData.groups.length > 0 && !atanmamis.length, tab: "groups" },
    { ad: "Haftalık ders dağılımı ve takvim (2 / 6 / 10 kuralı)", tamam: appData.groups.length > 0 && appData.groups.every(function (g) { return haftalikSaat(g.gunler) > 0; }) && !sorunlar.some(function (x) { return x.seviye === "hata"; }) && !!s.baslama, tab: "takvim" },
    { ad: "Süreç izleme (öğrenme kanıtları)", tamam: izlemeVar, tab: "izleme" },
    { ad: "Her öğrenme alanı / tema için performans görevi", tamam: pgGerek > 0 && pgVar === pgGerek, tab: "izleme", detay: pgVar + " / " + pgGerek },
    { ad: "ÖDA ile program sonu düzey belirleme", tamam: odaTam, tab: "izleme" }
  ];
}
