/* ==========================================================================
   ARAYÜZ: gezinme, gösterge paneli, ayarlar, öğrenciler, toplu aktarım, gruplar
   ========================================================================== */

const SEKMELER = {
  dashboard: { ad: "Gösterge Paneli", alt: "İYEP sürecinin genel durumu" },
  settings: { ad: "Okul & Komisyon", alt: "Okul bilgileri, takvim, İYEP Okul Komisyonu" },
  students: { ad: "Öğrenciler & ÖBA", alt: "ÖBA sonuçları ve komisyon kararları" },
  bulk: { ad: "Toplu Aktarım", alt: "Excel şablonu veya e-Okul listesinden aktarım" },
  groups: { ad: "Gruplar & Ders Saatleri", alt: "Hafta içi ≤ 2, hafta sonu ≤ 6, haftalık ≤ 10 ders saati" },
  takvim: { ad: "Uygulama Takvimi", alt: "Öğrenme alanı / temaların haftalara dağılımı" },
  izleme: { ad: "İzleme & Değerlendirme", alt: "Öğrenme kanıtları, performans görevi, ÖDA" },
  docs: { ad: "Belgeler", alt: "" },
  program: { ad: "Öğretim Programı", alt: "İYEP 2026 – Türkçe öğrenme alanları ve matematik temaları" },
  esaslar: { ad: "Usul ve Esaslar", alt: "İYEP 2026 – temel yaklaşım, usul ve esaslar, ölçme ve değerlendirme" },
  backup: { ad: "Yedek & Excel", alt: "Yedekleme, içe / dışa aktarım" }
};

/* ---------- genel ---------- */
let toastZamanlayici = null;
function bildir(metin, tur) {
  const t = $("toast");
  t.textContent = metin;
  t.className = "show" + (tur === "hata" ? " hata" : "");
  clearTimeout(toastZamanlayici);
  toastZamanlayici = setTimeout(function () { t.className = ""; }, 3200);
}
function modalAc(html) { $("modalBox").innerHTML = html; $("modal").classList.add("show"); }
function modalKapat() { $("modal").classList.remove("show"); }
function menuAc() { document.body.classList.add("menu-open"); }
function menuKapat() { document.body.classList.remove("menu-open"); }
function temaUygula() {
  let t = null;
  try { t = localStorage.getItem("iyep_tema"); } catch (e) { t = null; }
  if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
}
function temaDegistir() {
  const simdi = document.documentElement.getAttribute("data-theme") ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const yeni = simdi === "dark" ? "light" : "dark";
  try { localStorage.setItem("iyep_tema", yeni); } catch (e) { /* yok say */ }
  temaUygula();
}

function sekmeAc(tab) {
  if (!SEKMELER[tab]) tab = "dashboard";
  appData.ui.tab = tab;
  document.querySelectorAll(".tab").forEach(function (el) { el.classList.toggle("active", el.id === "tab-" + tab); });
  document.querySelectorAll("[data-tab]").forEach(function (el) { el.classList.toggle("active", el.getAttribute("data-tab") === tab); });
  if (tab !== "docs") document.querySelectorAll(".doc-btn").forEach(function (b) { b.classList.remove("active"); });
  $("tbDoc").classList.toggle("hidden", tab !== "docs");
  menuKapat();
  window.scrollTo(0, 0);
  sekmeCiz(tab);
  ustBaslik();
  gecikmeliKaydet();
}
function ustBaslik() {
  const tab = appData.ui.tab;
  if (tab === "docs") {
    const b = BELGE[appData.ui.doc];
    $("tbTitle").textContent = b ? b.ad : "Belgeler";
    $("tbSub").textContent = b ? b.grup + (b.yatay ? " · Yatay A4" : " · Dikey A4") : "";
  } else {
    $("tbTitle").textContent = SEKMELER[tab].ad;
    $("tbSub").textContent = SEKMELER[tab].alt;
  }
}
function sekmeCiz(tab) {
  const f = {
    dashboard: panelCiz, settings: ayarlarCiz, students: ogrencilerCiz, bulk: topluCiz, groups: gruplarCiz,
    takvim: takvimCiz, izleme: izlemeCiz, docs: belgeCiz, program: programCiz, esaslar: esaslarCiz, backup: yedekCiz
  }[tab];
  if (f) f();
}
// Veri değiştiğinde: sayaçlar, ilerleme, uyarı şeridi ve etkin sekme
function yenile(sekmeyiDeCiz) {
  $("cntSt").textContent = appData.students.length;
  $("cntGr").textContent = appData.groups.length;
  $("sbOkul").textContent = appData.settings.okul || "TYMM 2026 Programı";
  const adim = surecAdimlari();
  const pct = Math.round(100 * adim.filter(function (a) { return a.tamam; }).length / adim.length);
  $("sbPct").textContent = "%" + pct;
  $("sbBar").style.width = pct + "%";
  const hata = uyumDenetimi().filter(function (x) { return x.seviye === "hata"; });
  $("globalUyari").innerHTML = hata.length && appData.ui.tab !== "dashboard"
    ? '<div class="alert hata no-print"><span>⚠️</span><span class="t"><b>' + hata.length + ' kural ihlali var.</b> ' + esc(hata[0].metin) +
      (hata.length > 1 ? " (ve " + (hata.length - 1) + " diğer)" : "") + '</span><button class="btn xs out" data-go="dashboard">Ayrıntı</button></div>'
    : "";
  if (sekmeyiDeCiz !== false) sekmeCiz(appData.ui.tab);
  gecikmeliKaydet();
}
function ogretmenDatalist() {
  const set = {};
  appData.students.forEach(function (s) { if (s.ogretmen) set[s.ogretmen] = true; });
  appData.groups.forEach(function (g) { if (g.ogretmen) set[g.ogretmen] = true; });
  appData.settings.komisyon.forEach(function (k) { if (k.ad) set[k.ad] = true; });
  $("ogretmenListe").innerHTML = Object.keys(set).sort(siralaTr).map(function (n) { return '<option value="' + esc(n) + '">'; }).join("");
}

