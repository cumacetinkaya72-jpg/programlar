// İYEP Yönetim Sistemi – tarayıcı duman testleri (Playwright + Chromium)
// Kullanım: node tests/smoke.cjs [ekran-görüntüsü-klasörü]
// Playwright genel kurulu ise: NODE_PATH="$(npm root -g)" node tests/smoke.cjs
const path = require("path");
const fs = require("fs");
const os = require("os");
const { chromium } = require("playwright");

const HTML = path.join(__dirname, "..", "iyep_yonetim_sistemi.html");
const SHOTS = process.argv[2] || "";
let gecen = 0, kalan = 0;
function dogrula(kosul, ad, ayrinti) {
  if (kosul) { gecen++; } else { kalan++; console.error("✗ " + ad + (ayrinti !== undefined ? " → " + JSON.stringify(ayrinti) : "")); }
}

(async () => {
  const exe = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const hatalar = [];
  page.on("pageerror", (e) => hatalar.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") hatalar.push("console: " + m.text()); });
  page.on("dialog", (d) => d.accept());
  const url = "file://" + HTML;
  await page.goto(url);
  await page.waitForSelector("#tab-dashboard.active");
  const shot = async (ad) => { if (SHOTS) await page.waitForTimeout(350); if (SHOTS) await page.screenshot({ path: path.join(SHOTS, ad + ".png"), fullPage: true }); };

  // --- program verisi PDF tablolarıyla tutarlı mı? (İYEP 2026, 1.4)
  const veri = await page.evaluate(() => ({
    tr: TOPLAM_SAAT.TR, mat: TOPLAM_SAAT.MAT,
    ocT1: UNIT.T1.ciktilar.length, ocT2: UNIT.T2.ciktilar.length,
    ocMat: MAT_UNITS.map((u) => u.ciktilar.length),
    saat: UNITS.map((u) => u.saat),
    beceri: ["D", "K", "O", "Y"].map((b) => [2, 3].map((s) => UNITS.filter((u) => u.ders === "TR").reduce((a, u) => a + u.ciktilar.filter((c) => c.kod.startsWith("İ.T." + b + "." + s + ".")).length, 0))),
    tablo1: TR_BECERI_DAGILIM.map((r) => [r.s2, r.s3]),
    metin: Object.keys(PROGRAM_METIN).length
  }));
  dogrula(veri.tr === 94 && veri.mat === 66, "Toplam saatler 94 / 66", veri);
  dogrula(veri.ocT1 === 8 && veri.ocT2 === 12, "Türkçe ÖÇ sayıları 8 / 12", veri);
  dogrula(JSON.stringify(veri.ocMat) === "[3,3,3,3]", "Matematik ÖÇ sayıları", veri.ocMat);
  dogrula(JSON.stringify(veri.saat) === "[68,26,10,10,12,34]", "Birim saatleri", veri.saat);
  dogrula(JSON.stringify(veri.beceri) === JSON.stringify(veri.tablo1), "Tablo 1 beceri dağılımı", veri);
  dogrula(veri.metin === 6, "Program metinleri 6 birim");

  // --- yardımcılar
  const birim = await page.evaluate(() => ({
    a: kodCoz("T1+ M2-M4"), b: kodCoz("t2, m4"), c: kodCoz("M3+"), d: kodCoz("Türkçe 1-2"),
    lim1: gunlerDenetle({ pzt: 3 }).length, lim2: gunlerDenetle({ cmt: 6, pzt: 2, sal: 2 }).length, lim3: gunlerDenetle({ cmt: 7 }).length,
    lim4: gunlerDenetle({ pzt: 2, sal: 2, car: 2, per: 2, cum: 2, cmt: 1 }).length,
    tarih: trTarih("2026-10-26"), parse: isoFormat(isoParse("05.01.2027"))
  }));
  dogrula(JSON.stringify(birim.a) === '["T1","T2","M2","M3","M4"]', "kodCoz aralık", birim.a);
  dogrula(JSON.stringify(birim.b) === '["T2","M4"]', "kodCoz küçük harf", birim.b);
  dogrula(JSON.stringify(birim.c) === '["M3","M4"]', "kodCoz artı", birim.c);
  dogrula(JSON.stringify(birim.d) === '["T1","T2"]', "kodCoz Türkçe sözcüğü", birim.d);
  dogrula(birim.lim1 === 1 && birim.lim2 === 0 && birim.lim3 === 1 && birim.lim4 === 1, "2/6/10 kuralı", birim);
  dogrula(birim.tarih === "26.10.2026" && birim.parse === "2027-01-05", "Tarih biçimleri", birim);

  // --- örnek veri ve takvim motoru
  const plan = await page.evaluate(() => {
    const g = appData.groups.find((x) => x.ad === "Türkçe-1");
    const p = grupPlan(g);
    const tatil = p.saatler.some((s) => tatilMi(s.tarih, appData.settings.tatiller));
    const gunHata = p.oturumlar.some((o) => o.saatler.length > (g.gunler[o.gun] || 0));
    const m = grupPlan(appData.groups.find((x) => x.ad === "Matematik-1"));
    const ocDag = {};
    m.saatler.forEach((s) => { ocDag[s.oc] = (ocDag[s.oc] || 0) + 1; });
    return { toplam: p.toplam, saat: p.saatler.length, tatil, gunHata, ilk: p.oturumlar[0].iso, haftalar: p.haftalar.length, ocDag, mToplam: m.toplam };
  });
  dogrula(plan.toplam === 94 && plan.saat === 94, "Türkçe-1 planı 94 saat", plan);
  dogrula(!plan.tatil, "Takvim tatilleri atlıyor", plan);
  dogrula(!plan.gunHata, "Takvim günlük dağılıma uyuyor", plan);
  dogrula(plan.ilk === "2026-10-26", "Takvim başlangıcı", plan.ilk);
  dogrula(plan.mToplam === 66 && plan.ocDag["İ.MAT.1.1"] === 4 && plan.ocDag["İ.MAT.4.1"] === 12 && plan.ocDag["İ.MAT.4.3"] === 11, "Matematik ÖÇ saat dağılımı", plan.ocDag);
  const sayac = await page.textContent("#cntSt");
  dogrula(sayac === "12", "Örnek veride 12 öğrenci", sayac);
  const uyum = await page.evaluate(() => uyumDenetimi().filter((x) => x.seviye === "hata").length);
  dogrula(uyum === 0, "Örnek veride kural ihlali yok", uyum);
  await shot("01-panel");

  // --- tüm sekmeler
  for (const tab of ["dashboard", "settings", "students", "bulk", "groups", "takvim", "izleme", "program", "esaslar", "backup", "docs"]) {
    await page.click(tab === "docs" ? '.sidebar .doc-btn[data-doc="k_belirleme"]' : '.sidebar [data-tab="' + tab + '"]');
    const aktif = await page.$eval("#tab-" + tab, (el) => el.classList.contains("active"));
    dogrula(aktif, "Sekme açılıyor: " + tab);
    if (["groups", "takvim", "izleme", "program"].includes(tab)) await shot("02-" + tab);
  }

  // --- tüm belgeler (tek grup ve tüm gruplar)
  const belgeler = await page.evaluate(() => Object.keys(BELGE));
  for (const k of belgeler) {
    for (const tum of [false, true]) {
      const r = await page.evaluate(([k, tum]) => {
        appData.ui.docGrup = tum ? "*" : appData.groups[0].id;
        belgeAc(k);
        const area = document.getElementById("docArea");
        return { sheets: area.querySelectorAll(".sheet").length, hata: /oluşturulamadı|undefined|NaN|\[object/.test(area.innerText) };
      }, [k, tum]);
      dogrula(r.sheets > 0 && !r.hata, "Belge: " + k + (tum ? " (tüm gruplar)" : ""), r);
    }
    if (["k_belirleme", "olur", "plan", "yoklama", "veli", "pg_dpa"].includes(k)) await shot("03-belge-" + k);
  }
  // yatay belge sayfa yönü
  const yon = await page.evaluate(() => { belgeAc("olur"); return document.getElementById("pageStyle").textContent; });
  dogrula(/landscape/.test(yon), "Olur yatay A4", yon);

  // --- tutanak düzenleyici
  await page.evaluate(() => { belgeAc("k_kurulus"); tutanakEditorAc(); });
  await page.fill("#tutMaddeler", "Birinci karar {okul},\nİkinci karar");
  await page.waitForTimeout(400);
  const tut = await page.evaluate(() => document.getElementById("docArea").innerText);
  dogrula(tut.includes("Birinci karar ATATÜRK İLKOKULU") && tut.includes("İkinci karar"), "Tutanak canlı düzenleme ve yer tutucu");

  // --- öğrenci formu
  await page.click('.sidebar [data-tab="students"]');
  await page.fill("#stNo", "301");
  await page.fill("#stAd", "Test ÖĞRENCİ");
  await page.fill("#stSinif", "4/C");
  await page.click("text=Mat. 1.→4. tema");
  await page.click("text=💾 Öğrenciyi kaydet");
  const yeni = await page.evaluate(() => { const s = appData.students.find((x) => x.no === "301"); return s && { u: s.units, d: s.durum }; });
  dogrula(yeni && JSON.stringify(yeni.u) === '["M1","M2","M3","M4"]' && yeni.d === "dahil", "Öğrenci formu kaydı", yeni);
  // özel eğitim → dâhil edilmez
  await page.fill("#stAd", "Özel TEST");
  await page.check("#stOzel");
  await page.click("text=💾 Öğrenciyi kaydet");
  const ozel = await page.evaluate(() => appData.students.find((x) => x.ad === "Özel TEST").durum);
  dogrula(ozel === "dahil_degil", "Özel eğitim öğrencisi dâhil edilmiyor", ozel);

  // --- grup formu: sınır aşımı kaydedilmemeli
  await page.click('.sidebar [data-tab="groups"]');
  const grupSayisi = await page.evaluate(() => appData.groups.length);
  await page.fill("#grAd", "Deneme");
  await page.click('#grUnits label:has-text("1. Öğrenme Alanı")');
  await page.fill("#gun_pzt", "3");
  await page.click("text=💾 Grubu kaydet");
  dogrula(await page.evaluate(() => appData.groups.length) === grupSayisi, "Günlük 2 saat aşımı engelleniyor");
  await page.fill("#gun_pzt", "2");
  await page.fill("#gun_cmt", "6");
  await page.fill("#gun_sal", "2");
  await page.click("text=💾 Grubu kaydet");
  dogrula(await page.evaluate(() => appData.groups.length) === grupSayisi + 1, "Geçerli grup kaydediliyor");
  // öğrenci bazlı yük: Deneme grubuna 101 numaralı öğrenciyi ekleyince (Türkçe-1 + Matematik-1 = 10 saat) sınır aşılmalı
  const yuk = await page.evaluate(() => {
    const g = appData.groups.find((x) => x.ad === "Deneme");
    document.getElementById("atamaGrup").value = g.id; atamaCiz();
    const s = appData.students.find((x) => x.no === "101");
    document.querySelectorAll(".atamaSec").forEach((c) => { c.checked = c.value === s.id; });
    atamaKaydet();
    return g.ogrenciler.includes(s.id);
  });
  dogrula(!yuk, "Öğrenci bazlı haftalık 10 saat sınırı");
  // otomatik gruplama: yeni öğrenci 301 Matematik grubuna atanmalı
  await page.click("text=🪄 Grupları oluştur");
  const oto = await page.evaluate(() => { const s = appData.students.find((x) => x.no === "301"); return ogrenciGruplari(s).map((g) => g.ders); });
  dogrula(oto.includes("MAT"), "Otomatik gruplama", oto);

  // --- toplu yapıştırma
  await page.click('.sidebar [data-tab="bulk"]');
  await page.fill("#topluMetin", "401\tAli VELİ\t3/D\tT1 T2 M3+\tAyşe ÖĞRETMEN\n402;Can CAN;3-D;M4\n12345678901\t403\tDeniz SU\t3/D\tT2");
  await page.click("text=📥 Aktar ve birleştir");
  const toplu = await page.evaluate(() => ["401", "402"].map((n) => { const s = appData.students.find((x) => x.no === n); return s && [s.ad, s.sinif, s.units.join(" "), s.ogretmen]; }).concat([appData.students.some((x) => x.ad === "Deniz SU" && x.no === "403")]));
  dogrula(JSON.stringify(toplu[0]) === '["Ali VELİ","3/D","T1 T2 M3 M4","Ayşe ÖĞRETMEN"]', "Toplu yapıştırma (sekme)", toplu[0]);
  dogrula(JSON.stringify(toplu[1]) === '["Can CAN","3/D","M4",""]', "Toplu yapıştırma (noktalı virgül)", toplu[1]);
  dogrula(toplu[2] === true, "Toplu yapıştırma (TC sütunu atlanır, okul no alınır)");

  // --- Excel: şablon ve öğrenci listesi indirip geri yükleme
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "iyep-"));
  await page.click('.sidebar [data-tab="bulk"]');
  const [d1] = await Promise.all([page.waitForEvent("download"), page.click('#tab-bulk button:has-text("Taslak Excel indir")')]);
  const sablon = path.join(tmp, "sablon.xlsx");
  await d1.saveAs(sablon);
  dogrula(fs.statSync(sablon).size > 2000 && fs.readFileSync(sablon).slice(0, 2).toString() === "PK", "Şablon xlsx üretiliyor");
  await page.click('.sidebar [data-tab="backup"]');
  const [d2] = await Promise.all([page.waitForEvent("download"), page.click('#tab-backup button:has-text("Öğrenci listesi")')]);
  const liste = path.join(tmp, "liste.xlsx");
  await d2.saveAs(liste);
  const once = await page.evaluate(() => { appData.students.find((x) => x.no === "401").units = []; return appData.students.length; });
  await page.click('.sidebar [data-tab="bulk"]');
  await page.setInputFiles('#tab-bulk input[type="file"]', liste);
  await page.waitForTimeout(500);
  const sonra = await page.evaluate(() => ({ n: appData.students.length, u: appData.students.find((x) => x.no === "401").units.join(" ") }));
  dogrula(sonra.n === once && sonra.u === "T1 T2 M3 M4", "Excel dışa → içe aktarım (güncelleme)", sonra);
  for (const [ad, metin] of [["olur", "Kurs oluru"], ["izleme", "Öğrenme çıktıları izleme"]]) {
    await page.click('.sidebar [data-tab="backup"]');
    const [d] = await Promise.all([page.waitForEvent("download"), page.click('#tab-backup button:has-text("' + metin + '")')]);
    const p = path.join(tmp, ad + ".xlsx");
    await d.saveAs(p);
    dogrula(fs.readFileSync(p).slice(0, 2).toString() === "PK", "Excel: " + ad);
  }

  // --- izleme matrisi
  await page.evaluate(() => { appData.ui.izGrup = appData.groups[0].id; appData.ui.izUnit = "T1"; });
  await page.click('.sidebar [data-tab="izleme"]');
  const izOnce = await page.evaluate(() => appData.students.find((x) => x.no === "101").izleme["İ.T.D.2.1"] || "");
  await page.click("#izMatris td.cell >> nth=0");
  const izSonra = await page.evaluate(() => appData.students.find((x) => x.no === "101").izleme["İ.T.D.2.1"] || "");
  const beklenen = { "": "G", G: "E", E: "" }[izOnce];
  dogrula(izSonra === beklenen, "İzleme hücresi döngüsü (– → G → E)", [izOnce, izSonra]);
  const hucreMetni = await page.textContent("#izMatris td.cell >> nth=0");
  dogrula(hucreMetni.trim() === (beklenen || "–"), "İzleme hücresi yeniden çiziliyor", hucreMetni);
  const pg = await page.evaluate(() => { const st = appData.students.find((x) => x.no === "101"); [0, 1, 2, 3].forEach((i) => pgGuncelle(st.id, "T1", i, 4)); return st.pg.T1.puan; });
  dogrula(pg === 16, "Analitik DPA toplamı", pg);

  // --- JSON yedek döngüsü
  await page.click('.sidebar [data-tab="backup"]');
  const [d3] = await Promise.all([page.waitForEvent("download"), page.click('#tab-backup button:has-text("Tam yedeği indir")')]);
  const yedek = path.join(tmp, "yedek.json");
  await d3.saveAs(yedek);
  const kayit = JSON.parse(fs.readFileSync(yedek, "utf8"));
  dogrula(kayit.students.length === await page.evaluate(() => appData.students.length), "JSON yedek içeriği");
  await page.evaluate(() => { appData.students = []; });
  await page.setInputFiles('#tab-backup input[type="file"]', yedek);
  await page.waitForTimeout(400);
  dogrula(await page.evaluate(() => appData.students.length) === kayit.students.length, "JSON yedek geri yükleme");

  // --- kalıcılık (yeniden yükleme)
  await page.evaluate(() => kaydet(true));
  await page.reload();
  await page.waitForSelector(".tab.active");
  dogrula(await page.evaluate(() => appData.students.some((x) => x.no === "401")), "localStorage kalıcılığı");

  // --- önceki sürüm verisinden aktarım
  const eski = { settings: { il: "ÖRNEK", ilce: "DENEME", okul: "ESKİ İLKOKULU", mudur: "Eski MÜDÜR", commission: [{ role: "Komisyon Başkanı", name: "Eski MÜDÜR", branch: "Okul Müdürü" }], ilceKomisyon: { uyeler: [{ name: "Şube MÜDÜRÜ", title: "Başkan" }], mudur: "İlçe MÜDÜRÜ" } },
    students: [{ id: 1, no: "1", name: "ESKİ ÖĞRENCİ", stClass: "3/A", teacher: "Öğr", turkce: "M2", mat: "", ozelEgitim: "yok", veliIzin: "var", komisyonDurum: "dahil" }], groups: [] };
  await page.evaluate((e) => { localStorage.setItem("iyep_pro_app_v3", JSON.stringify(e)); appData.ui.eskiSoruldu = false; sekmeAc("dashboard"); }, eski);
  await page.click('#eskiVeriKart button:has-text("Aktar")');
  const aktarim = await page.evaluate(() => ({ okul: appData.settings.okul, n: appData.students.length, d: appData.students[0].durum, ilce: appData.settings.ilceKomisyon.mudur }));
  dogrula(aktarim.okul === "ESKİ İLKOKULU" && aktarim.n === 1 && aktarim.d === "aday" && aktarim.ilce === "İlçe MÜDÜRÜ", "Önceki sürümden aktarım", aktarim);

  // --- mobil görünüm
  await page.evaluate(() => { localStorage.removeItem("iyep_pro_app_v3"); appData = veriNormalize(ornekVeri()); kaydet(true); });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tab of ["dashboard", "students", "groups", "izleme", "settings"]) {
    await page.evaluate((t) => sekmeAc(t), tab);
    const tasma = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    dogrula(tasma <= 1, "Mobilde yatay taşma yok: " + tab, tasma);
    if (tab === "dashboard" || tab === "students") await shot("04-mobil-" + tab);
  }

  // --- koyu tema
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.evaluate(() => { temaDegistir(); sekmeAc("dashboard"); });
  await shot("05-koyu");

  dogrula(hatalar.length === 0, "Konsol / sayfa hatası yok", hatalar);
  await browser.close();
  console.log(`\n${gecen} geçti, ${kalan} başarısız`);
  process.exit(kalan ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