/* ---------- gösterge paneli ---------- */
function panelCiz() {
  const st = appData.students, dahil = dahilOgrenciler();
  const trS = dahil.filter(function (s) { return dersUnits(s.units, "TR").length; }).length;
  const matS = dahil.filter(function (s) { return dersUnits(s.units, "MAT").length; }).length;
  const toplamSaat = appData.groups.reduce(function (a, g) { return a + grupSaatToplam(g); }, 0);
  const kpi = function (l, v, d, cls) { return '<div class="kpi ' + (cls || "") + '"><div class="l">' + l + '</div><div class="v">' + v + '</div><div class="d">' + (d || "&nbsp;") + "</div></div>"; };
  $("kpiAlan").innerHTML =
    kpi("Kayıtlı öğrenci", st.length, st.filter(function (s) { return s.durum === "aday"; }).length + " öğrenci karar bekliyor") +
    kpi("Programa dâhil", dahil.length, st.filter(function (s) { return s.durum === "dahil_degil"; }).length + " dâhil edilmedi · " + st.filter(function (s) { return s.durum === "ayrildi"; }).length + " ayrıldı") +
    kpi("Türkçe", trS, "1. ÖA: " + dahil.filter(function (s) { return s.units.indexOf("T1") >= 0; }).length + " · 2. ÖA: " + dahil.filter(function (s) { return s.units.indexOf("T2") >= 0; }).length, "tr") +
    kpi("Matematik", matS, MAT_UNITS.map(function (u) { return u.sira + ". tema: " + dahil.filter(function (s) { return s.units.indexOf(u.id) >= 0; }).length; }).join(" · "), "mat") +
    kpi("Grup", appData.groups.length, appData.groups.filter(function (g) { return g.ders === "TR"; }).length + " Türkçe · " + appData.groups.filter(function (g) { return g.ders === "MAT"; }).length + " Matematik") +
    kpi("Planlanan ders saati", toplamSaat, "Tüm grupların toplamı");

  const adim = surecAdimlari();
  $("adimlar").innerHTML = adim.map(function (a, i) {
    return '<div class="step ' + (a.tamam ? "ok" : "") + '" data-go="' + a.tab + '"><span class="dot">' + (a.tamam ? "✓" : i + 1) + "</span><span>" + esc(a.ad) + "</span>" + (a.detay ? '<span class="det">' + esc(a.detay) + "</span>" : "") + "</div>";
  }).join("");

  const uyum = uyumDenetimi();
  const say = function (s) { return uyum.filter(function (x) { return x.seviye === s; }).length; };
  $("uyumOzet").innerHTML = (say("hata") ? '<span class="badge red">' + say("hata") + " ihlal</span> " : "") +
    (say("uyari") ? '<span class="badge amber">' + say("uyari") + " uyarı</span> " : "") +
    (say("bilgi") ? '<span class="badge blue">' + say("bilgi") + " bilgi</span>" : "");
  const sira = { hata: 0, uyari: 1, bilgi: 2 };
  $("uyumListe").innerHTML = uyum.length ? uyum.sort(function (a, b) { return sira[a.seviye] - sira[b.seviye]; }).map(function (x) {
    return '<div class="issue ' + x.seviye + '" data-go="' + x.hedef + '"><span>' + ({ hata: "⛔", uyari: "⚠️", bilgi: "ℹ️" }[x.seviye]) + "</span><span>" + esc(x.metin) + "</span></div>";
  }).join("") : '<div class="alert ok"><span>✓</span><span class="t">Öğrenci, grup ve ders saati kayıtları İYEP 2026 usul ve esaslarına uygun görünüyor.</span></div>';

  $("unitDagilim").innerHTML = UNITS.map(function (u) {
    const ogr = dahil.filter(function (s) { return s.units.indexOf(u.id) >= 0; });
    const grs = appData.groups.filter(function (g) { return g.units.indexOf(u.id) >= 0; });
    let e = 0, n = 0;
    ogr.forEach(function (s) { u.ciktilar.forEach(function (c) { n++; if (s.izleme[c.kod] === "E") e++; }); });
    const pct = n ? Math.round(100 * e / n) : 0;
    return '<div class="unit-card ' + (u.ders === "MAT" ? "mat" : "") + '"><div class="row between"><h4>' + esc(u.baslik) + '</h4><span class="badge ' + (u.ders === "MAT" ? "mat" : "tr") + '">' + u.saat + " saat</span></div>" +
      '<div class="meta">' + esc(u.ad) + " · " + u.ciktilar.length + " öğrenme çıktısı</div>" +
      '<div class="row mt small"><b>' + ogr.length + "</b> öğrenci · <b>" + grs.length + "</b> grup · edinim %" + pct + "</div>" +
      '<div class="hbar"><div style="width:' + pct + '%"></div></div></div>';
  }).join("");

  const bugun = new Date();
  $("grupTakvimOzet").innerHTML = appData.groups.length ? '<div class="tw"><table class="t"><thead><tr><th>Grup</th><th>Başlama</th><th>Tahmini bitiş</th><th class="num">Tamamlanan</th></tr></thead><tbody>' +
    appData.groups.map(function (g) {
      const p = grupPlanCache(g);
      const yapilan = p.saatler.filter(function (x) { return x.tarih <= bugun; }).length;
      return "<tr><td><b>" + esc(g.ad) + '</b> <span class="badge ' + (g.ders === "MAT" ? "mat" : "tr") + '">' + DERSLER[g.ders].ad + "</span></td><td>" + (p.oturumlar.length ? trTarih(p.oturumlar[0].tarih) : "–") +
        "</td><td>" + (p.bitis ? trTarih(p.bitis) : '<span class="muted">' + esc(p.hata || "–") + "</span>") + '</td><td class="num">' + yapilan + " / " + p.toplam + "</td></tr>";
    }).join("") + "</tbody></table></div>" : '<div class="empty">Henüz grup yok. <button class="btn sm pri" data-go="groups">Grup oluştur</button></div>';

  // önceki sürüm verisi
  const k = $("eskiVeriKart");
  if (eskiVeriVarMi() && !appData.ui.eskiSoruldu) {
    k.innerHTML = '<div class="alert bilgi"><span>📦</span><span class="t"><b>Önceki İYEP Yönetim Sistemi verisi bulundu.</b> Okul bilgileri, komisyon üyeleri ve öğrenci listesi yeni sisteme aktarılabilir. Eski modül bilgileri yeni programda karşılığı olmadığı için aktarılmaz; öğrencileri yeni ÖBA sonucuna göre güncelleyiniz.</span>' +
      '<button class="btn sm pri" onclick="eskiVeriAktar()">Aktar</button><button class="btn sm ghost" onclick="eskiVeriGec()">Gizle</button></div>';
  } else k.innerHTML = "";
}
function eskiVeriAktar() {
  if (!confirm("Mevcut veriler (örnek veriler dâhil) önceki sürümden aktarılan verilerle değiştirilecek. Devam edilsin mi?")) return;
  try {
    appData = eskiVeriDonustur(JSON.parse(localStorage.getItem(ESKI_STORAGE_KEY)));
    appData.ui.eskiSoruldu = true;
    kaydet(true);
    bildir(appData.students.length + " öğrenci ve okul bilgileri aktarıldı. Öğrencilerin öğrenme alanı / temalarını ÖBA sonucuna göre seçiniz.");
    sekmeAc("students");
    yenile();
  } catch (e) { bildir("Önceki veri okunamadı: " + e.message, "hata"); }
}
function eskiVeriGec() { appData.ui.eskiSoruldu = true; kaydet(true); panelCiz(); }

/* ---------- ayarlar ---------- */
const EVRAK = [
  { key: "k_kurulus", ad: "1. Komisyon toplantısı (planlama)", saat: true, yer: "Öğretmenler Odası" },
  { key: "k_belirleme", ad: "2. Komisyon kararı (ÖBA sonrası öğrenci belirleme)", saat: true, yer: "Müdür Odası" },
  { key: "k_ara", ad: "3. Ara değerlendirme toplantısı", saat: true, yer: "Müdür Odası" },
  { key: "k_son", ad: "4. Program sonu değerlendirme toplantısı", saat: true, yer: "Müdür Odası" },
  { key: "olur", ad: "Kurs oluru yazı tarihi" },
  { key: "gorevlendirme", ad: "Öğretmen görevlendirme yazısı" },
  { key: "veli", ad: "Veli bilgilendirme ve onay formu" },
  { key: "yilsonu", ad: "Program sonu değerlendirme raporu" }
];
function evrak(key) { return appData.settings.evrak[key] || {}; }
function evrakTarih(key, yedek) { return tarihVeyaNokta(evrak(key).tarih || yedek); }
function evrakSaat(key) { return evrak(key).saat || "......"; }
function evrakYer(key) { const d = EVRAK.find(function (x) { return x.key === key; }); return evrak(key).yer || (d && d.yer) || "......"; }

function ayarlarCiz() {
  const s = appData.settings;
  document.querySelectorAll("#tab-settings [data-set]").forEach(function (el) {
    const k = el.getAttribute("data-set");
    if (document.activeElement !== el) el.value = s[k] == null ? "" : s[k];
  });
  $("ilceMudur").value = s.ilceKomisyon.mudur || "";
  $("tatilTbody").innerHTML = s.tatiller.length ? s.tatiller.map(function (t, i) {
    return '<tr><td><input class="in sm" value="' + esc(t.ad) + '" oninput="tatilGuncelle(' + i + ',\'ad\',this.value)"></td>' +
      '<td><input class="in sm" type="date" value="' + esc(t.bas) + '" onchange="tatilGuncelle(' + i + ',\'bas\',this.value)"></td>' +
      '<td><input class="in sm" type="date" value="' + esc(t.bit) + '" onchange="tatilGuncelle(' + i + ',\'bit\',this.value)"></td>' +
      '<td><button class="ico-btn" title="Sil" onclick="tatilSil(' + i + ')">🗑</button></td></tr>';
  }).join("") : '<tr><td colspan="4" class="empty">Tatil eklenmedi.</td></tr>';
  $("komisyonTbody").innerHTML = s.komisyon.map(function (k, i) {
    return '<tr><td><input class="in sm" value="' + esc(k.gorev) + '" oninput="komisyonGuncelle(' + i + ',\'gorev\',this.value)"></td>' +
      '<td><input class="in sm" value="' + esc(k.ad) + '" oninput="komisyonGuncelle(' + i + ',\'ad\',this.value)"></td>' +
      '<td><input class="in sm" value="' + esc(k.brans) + '" oninput="komisyonGuncelle(' + i + ',\'brans\',this.value)"></td>' +
      '<td class="nowrap"><button class="ico-btn" title="Yukarı" onclick="komisyonTasi(' + i + ',-1)">▲</button><button class="ico-btn" title="Aşağı" onclick="komisyonTasi(' + i + ',1)">▼</button><button class="ico-btn" title="Sil" onclick="komisyonSil(' + i + ')">🗑</button></td></tr>';
  }).join("");
  $("ilceKomTbody").innerHTML = s.ilceKomisyon.uyeler.length ? s.ilceKomisyon.uyeler.map(function (k, i) {
    return '<tr><td><input class="in sm" value="' + esc(k.ad) + '" oninput="ilceKomGuncelle(' + i + ',\'ad\',this.value)"></td>' +
      '<td><input class="in sm" value="' + esc(k.unvan) + '" oninput="ilceKomGuncelle(' + i + ',\'unvan\',this.value)"></td>' +
      '<td><button class="ico-btn" title="Sil" onclick="ilceKomSil(' + i + ')">🗑</button></td></tr>';
  }).join("") : '<tr><td colspan="3" class="empty">Üye eklenmedi.</td></tr>';
  $("evrakTbody").innerHTML = EVRAK.map(function (d) {
    const e = evrak(d.key);
    return "<tr><td>" + esc(d.ad) + '</td><td><input class="in sm" type="date" value="' + esc(e.tarih || "") + '" onchange="evrakGuncelle(\'' + d.key + '\',\'tarih\',this.value)"></td>' +
      (d.saat ? '<td><input class="in sm" type="time" value="' + esc(e.saat || "") + '" onchange="evrakGuncelle(\'' + d.key + '\',\'saat\',this.value)"></td><td><input class="in sm" value="' + esc(e.yer || "") + '" placeholder="' + esc(d.yer) + '" oninput="evrakGuncelle(\'' + d.key + '\',\'yer\',this.value)"></td>'
        : '<td colspan="2" class="muted small">—</td>') + "</tr>";
  }).join("");
}
function ayarBagla() {
  document.querySelectorAll("#tab-settings [data-set]").forEach(function (el) {
    el.addEventListener(el.type === "date" ? "change" : "input", function () {
      const k = el.getAttribute("data-set");
      appData.settings[k] = el.hasAttribute("data-num") ? sayi(el.value, 0) : el.value.trim();
      yenile(false);
    });
  });
  $("ilceMudur").addEventListener("input", function () { appData.settings.ilceKomisyon.mudur = this.value.trim(); gecikmeliKaydet(); });
}
function tatilEkle() { appData.settings.tatiller.push({ ad: "Tatil", bas: "", bit: "" }); ayarlarCiz(); gecikmeliKaydet(); }
function tatilGuncelle(i, k, v) { appData.settings.tatiller[i][k] = v; if (k === "bas" && !appData.settings.tatiller[i].bit) { appData.settings.tatiller[i].bit = v; ayarlarCiz(); } yenile(false); }
function tatilSil(i) { appData.settings.tatiller.splice(i, 1); ayarlarCiz(); yenile(false); }
function komisyonEkle() { appData.settings.komisyon.push({ gorev: "Üye", ad: "", brans: "" }); ayarlarCiz(); gecikmeliKaydet(); }
function komisyonGuncelle(i, k, v) { appData.settings.komisyon[i][k] = v; yenile(false); }
function komisyonSil(i) { appData.settings.komisyon.splice(i, 1); ayarlarCiz(); yenile(false); }
function komisyonTasi(i, y) {
  const a = appData.settings.komisyon, j = i + y;
  if (j < 0 || j >= a.length) return;
  const t = a[i]; a[i] = a[j]; a[j] = t;
  ayarlarCiz(); gecikmeliKaydet();
}
function ilceKomEkle() { appData.settings.ilceKomisyon.uyeler.push({ ad: "", unvan: "" }); ayarlarCiz(); gecikmeliKaydet(); }
function ilceKomGuncelle(i, k, v) { appData.settings.ilceKomisyon.uyeler[i][k] = v; gecikmeliKaydet(); }
function ilceKomSil(i) { appData.settings.ilceKomisyon.uyeler.splice(i, 1); ayarlarCiz(); gecikmeliKaydet(); }
function evrakGuncelle(key, k, v) { appData.settings.evrak[key] = Object.assign({}, appData.settings.evrak[key], { [k]: v }); gecikmeliKaydet(); }

/* ---------- öğrenciler ---------- */
function unitChip(u, secili, ad, onchange) {
  return '<label class="chip ' + (u.ders === "MAT" ? "mat" : "tr") + '"><input type="checkbox" name="' + ad + '" value="' + u.id + '"' + (secili ? " checked" : "") +
    (onchange ? ' onchange="' + onchange + '"' : "") + ">" + esc(u.baslik) + ' <span class="muted">· ' + esc(u.ad) + " · " + u.saat + "s</span></label>";
}
function ogrencilerCiz() {
  ogretmenDatalist();
  if (!$("stHedef").innerHTML) {
    $("stHedef").innerHTML = HEDEF_KITLE.map(function (h) { return '<label class="chip"><input type="checkbox" name="stHedef" value="' + h.k + '">' + esc(h.ad) + "</label>"; }).join("");
    $("stDurum").innerHTML = Object.keys(DURUMLAR).map(function (k) { return '<option value="' + k + '">' + DURUMLAR[k].ad + "</option>"; }).join("");
    $("stFiltreDurum").innerHTML = '<option value="">Tüm durumlar</option>' + Object.keys(DURUMLAR).map(function (k) { return '<option value="' + k + '">' + DURUMLAR[k].ad + "</option>"; }).join("");
    ogrenciFormTemizle();
  }
  ogrenciListeCiz();
}
function stUnitsCiz(secili) {
  $("stUnitsTR").innerHTML = TR_UNITS.map(function (u) { return unitChip(u, secili.indexOf(u.id) >= 0, "stUnit", "stSaatGoster()"); }).join("");
  $("stUnitsMAT").innerHTML = MAT_UNITS.map(function (u) { return unitChip(u, secili.indexOf(u.id) >= 0, "stUnit", "stSaatGoster()"); }).join("");
  stSaatGoster();
}
function stSeciliUnits() { return siraliUnits(Array.from(document.querySelectorAll('input[name="stUnit"]:checked')).map(function (x) { return x.value; })); }
function stSaatGoster() {
  const u = stSeciliUnits();
  const tr = unitSaatToplam(dersUnits(u, "TR")), mat = unitSaatToplam(dersUnits(u, "MAT"));
  $("stSaatOzet").textContent = u.length ? "Programdaki süre: Türkçe " + tr + " saat, Matematik " + mat + " saat (toplam " + (tr + mat) + ")." : "ÖBA ile eksiklik belirlenen öğrenme alanı / temaları seçiniz.";
}
function hizliSec(kod) { stUnitsCiz(kod ? Array.from(new Set(stSeciliUnits().concat(kodCoz(kod)))) : []); }
function ogrenciFormTemizle() {
  $("stId").value = "";
  ["stNo", "stAd", "stOgretmen", "stGerekce", "stObaNot"].forEach(function (id) { $(id).value = ""; });
  $("stSinif").value = appData.settings.varsayilanSinif || "";
  $("stDurum").value = "dahil";
  $("stVeli").value = "";
  $("stOzel").checked = false;
  document.querySelectorAll('input[name="stHedef"]').forEach(function (c) { c.checked = c.value === "yetersiz"; });
  stUnitsCiz([]);
  $("stFormBaslik").textContent = "➕ Öğrenci ekle";
  $("stFormHint").textContent = "";
}
function ogrenciDuzenle(id) {
  const s = ogrenci(id);
  if (!s) return;
  if (appData.ui.tab !== "students") sekmeAc("students");
  $("stId").value = s.id; $("stNo").value = s.no || ""; $("stAd").value = s.ad || ""; $("stSinif").value = s.sinif || "";
  $("stOgretmen").value = s.ogretmen || ""; $("stGerekce").value = s.gerekce || ""; $("stObaNot").value = s.obaNot || "";
  $("stDurum").value = s.durum; $("stVeli").value = s.veli || ""; $("stOzel").checked = !!s.ozel;
  document.querySelectorAll('input[name="stHedef"]').forEach(function (c) { c.checked = (s.hedef || []).indexOf(c.value) >= 0; });
  stUnitsCiz(s.units);
  $("stFormBaslik").textContent = "✏️ Öğrenciyi düzenle";
  $("stFormHint").textContent = s.not || "";
  $("stAd").focus();
}
function ogrenciKaydet() {
  const ad = $("stAd").value.trim();
  if (!ad) { bildir("Öğrencinin adı soyadı zorunludur.", "hata"); $("stAd").focus(); return; }
  const id = $("stId").value;
  const no = $("stNo").value.trim();
  const ayni = no && appData.students.find(function (s) { return s.no === no && s.id !== id; });
  if (ayni && !confirm(no + " numaralı başka bir öğrenci (" + ayni.ad + ") var. Yine de kaydedilsin mi?")) return;
  const veri = {
    no: no, ad: ad, sinif: $("stSinif").value.trim(), ogretmen: $("stOgretmen").value.trim(),
    units: stSeciliUnits(), hedef: Array.from(document.querySelectorAll('input[name="stHedef"]:checked')).map(function (c) { return c.value; }),
    durum: $("stDurum").value, veli: $("stVeli").value, ozel: $("stOzel").checked, gerekce: $("stGerekce").value.trim(), obaNot: $("stObaNot").value.trim()
  };
  if (veri.ozel && veri.durum === "dahil") {
    if (!confirm("Özel eğitim ihtiyacı işaretli öğrenciler İYEP hedef kitlesi dışındadır (İYEP 1.1). Öğrenci \"dâhil edilmedi\" olarak kaydedilsin mi?\n\nTamam: dâhil edilmedi olarak kaydet · İptal: formu düzenle")) return;
    veri.durum = "dahil_degil";
    if (!veri.gerekce) veri.gerekce = "Özel eğitim ihtiyacı";
  }
  if (id) {
    const s = ogrenci(id);
    Object.assign(s, veri);
    // ders ihtiyacı kalmayan gruplardan çıkar
    ogrenciGruplari(s).forEach(function (g) { if (!dersUnits(s.units, g.ders).length) g.ogrenciler = g.ogrenciler.filter(function (x) { return x !== s.id; }); });
    bildir("Öğrenci güncellendi.");
  } else {
    appData.students.push(Object.assign({ id: yeniId(), not: "", oda: { TR: "", MAT: "" }, izleme: {}, pg: {} }, veri));
    bildir("Öğrenci eklendi.");
  }
  ogrenciFormTemizle();
  yenile();
}
function ogrenciSil(id) {
  const s = ogrenci(id);
  if (!s || !confirm(s.ad + " silinsin mi? İzleme ve ÖDA kayıtları da silinir.")) return;
  appData.students = appData.students.filter(function (x) { return x.id !== id; });
  appData.groups.forEach(function (g) { g.ogrenciler = g.ogrenciler.filter(function (x) { return x !== id; }); });
  yenile();
}
function seciliOgrenciIdler() { return Array.from(document.querySelectorAll(".stSec:checked")).map(function (c) { return c.value; }); }
function secilileriDurum(durum) {
  const ids = seciliOgrenciIdler();
  if (!ids.length) { bildir("Önce listeden öğrenci seçiniz.", "hata"); return; }
  let atla = 0;
  ids.forEach(function (id) { const s = ogrenci(id); if (durum === "dahil" && s.ozel) { atla++; return; } s.durum = durum; });
  bildir(ids.length - atla + " öğrencinin durumu güncellendi." + (atla ? " " + atla + " özel eğitim ihtiyacı olan öğrenci atlandı." : ""));
  yenile();
}
function secilileriSil() {
  const ids = seciliOgrenciIdler();
  if (!ids.length) { bildir("Önce listeden öğrenci seçiniz.", "hata"); return; }
  if (!confirm(ids.length + " öğrenci silinsin mi?")) return;
  appData.students = appData.students.filter(function (s) { return ids.indexOf(s.id) < 0; });
  appData.groups.forEach(function (g) { g.ogrenciler = g.ogrenciler.filter(function (x) { return ids.indexOf(x) < 0; }); });
  yenile();
}
function ogrenciListeCiz() {
  const q = trLower($("stAra").value.trim()), fd = $("stFiltreDurum").value, fders = $("stFiltreDers").value;
  const liste = appData.students.filter(function (s) {
    if (q && trLower(s.ad + " " + s.no + " " + s.sinif + " " + s.ogretmen).indexOf(q) < 0) return false;
    if (fd && s.durum !== fd) return false;
    if (fders === "TR" || fders === "MAT") return dersUnits(s.units, fders).length > 0;
    if (fders === "grupsuz") return s.durum === "dahil" && !ogrenciGruplari(s).length;
    return true;
  }).sort(function (a, b) { return siralaTr(a.sinif, b.sinif) || siralaTr(a.no, b.no); });
  $("stSayac").textContent = liste.length + " / " + appData.students.length;
  $("stHepsi").checked = false;
  $("stTbody").innerHTML = liste.length ? liste.map(function (s) {
    const d = DURUMLAR[s.durum];
    const gr = ogrenciGruplari(s).map(function (g) { return esc(g.ad); }).join(", ");
    const tr = dersUnits(s.units, "TR"), mat = dersUnits(s.units, "MAT");
    return '<tr class="' + (s.durum === "dahil" || s.durum === "aday" ? "" : "dim") + '"><td><input type="checkbox" class="stSec" value="' + s.id + '"></td><td>' + esc(s.no) + "</td><td><b>" + esc(s.ad) + "</b>" + (s.ozel ? ' <span class="badge red">Özel eğitim</span>' : "") + "</td><td>" + esc(s.sinif) + "</td>" +
      "<td>" + (tr.length ? '<span class="badge tr">' + tr.map(function (u) { return UNIT[u].sira + ". ÖA"; }).join(", ") + "</span>" : '<span class="muted">–</span>') + "</td>" +
      "<td>" + (mat.length ? '<span class="badge mat">' + mat.map(function (u) { return UNIT[u].sira; }).join(", ") + ". tema</span>" : '<span class="muted">–</span>') + "</td>" +
      '<td class="small">' + esc(hedefEtiket(s)) + '</td><td><span class="badge ' + d.rozet + '" title="' + esc(s.gerekce || d.ad) + '">' + d.kisa + "</span></td>" +
      '<td class="small">' + (gr || (s.durum === "dahil" ? '<span class="badge amber">Atanmadı</span>' : "–")) + "</td>" +
      '<td class="nowrap"><button class="ico-btn" title="Düzenle" onclick="ogrenciDuzenle(\'' + s.id + '\')">✏️</button><button class="ico-btn" title="Sil" onclick="ogrenciSil(\'' + s.id + '\')">🗑</button></td></tr>';
  }).join("") : '<tr><td colspan="10" class="empty">Kayıt bulunamadı.</td></tr>';
}

/* ---------- toplu aktarım ---------- */
function topluCiz() {
  $("kodTablo").innerHTML = UNITS.map(function (u) { return '<tr><td><span class="badge ' + (u.ders === "MAT" ? "mat" : "tr") + '">' + u.id + "</span></td><td>" + esc(u.baslik + " – " + u.ad) + '</td><td class="num">' + u.saat + "</td></tr>"; }).join("");
  if (!$("topluDurum").innerHTML) $("topluDurum").innerHTML = '<option value="dahil">Aktarılanlar: programa dâhil</option><option value="aday">Aktarılanlar: komisyon kararı bekliyor</option>';
}
const SINIF_RE = /^\d\s*[\/\-.]?\s*[A-ZÇĞİÖŞÜ]{1,2}$/i;
function satirdanOgrenci(hucreler) {
  const h = hucreler.map(function (x) { return String(x || "").trim(); }).filter(function (x) { return x !== ""; });
  if (!h.length) return null;
  const o = { no: "", ad: "", sinif: "", ogretmen: "", units: [] };
  const kalan = [];
  h.forEach(function (x) {
    // addan önceki son kısa sayı okul numarasıdır ("S.No · Okul No · Ad" düzenini de karşılar);
    // uzun sayılar (T.C. kimlik no vb.) ve addan sonraki sayılar atlanır
    if (/^\d+$/.test(x)) { if (!kalan.length && x.length <= 6) o.no = x; return; }
    if (!o.sinif && SINIF_RE.test(x)) { o.sinif = x.replace(/\s+/g, "").replace(/[-.]/, "/").toLocaleUpperCase("tr-TR"); return; }
    const k = kodCoz(x);
    if (k.length && /^[\sTMtm0-9,+\-–]+$/.test(x.replace(/türkçe|matematik|mat|tr/gi, ""))) { o.units = siraliUnits(o.units.concat(k)); return; }
    kalan.push(x);
  });
  o.ad = kalan[0] || "";
  o.ogretmen = kalan[1] || "";
  return o.ad ? o : null;
}
function ogrenciBirlestir(liste, durum) {
  let eklenen = 0, guncellenen = 0;
  liste.forEach(function (o) {
    // numara varsa numaraya, yoksa ad + sınıfa göre eşleştir
    const ex = o.no ? appData.students.find(function (s) { return s.no === o.no; })
      : appData.students.find(function (s) { return !s.no && trLower(s.ad) === trLower(o.ad) && (!o.sinif || trLower(s.sinif) === trLower(o.sinif)); });
    if (ex) {
      ex.ad = o.ad || ex.ad;
      if (o.sinif) ex.sinif = o.sinif;
      if (o.ogretmen) ex.ogretmen = o.ogretmen;
      if (o.units.length) ex.units = o.units;
      ["hedef", "ozel", "gerekce"].forEach(function (k) { if (o[k] !== undefined) ex[k] = o[k]; });
      if (o.durum) ex.durum = o.durum;
      guncellenen++;
    } else {
      appData.students.push({
        id: yeniId(), no: o.no || "", ad: o.ad, sinif: o.sinif || appData.settings.varsayilanSinif || "",
        ogretmen: o.ogretmen || "", units: o.units, hedef: o.hedef || ["yetersiz"], ozel: !!o.ozel,
        durum: o.ozel ? "dahil_degil" : (o.durum || durum || "dahil"), gerekce: o.gerekce || (o.ozel ? "Özel eğitim ihtiyacı" : ""),
        veli: "", not: "", oda: { TR: "", MAT: "" }, izleme: {}, pg: {}
      });
      eklenen++;
    }
  });
  return { eklenen: eklenen, guncellenen: guncellenen };
}
function topluAktar() {
  const satirlar = metinSatirlari($("topluMetin").value);
  const liste = satirlar.map(satirdanOgrenci).filter(Boolean);
  if (!liste.length) { bildir("Aktarılacak satır bulunamadı. Her satırda en az öğrencinin adı soyadı olmalıdır.", "hata"); return; }
  const r = ogrenciBirlestir(liste, $("topluDurum").value);
  $("topluMetin").value = "";
  bildir(r.eklenen + " öğrenci eklendi, " + r.guncellenen + " öğrenci güncellendi.");
  sekmeAc("students");
  yenile();
}
const SABLON_BASLIK = ["Öğrenci No", "Adı Soyadı", "Sınıfı", "Sınıf Öğretmeni", "Türkçe (T1, T2)", "Matematik (M1–M4)", "Hedef Kitle", "Özel Eğitim", "Komisyon Kararı", "Gerekçe"];
function sablonIndir() {
  const N = 300;
  const satirlar = [SABLON_BASLIK.map(function (b) { return { v: b, s: 1 }; })];
  for (let r = 2; r <= N; r++) satirlar.push([{ v: "", s: 9 }, { v: "", s: 2 }, { v: "", s: 3 }, { v: "", s: 2 }, { v: "", s: 3 }, { v: "", s: 3 }, { v: "", s: 2 }, { v: "", s: 3 }, { v: "", s: 3 }, { v: "", s: 2 }]);
  const aciklama = [
    [{ v: "İYEP ÖĞRENCİ AKTARIM ŞABLONU – AÇIKLAMALAR", s: 5 }],
    ["Bilgileri \"Ogrenciler\" sayfasına 2. satırdan itibaren giriniz; başlık satırını değiştirmeyiniz. Zorunlu alan yalnızca \"Adı Soyadı\"dır."],
    ["Aynı numaralı öğrenci programda varsa bilgileri güncellenir, yoksa yeni öğrenci eklenir."],
    ["Türkçe: ÖBA ile eksikliği belirlenen öğrenme alanları. T1 = 1. Öğrenme Alanı (İYEP 2. Sınıf Türkçe, 68 saat), T2 = 2. Öğrenme Alanı (İYEP 3. Sınıf Türkçe, 26 saat)."],
    ["Matematik: M1 = Sayılar ve Nicelikler-1 (10 s), M2 = İşlemlerden Cebirsel Düşünmeye-1 (10 s), M3 = Sayılar ve Nicelikler-2 (12 s), M4 = İşlemlerden Cebirsel Düşünmeye-2 (34 s)."],
    ["Kod örnekleri: \"T1 T2\", \"T1+\" (1. ÖA'dan sona kadar), \"M2-M4\", \"M3+\". Bu dersten ihtiyacı yoksa boş bırakınız."],
    ["Hedef Kitle: Öğrenme çıktısı yetersiz / Göçmen-sığınmacı / Geçici koruma / Mevsimlik tarım / Dezavantajlı (boşsa: öğrenme çıktısı yetersiz)."],
    ["Özel Eğitim: Var ise öğrenci İYEP kapsamı dışında tutulur (dâhil edilmedi olarak aktarılır)."],
    ["Komisyon Kararı: Dâhil / Aday / Dâhil Değil / Ayrıldı (boşsa aktarım ekranındaki seçim kullanılır)."]
  ];
  const blob = xlsxOlustur([
    { ad: "Ogrenciler", satirlar: satirlar, genislik: [12, 28, 9, 24, 15, 17, 24, 12, 16, 36], dondur: 1, yukseklik: { 1: 32 },
      dogrulama: [
        { sqref: "E2:E" + N, liste: ["T1 T2", "T1", "T2"], serbest: true },
        { sqref: "F2:F" + N, liste: ["M1 M2 M3 M4", "M2 M3 M4", "M3 M4", "M4", "M1", "M2", "M3"], serbest: true },
        { sqref: "G2:G" + N, liste: ["Öğrenme çıktısı yetersiz", "Göçmen-sığınmacı", "Geçici koruma", "Mevsimlik tarım", "Dezavantajlı"], serbest: true },
        { sqref: "H2:H" + N, liste: ["Yok", "Var"] },
        { sqref: "I2:I" + N, liste: ["Dâhil", "Aday", "Dâhil Değil", "Ayrıldı"] }
      ] },
    { ad: "Aciklama", satirlar: aciklama, genislik: [130], varsayilanStil: 10 }
  ]);
  dosyaIndir(blob, "IYEP_Ogrenci_Sablonu.xlsx");
  bildir("Taslak Excel indirildi.");
}
function hedefCoz(v) {
  const s = trLower(v);
  if (!s) return undefined;
  const k = [];
  if (/göç|sığın|siginmaci|gocmen/.test(s)) k.push("gocmen");
  if (/geçici|gecici/.test(s)) k.push("gecici");
  if (/mevsim/.test(s)) k.push("mevsimlik");
  if (/dezavantaj/.test(s)) k.push("dezavantajli");
  if (/yetersiz|öğrenme|ogrenme|çıktı/.test(s) || !k.length) k.push("yetersiz");
  return k;
}
function durumCoz(v) {
  const s = trLower(v);
  if (!s) return undefined;
  if (/değil|degil|edilmedi|hayır/.test(s)) return "dahil_degil";
  if (/ayrıl|ayril|nakil/.test(s)) return "ayrildi";
  if (/aday|bekl/.test(s)) return "aday";
  return "dahil";
}
function tabloSatirlariniAktar(satirlar, durum) {
  satirlar = satirlar.filter(function (r) { return r && r.some(function (v) { return v; }); });
  if (!satirlar.length) return { eklenen: 0, guncellenen: 0 };
  const bas = satirlar[0].map(trLower);
  if (!bas.some(function (h) { return /soyad|adı|^ad$/.test(h); })) {
    return ogrenciBirlestir(satirlar.map(satirdanOgrenci).filter(Boolean), durum);
  }
  const bul = function (re, degil) { return bas.findIndex(function (h) { return re.test(h) && !(degil && degil.test(h)); }); };
  const ix = { no: bul(/^no|numara|öğrenci no/), ad: bul(/soyad|^adı|^ad$/), sinif: bul(/sınıf|sinif|şube/, /öğretmen/), ogretmen: bul(/öğretmen|ogretmen/),
    tr: bul(/türkçe|turkce/), mat: bul(/matematik/), hedef: bul(/hedef/), ozel: bul(/özel|ozel/), durum: bul(/karar|durum/), gerekce: bul(/gerekçe|gerekce|açıklama|neden/) };
  const al = function (r, k) { return ix[k] >= 0 ? String(r[ix[k]] == null ? "" : r[ix[k]]).trim() : ""; };
  const liste = satirlar.slice(1).map(function (r) {
    const ad = al(r, "ad");
    if (!ad) return null;
    const o = { no: al(r, "no"), ad: ad, sinif: al(r, "sinif"), ogretmen: al(r, "ogretmen"),
      units: siraliUnits(kodCoz(al(r, "tr").replace(/M/gi, "")).concat(kodCoz(al(r, "mat").replace(/T/gi, "")))) };
    // "1 2" gibi yalnız rakam girilmişse sütuna göre yorumla
    if (!o.units.length || /^[\s0-9,+\-–]+$/.test(al(r, "tr") + al(r, "mat"))) {
      const trK = kodCoz(al(r, "tr").replace(/(\d)/g, "T$1")), matK = kodCoz(al(r, "mat").replace(/(\d)/g, "M$1"));
      o.units = siraliUnits(o.units.concat(trK, matK).filter(function (x, i, a) { return a.indexOf(x) === i; }));
    }
    const h = hedefCoz(al(r, "hedef")); if (h) o.hedef = h;
    const oz = trLower(al(r, "ozel")); if (oz) o.ozel = /^(var|evet)/.test(oz);
    const d = durumCoz(al(r, "durum")); if (d) o.durum = d;
    if (o.ozel && o.durum === "dahil") o.durum = "dahil_degil";
    const g = al(r, "gerekce"); if (g) o.gerekce = g;
    return o;
  }).filter(Boolean);
  return ogrenciBirlestir(liste, durum);
}
async function excelYukle(ev) {
  const file = ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  try {
    const r = tabloSatirlariniAktar(await tabloDosyasiOku(file), $("topluDurum").value || "dahil");
    if (!r.eklenen && !r.guncellenen) { bildir("Dosyada aktarılacak öğrenci bulunamadı. \"Adı Soyadı\" sütununu kontrol edin.", "hata"); return; }
    bildir(r.eklenen + " öğrenci eklendi, " + r.guncellenen + " öğrenci güncellendi.");
    sekmeAc("students");
    yenile();
  } catch (e) { bildir("Dosya okunamadı: " + e.message, "hata"); }
}

/* ---------- gruplar ---------- */
function grupGorevOzet(g) {
  const ogr = grupOgrencileri(g);
  const kendi = ogr.filter(function (st) { return st.ogretmen && g.ogretmen && trLower(st.ogretmen) === trLower(g.ogretmen); }).length;
  return { kendi: kendi, toplam: ogr.length };
}
// İYEP 1.2: kendi sınıf öğretmeni öncelikli; değilse okul yönetimince görevlendirilen öğretmen
function grupGorevMetni(g) {
  const oz = grupGorevOzet(g);
  if (!oz.toplam) return "–";
  if (oz.kendi === oz.toplam) return "Öğrencilerin kendi sınıf öğretmeni";
  if (!oz.kendi) return "Okul yönetimince görevlendirilen öğretmen";
  return "Kendi sınıf öğretmeni (" + oz.kendi + "/" + oz.toplam + " öğrenci), diğerleri için görevlendirilen öğretmen";
}
function gruplarCiz() {
  ogretmenDatalist();
  if (!$("grGunler").innerHTML) {
    $("grGunler").innerHTML = GUN_KEYS.map(function (k) {
      return '<div class="d ' + (HAFTA_SONU[k] ? "we" : "") + '"><small>' + GUN_KISA[k] + '</small><input class="in" type="number" min="0" max="' + gunLimit(k) + '" id="gun_' + k + '" oninput="grupGunDenetle()"></div>';
    }).join("");
    $("grDers").addEventListener("change", function () { grUnitsCiz([]); });
    grupFormTemizle();
  }
  $("otoIdeal").textContent = appData.settings.grupIdeal;
  // grup tablosu
  $("grTbody").innerHTML = appData.groups.length ? appData.groups.map(function (g) {
    const p = grupPlanCache(g), ogr = grupOgrencileri(g), oz = grupGorevOzet(g);
    const sorun = gunlerDenetle(g.gunler);
    const dag = GUN_KEYS.filter(function (k) { return sayi(g.gunler[k]); }).map(function (k) { return GUN_KISA[k] + " " + g.gunler[k]; }).join(" · ") || "–";
    return "<tr><td><b>" + esc(g.ad) + "</b></td><td>" + '<span class="badge ' + (g.ders === "MAT" ? "mat" : "tr") + '">' + DERSLER[g.ders].ad + '</span> <span class="small">' + esc(unitEtiket(g.units)) + "</span></td>" +
      "<td>" + esc(g.ogretmen || "–") + (ogr.length ? '<div class="small muted">Kendi sınıf öğretmeni: ' + oz.kendi + "/" + oz.toplam + "</div>" : "") + "</td>" +
      '<td class="num">' + (ogr.length > sayi(appData.settings.grupMax, 10) ? '<span class="badge amber">' + ogr.length + "</span>" : ogr.length) + "</td>" +
      '<td class="small">' + dag + (sorun.length ? ' <span class="badge red" title="' + esc(sorun.join("; ")) + '">Sınır aşımı</span>' : "") + "</td>" +
      '<td class="num">' + haftalikSaat(g.gunler) + '</td><td class="num"><b>' + grupSaatToplam(g) + "</b></td><td>" + (p.bitis ? trTarih(p.bitis) : '<span class="muted small">' + esc(p.hata) + "</span>") + "</td>" +
      '<td class="nowrap"><button class="ico-btn" title="Düzenle" onclick="grupDuzenle(\'' + g.id + '\')">✏️</button><button class="ico-btn" title="Takvim" onclick="appData.ui.takvimGrup=\'' + g.id + '\';sekmeAc(\'takvim\')">🗓️</button><button class="ico-btn" title="Sil" onclick="grupSil(\'' + g.id + '\')">🗑</button></td></tr>';
  }).join("") : '<tr><td colspan="9" class="empty">Henüz grup yok. Formdan grup tanımlayın veya otomatik gruplamayı kullanın.</td></tr>';
  // atama
  const sel = $("atamaGrup"), onceki = sel.value;
  sel.innerHTML = appData.groups.map(function (g) { return '<option value="' + g.id + '">' + esc(g.ad) + " (" + DERSLER[g.ders].ad + ")</option>"; }).join("") || '<option value="">Önce grup oluşturun</option>';
  if (onceki && grup(onceki)) sel.value = onceki;
  atamaCiz();
}
function grUnitsCiz(secili) {
  const ders = $("grDers").value;
  $("grUnits").innerHTML = (ders === "MAT" ? MAT_UNITS : TR_UNITS).map(function (u) { return unitChip(u, secili.indexOf(u.id) >= 0, "grUnit", "grSaatGoster()"); }).join("");
  grSaatGoster();
}
function grSeciliUnits() { return siraliUnits(Array.from(document.querySelectorAll('input[name="grUnit"]:checked')).map(function (x) { return x.value; })); }
function grSaatGoster() {
  const t = unitSaatToplam(grSeciliUnits()), h = GUN_KEYS.reduce(function (a, k) { return a + sayi($("gun_" + k) && $("gun_" + k).value); }, 0);
  $("grSaatOzet").textContent = t ? "Programdaki toplam süre: " + t + " ders saati" + (h ? " · haftada " + h + " saatle yaklaşık " + Math.ceil(t / h) + " hafta" : "") : "";
}
function grupGunleriOku() { const o = {}; GUN_KEYS.forEach(function (k) { o[k] = Math.max(0, sayi($("gun_" + k).value)); }); return o; }
function grupGunDenetle() {
  const g = grupGunleriOku();
  GUN_KEYS.forEach(function (k) { $("gun_" + k).classList.toggle("bad", g[k] > gunLimit(k)); });
  const sorun = gunlerDenetle(g);
  $("grGunMesaj").innerHTML = sorun.length ? '<span style="color:var(--err)">⛔ ' + esc(sorun.join("; ")) + "</span>" : '<span style="color:var(--ok)">✓ Uygun · haftalık ' + haftalikSaat(g) + " ders saati</span>";
  grSaatGoster();
  return !sorun.length;
}
function grupFormTemizle() {
  $("grId").value = "";
  $("grAd").value = "";
  $("grDers").value = "TR";
  $("grOgretmen").value = ""; $("grTc").value = ""; $("grBrans").value = "Sınıf Öğretmeni"; $("grDerslik").value = "";
  $("grNormal").value = 30; $("grDiger").value = 0; $("grBaslama").value = ""; $("grSaatler").value = "";
  $("grKadro").value = "Kadrolu";
  GUN_KEYS.forEach(function (k) { $("gun_" + k).value = 0; });
  grUnitsCiz([]);
  grupGunDenetle();
  $("grFormBaslik").textContent = "🧩 Grup tanımla";
}
function grupDuzenle(id) {
  const g = grup(id);
  if (!g) return;
  if (appData.ui.tab !== "groups") sekmeAc("groups");
  $("grId").value = g.id; $("grAd").value = g.ad; $("grDers").value = g.ders;
  $("grOgretmen").value = g.ogretmen || ""; $("grTc").value = g.tc || ""; $("grBrans").value = g.brans || ""; $("grDerslik").value = g.derslik || "";
  $("grNormal").value = g.normalSaat == null ? 30 : g.normalSaat; $("grDiger").value = g.digerKurs || 0; $("grBaslama").value = g.baslama || "";
  $("grSaatler").value = g.calismaSaatleri || ""; $("grKadro").value = g.kadro || "Kadrolu";
  GUN_KEYS.forEach(function (k) { $("gun_" + k).value = sayi(g.gunler[k]); });
  grUnitsCiz(g.units);
  grupGunDenetle();
  $("grFormBaslik").textContent = "✏️ Grubu düzenle";
  $("atamaGrup").value = g.id;
  atamaCiz();
  window.scrollTo(0, 0);
}
function grupKaydet() {
  const ad = $("grAd").value.trim();
  if (!ad) { bildir("Grup adı zorunludur.", "hata"); return; }
  const units = grSeciliUnits();
  if (!units.length) { bildir("Grupta işlenecek en az bir öğrenme alanı / tema seçiniz.", "hata"); return; }
  if (!grupGunDenetle()) { bildir("Ders saati sınırı aşılıyor: hafta içi günde 2, hafta sonu günde 6, haftada toplam 10 ders saatini geçemez (İYEP 1.2).", "hata"); return; }
  const tc = $("grTc").value.trim();
  if (tc && !/^\d{11}$/.test(tc)) { bildir("T.C. kimlik numarası 11 haneli olmalıdır.", "hata"); return; }
  const veri = {
    ad: ad, ders: $("grDers").value, units: units, ogretmen: $("grOgretmen").value.trim(), tc: tc, brans: $("grBrans").value.trim(),
    derslik: $("grDerslik").value.trim(), normalSaat: sayi($("grNormal").value), digerKurs: sayi($("grDiger").value), baslama: $("grBaslama").value,
    calismaSaatleri: $("grSaatler").value.trim(), kadro: $("grKadro").value, gunler: grupGunleriOku()
  };
  const id = $("grId").value;
  if (id) {
    const g = grup(id);
    if (g.ders !== veri.ders) g.ogrenciler = [];
    Object.assign(g, veri);
    bildir("Grup güncellendi.");
  } else {
    const g = Object.assign({ id: yeniId(), ogrenciler: [], planNot: {}, yansitma: {}, rehberlik: {} }, veri);
    appData.groups.push(g);
    $("atamaGrup").value = g.id;
    bildir("Grup oluşturuldu. Şimdi öğrencileri atayabilirsiniz.");
  }
  grupFormTemizle();
  yenile();
}
function grupSil(id) {
  const g = grup(id);
  if (!g || !confirm(g.ad + " grubu silinsin mi? (Öğrenci kayıtları silinmez.)")) return;
  appData.groups = appData.groups.filter(function (x) { return x.id !== id; });
  yenile();
}
function atamaCiz() {
  const g = grup($("atamaGrup").value);
  if (!g) { $("atamaListe").innerHTML = '<div class="empty">Grup yok.</div>'; $("atamaSayac").textContent = ""; return; }
  const aday = dahilOgrenciler().filter(function (st) { return dersUnits(st.units, g.ders).length || g.ogrenciler.indexOf(st.id) >= 0; })
    .sort(function (a, b) { return (g.ogrenciler.indexOf(b.id) >= 0) - (g.ogrenciler.indexOf(a.id) >= 0) || siralaTr(a.sinif, b.sinif) || siralaTr(a.no, b.no); });
  $("atamaListe").innerHTML = aday.length ? aday.map(function (st) {
    const diger = ogrenciGruplari(st).filter(function (x) { return x.id !== g.id && x.ders === g.ders; }).map(function (x) { return x.ad; });
    const ihtiyac = dersUnits(st.units, g.ders);
    const ortak = ihtiyac.filter(function (u) { return g.units.indexOf(u) >= 0; });
    return '<label class="chk" style="display:flex; padding:6px 4px; border-bottom:1px solid var(--border)"><input type="checkbox" class="atamaSec" value="' + st.id + '"' + (g.ogrenciler.indexOf(st.id) >= 0 ? " checked" : "") + ' onchange="atamaSay()">' +
      '<span style="flex:1"><b>' + esc(st.ad) + '</b> <span class="muted small">' + esc(st.no + " · " + st.sinif + " · " + (st.ogretmen || "")) + '</span><br><span class="small">İhtiyaç: ' + esc(unitEtiket(ihtiyac)) +
      (ihtiyac.length && !ortak.length ? ' <span class="badge amber">Grubun ÖA / temalarıyla örtüşmüyor</span>' : "") + (diger.length ? ' <span class="badge blue">Diğer grup: ' + esc(diger.join(", ")) + "</span>" : "") + "</span></span></label>";
  }).join("") : '<div class="empty">Bu dersten ihtiyacı olan, programa dâhil öğrenci yok.</div>';
  atamaSay();
}
function atamaSay() {
  const n = document.querySelectorAll(".atamaSec:checked").length, m = sayi(appData.settings.grupMax, 10);
  $("atamaSayac").textContent = n + " öğrenci";
  $("atamaSayac").className = "badge " + (n > m ? "amber" : "green");
}
function atamaKaydet() {
  const g = grup($("atamaGrup").value);
  if (!g) return;
  const ids = Array.from(document.querySelectorAll(".atamaSec:checked")).map(function (c) { return c.value; });
  const eski = g.ogrenciler;
  g.ogrenciler = ids;
  // öğrenci bazlı haftalık yük denetimi
  const asan = ids.map(ogrenci).filter(function (st) { return gunlerDenetle(ogrenciYuk(st)).length; });
  if (asan.length) {
    g.ogrenciler = eski;
    bildir(asan.map(function (s) { return s.ad; }).join(", ") + ": katıldığı grupların toplamında günlük / haftalık ders saati sınırı aşılıyor. Atama yapılmadı.", "hata");
    return;
  }
  bildir(g.ad + " grubuna " + ids.length + " öğrenci atandı.");
  yenile();
}
function otomatikGrupla() {
  const ideal = Math.max(1, sayi(appData.settings.grupIdeal, 6));
  let olusan = 0, atanan = 0;
  ["TR", "MAT"].forEach(function (ders) {
    const bekleyen = dahilOgrenciler().filter(function (st) {
      return dersUnits(st.units, ders).length && !ogrenciGruplari(st).some(function (g) { return g.ders === ders; });
    });
    // başlangıç öğrenme alanı / temaya göre kovalar
    const kova = {};
    bekleyen.forEach(function (st) { const k = dersUnits(st.units, ders)[0]; (kova[k] = kova[k] || []).push(st); });
    Object.keys(kova).sort(function (a, b) { return UNIT_IDS.indexOf(a) - UNIT_IDS.indexOf(b); }).forEach(function (k) {
      const liste = kova[k].sort(function (a, b) { return siralaTr(a.sinif, b.sinif) || siralaTr(a.no, b.no); });
      const parca = Math.ceil(liste.length / ideal);
      for (let p = 0; p < parca; p++) {
        const uyeler = liste.filter(function (x, i) { return i % parca === p; });
        const units = siraliUnits(Array.from(new Set([].concat.apply([], uyeler.map(function (st) { return dersUnits(st.units, ders); })))));
        const sayac = {};
        uyeler.forEach(function (st) { if (st.ogretmen) sayac[st.ogretmen] = (sayac[st.ogretmen] || 0) + 1; });
        const ogretmen = Object.keys(sayac).sort(function (a, b) { return sayac[b] - sayac[a]; })[0] || "";
        const no = appData.groups.filter(function (g) { return g.ders === ders; }).length + 1;
        appData.groups.push({
          id: yeniId(), ad: DERSLER[ders].ad + "-" + no, ders: ders, units: units, ogretmen: ogretmen, tc: "",
          kadro: "Kadrolu", brans: "Sınıf Öğretmeni", normalSaat: 30, digerKurs: 0, calismaSaatleri: "", derslik: "", baslama: "",
          gunler: ders === "TR" ? { pzt: 2, sal: 0, car: 2, per: 0, cum: 0, cmt: 0, paz: 0 } : { pzt: 0, sal: 2, car: 0, per: 2, cum: 0, cmt: 0, paz: 0 },
          ogrenciler: uyeler.map(function (st) { return st.id; }), planNot: {}, yansitma: {}, rehberlik: {}
        });
        olusan++; atanan += uyeler.length;
      }
    });
  });
  bildir(olusan ? olusan + " grup oluşturuldu, " + atanan + " öğrenci atandı. Haftalık ders dağılımlarını ve öğretmenleri kontrol ediniz." : "Gruba atanmamış öğrenci yok.");
  yenile();
}
