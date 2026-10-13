/* ==========================================================================
   UYGULAMA TAKVİMİ, İZLEME & DEĞERLENDİRME, ÖĞRETİM PROGRAMI, USUL VE ESASLAR, YEDEK
   ========================================================================== */

function grupSecenekleri(secili) {
  return appData.groups.map(function (g) {
    return '<option value="' + g.id + '"' + (g.id === secili ? " selected" : "") + ">" + esc(g.ad) + " · " + DERSLER[g.ders].ad + (g.ogretmen ? " · " + esc(g.ogretmen) : "") + "</option>";
  }).join("");
}
function seciliGrup(uiKey) {
  let g = grup(appData.ui[uiKey]);
  if (!g && appData.groups.length) { g = appData.groups[0]; appData.ui[uiKey] = g.id; }
  return g;
}
function haftaVarsayilanNot(h) {
  const p = [];
  h.ilk.forEach(function (u) { p.push(UNIT[u].kisa + ": ön değerlendirme ve köprü kurma"); });
  h.son.forEach(function (u) { p.push(UNIT[u].kisa + ": performans görevi ve değerlendirme"); });
  return p.join(" · ");
}
function haftaNot(g, h) { return (g.planNot && g.planNot[isoFormat(h.bas)]) || haftaVarsayilanNot(h); }
function haftaOcEtiket(h) {
  if (h.ocs.length) return h.ocs.join(", ");
  return h.units.map(function (u) { const c = UNIT[u].ciktilar; return c[0].kod + " – " + c[c.length - 1].kod; }).join(", ");
}

/* ---------- takvim ---------- */
function takvimCiz() {
  const g = seciliGrup("takvimGrup");
  const sel = $("takvimGrup");
  sel.innerHTML = grupSecenekleri(g && g.id) || '<option value="">Grup yok</option>';
  sel.onchange = function () { appData.ui.takvimGrup = sel.value; takvimCiz(); gecikmeliKaydet(); };
  if (!g) {
    $("takvimOzet").innerHTML = "";
    $("takvimHaftalar").innerHTML = '<div class="empty">Takvim için önce grup oluşturun. <button class="btn sm pri" data-go="groups">Gruplar</button></div>';
    return;
  }
  const p = grupPlanCache(g);
  const s = appData.settings;
  const bitis = isoParse(s.bitis);
  let uyari = "";
  if (p.hata) uyari = '<div class="alert uyari"><span>⚠️</span><span class="t">' + esc(p.hata) + "</span></div>";
  else if (bitis && p.bitis > bitis) uyari = '<div class="alert uyari"><span>⚠️</span><span class="t">Program ' + trTarih(p.bitis) + " tarihinde tamamlanıyor ve planlanan bitiş tarihini (" + trTarih(bitis) + ") aşıyor. Haftalık ders saatini (en fazla " + KURAL.haftalik + ") artırmayı veya grubun öğrenme alanı / temalarını gözden geçirmeyi değerlendirin.</span></div>";
  const birim = siraliUnits(g.units).map(function (uid) {
    const r = unitTarihAraligi(p, uid);
    return "<tr><td><b>" + esc(UNIT[uid].baslik) + "</b> " + esc(UNIT[uid].ad) + '</td><td class="num">' + UNIT[uid].saat + "</td><td>" + (r ? trTarih(r.bas) : "–") + "</td><td>" + (r ? trTarih(r.bit) : "–") + "</td></tr>";
  }).join("");
  $("takvimOzet").innerHTML = uyari + '<div class="grid g4 mb">' +
    '<div class="kpi"><div class="l">Başlama</div><div class="v" style="font-size:20px">' + (p.oturumlar.length ? trTarih(p.oturumlar[0].tarih) : "–") + '</div><div class="d">' + esc(GUN_KEYS.filter(function (k) { return sayi(g.gunler[k]); }).map(function (k) { return GUN_KISA[k] + " " + g.gunler[k]; }).join(" · ")) + "</div></div>" +
    '<div class="kpi"><div class="l">Tahmini bitiş</div><div class="v" style="font-size:20px">' + (p.bitis ? trTarih(p.bitis) : "–") + '</div><div class="d">' + p.haftalar.length + " hafta · " + p.oturumlar.length + " ders günü</div></div>" +
    '<div class="kpi ' + (g.ders === "MAT" ? "mat" : "tr") + '"><div class="l">Toplam ders saati</div><div class="v">' + p.toplam + '</div><div class="d">Haftada ' + haftalikSaat(g.gunler) + " saat</div></div>" +
    '<div class="kpi"><div class="l">Öğrenci</div><div class="v">' + grupOgrencileri(g).length + '</div><div class="d">' + esc(g.ogretmen || "Öğretmen girilmedi") + "</div></div></div>" +
    '<div class="card"><div class="card-h"><h3>📚 Öğrenme alanı / tema takvimi</h3></div><div class="tw"><table class="t"><thead><tr><th>Öğrenme alanı / tema</th><th class="num">Saat</th><th>Başlangıç</th><th>Bitiş</th></tr></thead><tbody>' + birim + "</tbody></table></div>" +
    (g.ders === "MAT" ? '<p class="hint mt">Tema süresi öğrenme çıktılarına sırasıyla eşit paylaştırılmıştır (öneri). İYEP 1.2: ders saatleri öğrencinin öğrenme ihtiyacı dikkate alınarak programda öngörülen saatlere uygun planlanır.</p>'
      : '<p class="hint mt">Türkçe öğrenme alanlarında dinleme / izleme, konuşma, okuma ve yazma becerileri bütünleşik işlenir; haftalık satırda öğrenme alanının tüm öğrenme çıktıları gösterilir.</p>') + "</div>";
  $("takvimHaftalar").innerHTML = p.haftalar.length ? '<div class="tw"><table class="t"><thead><tr><th>Hafta</th><th>Tarih</th><th>Ders günleri</th><th>Öğrenme alanı / tema</th><th>Öğrenme çıktıları</th><th class="num">Saat</th><th style="min-width:240px">Açıklama / etkinlik</th></tr></thead><tbody>' +
    p.haftalar.map(function (h) {
      const k = isoFormat(h.bas);
      return '<tr><td class="nowrap"><b>' + h.no + '.</b></td><td class="nowrap small">' + trTarih(h.oturumlar[0].tarih) + (h.oturumlar.length > 1 ? " – " + trTarih(h.oturumlar[h.oturumlar.length - 1].tarih) : "") + "</td>" +
        '<td class="small">' + h.oturumlar.map(function (o) { return GUN_KISA[o.gun] + " " + o.saatler.length; }).join(", ") + "</td>" +
        "<td>" + h.units.map(function (u) { return '<span class="badge ' + (UNIT[u].ders === "MAT" ? "mat" : "tr") + '">' + esc(UNIT[u].kisa) + "</span>"; }).join(" ") + "</td>" +
        '<td class="small">' + esc(haftaOcEtiket(h)) + '</td><td class="num">' + h.saatler.length + '<div class="small muted">' + h.kumulatif + "/" + p.toplam + "</div></td>" +
        '<td><input class="in sm" value="' + esc((g.planNot || {})[k] || "") + '" placeholder="' + esc(haftaVarsayilanNot(h)) + '" oninput="planNotGuncelle(\'' + g.id + "','" + k + "',this.value)\"></td></tr>";
    }).join("") + "</tbody></table></div>" : '<div class="empty">' + esc(p.hata || "Takvim oluşturulamadı.") + "</div>";
}
function planNotGuncelle(gid, k, v) {
  const g = grup(gid);
  if (!g) return;
  g.planNot = g.planNot || {};
  if (v.trim()) g.planNot[k] = v; else delete g.planNot[k];
  gecikmeliKaydet();
}

/* ---------- izleme ---------- */
function izlemeCiz() {
  const g = seciliGrup("izGrup");
  const gs = $("izGrup"), us = $("izUnit");
  gs.innerHTML = grupSecenekleri(g && g.id) || '<option value="">Grup yok</option>';
  gs.onchange = function () { appData.ui.izGrup = gs.value; appData.ui.izUnit = null; izlemeCiz(); gecikmeliKaydet(); };
  if (!g) {
    us.innerHTML = "";
    $("izMatris").innerHTML = '<div class="empty">Önce grup oluşturun.</div>';
    $("pgAlan").innerHTML = ""; $("yansitmaAlan").innerHTML = ""; $("pgDpaTur").textContent = "";
    odaCiz();
    return;
  }
  let uid = appData.ui.izUnit;
  if (g.units.indexOf(uid) < 0) uid = appData.ui.izUnit = g.units[0] || null;
  us.innerHTML = siraliUnits(g.units).map(function (u) { return '<option value="' + u + '"' + (u === uid ? " selected" : "") + ">" + esc(UNIT[u].baslik + " – " + UNIT[u].ad) + "</option>"; }).join("");
  us.onchange = function () { appData.ui.izUnit = us.value; izlemeCiz(); gecikmeliKaydet(); };
  if (!uid) { $("izMatris").innerHTML = '<div class="empty">Grupta öğrenme alanı / tema yok.</div>'; odaCiz(); return; }
  const u = UNIT[uid];
  const ogr = izlemeOgrencileri(g, uid);
  $("izMatris").innerHTML = ogr.length ? '<div class="tw"><table class="t matrix"><thead><tr><th>Öğrenci</th>' +
    u.ciktilar.map(function (c) { return '<th class="oc" title="' + esc(c.ad) + '">' + esc(c.kod) + '<div class="muted" style="font-weight:400">' + esc(c.beceri) + "</div></th>"; }).join("") +
    '<th class="num">Edindi</th></tr></thead><tbody>' +
    ogr.map(function (st) {
      const e = u.ciktilar.filter(function (c) { return st.izleme[c.kod] === "E"; }).length;
      return "<tr><td class=\"nowrap\"><b>" + esc(st.ad) + '</b> <span class="muted small">' + esc(st.no) + "</span></td>" +
        u.ciktilar.map(function (c) { const v = st.izleme[c.kod] || ""; return '<td class="cell ' + v + '" title="' + esc(c.kod + " · " + IZLEME_DURUM[v].ad) + '" onclick="izlemeDegis(\'' + st.id + "','" + c.kod + "')\">" + IZLEME_DURUM[v].kisa + "</td>"; }).join("") +
        '<td class="num"><b>' + e + "</b>/" + u.ciktilar.length + "</td></tr>";
    }).join("") +
    '<tr><td class="muted small">Edinen öğrenci oranı</td>' + u.ciktilar.map(function (c) {
      const n = ogr.filter(function (st) { return st.izleme[c.kod] === "E"; }).length;
      return '<td class="center small"><b>%' + Math.round(100 * n / ogr.length) + "</b></td>";
    }).join("") + "<td></td></tr></tbody></table></div>" : '<div class="empty">Bu grupta ' + esc(u.kisa) + " ihtiyacı olan öğrenci yok.</div>";

  // performans görevi
  const pf = u.performans;
  $("pgDpaTur").textContent = pf.dpa === "analitik" ? "Analitik DPA" : "Bütüncül DPA";
  const olc = pf.olcutler;
  $("pgAlan").innerHTML = '<p class="small"><b>Görev:</b> ' + esc(pf.gorev) + '</p><p class="hint">Puanlama: 4 Çok iyi · 3 İyi · 2 Geliştirilmeli · 1 Başlangıç. Ölçütler programdaki performans görevi tanımından türetilmiş önerilerdir.</p>' +
    (ogr.length ? '<div class="tw"><table class="t"><thead><tr><th>Öğrenci</th>' + olc.map(function (o, i) { return '<th class="center" title="' + esc(o) + '">' + (olc.length > 1 ? "Ö" + (i + 1) : "Düzey") + "</th>"; }).join("") + '<th class="num">Toplam</th><th>Tarih</th></tr></thead><tbody>' +
      ogr.map(function (st) {
        const kayit = (st.pg || {})[uid] || {};
        const p = kayit.puanlar || [];
        return "<tr><td class=\"nowrap\">" + esc(st.ad) + "</td>" + olc.map(function (o, i) {
          return '<td class="center"><select class="in sm" style="width:58px" onchange="pgGuncelle(\'' + st.id + "','" + uid + "'," + i + ',this.value)"><option value="">–</option>' +
            DPA_DUZEY.map(function (d) { return '<option value="' + d.p + '"' + (sayi(p[i]) === d.p ? " selected" : "") + ">" + d.p + "</option>"; }).join("") + "</select></td>";
        }).join("") + '<td class="num" id="pgT_' + st.id + '"><b>' + (kayit.puan || "–") + "</b>/" + (4 * olc.length) + "</td>" +
          '<td><input class="in sm" type="date" value="' + esc(kayit.tarih || "") + '" onchange="pgTarih(\'' + st.id + "','" + uid + "',this.value)\"></td></tr>";
      }).join("") + "</tbody></table></div>" +
      (olc.length > 1 ? '<div class="hint mt">' + olc.map(function (o, i) { return "Ö" + (i + 1) + ": " + esc(o); }).join(" · ") + "</div>" : '<div class="hint mt">' + esc(olc[0]) + "</div>")
      : "");

  // öğretmen yansıtması
  const y = (g.yansitma || {})[uid] || {};
  const alan = function (k, l, ph) { return '<div class="f mt"><label>' + l + '</label><textarea class="in" placeholder="' + esc(ph) + '" oninput="yansitmaGuncelle(\'' + g.id + "','" + uid + "','" + k + "',this.value)\">" + esc(y[k] || "") + "</textarea></div>"; };
  $("yansitmaAlan").innerHTML = alan("guclu", "Güçlü yönler", "Öğrenme-öğretme sürecinde iyi işleyenler…") +
    alan("gelistir", "İyileştirilmesi gereken yönler", "Zorlanılan çıktılar, süre, materyal…") +
    alan("oneri", "Programa yönelik görüş ve öneriler", "Program kitapçığındaki karekod ile MEB'e iletilebilir.");
  odaCiz();
}
function izlemeOgrencileri(g, uid) {
  const tum = grupOgrencileri(g);
  const ihtiyac = tum.filter(function (st) { return st.units.indexOf(uid) >= 0; });
  return ihtiyac.length ? ihtiyac : tum;
}
function izlemeDegis(sid, kod) {
  const st = ogrenci(sid);
  if (!st) return;
  const sira = ["", "G", "E"];
  const yeni = sira[(sira.indexOf(st.izleme[kod] || "") + 1) % 3];
  if (yeni) st.izleme[kod] = yeni; else delete st.izleme[kod];
  izlemeCiz();
  yenile(false);
}
function pgGuncelle(sid, uid, i, v) {
  const st = ogrenci(sid);
  st.pg = st.pg || {};
  const k = st.pg[uid] = st.pg[uid] || { puanlar: [], tarih: "" };
  k.puanlar[i] = sayi(v) || 0;
  const olc = UNIT[uid].performans.olcutler.length;
  const dolu = k.puanlar.slice(0, olc).filter(function (x) { return x; });
  k.puan = dolu.length === olc ? dolu.reduce(function (a, b) { return a + b; }, 0) : 0;
  if (k.puan && !k.tarih) k.tarih = bugunIso();
  izlemeCiz();
  yenile(false);
}
function pgTarih(sid, uid, v) {
  const st = ogrenci(sid);
  st.pg = st.pg || {};
  st.pg[uid] = Object.assign({ puanlar: [] }, st.pg[uid], { tarih: v });
  gecikmeliKaydet();
}
function yansitmaGuncelle(gid, uid, k, v) {
  const g = grup(gid);
  g.yansitma = g.yansitma || {};
  g.yansitma[uid] = Object.assign({}, g.yansitma[uid], { [k]: v });
  gecikmeliKaydet();
}
function odaCiz() {
  const dahil = dahilOgrenciler().slice().sort(function (a, b) { return siralaTr(a.sinif, b.sinif) || siralaTr(a.no, b.no); });
  if (!dahil.length) { $("odaAlan").innerHTML = '<div class="empty">Programa dâhil öğrenci yok.</div>'; return; }
  const sec = function (st, d) {
    if (!dersUnits(st.units, d).length) return '<span class="muted">–</span>';
    return '<select class="in sm" onchange="odaGuncelle(\'' + st.id + "','" + d + '\',this.value)">' +
      Object.keys(ODA_DURUM).map(function (k) { return '<option value="' + k + '"' + (st.oda[d] === k ? " selected" : "") + ">" + ODA_DURUM[k].ad + "</option>"; }).join("") + "</select>";
  };
  const ozet = function (d) {
    const l = dahil.filter(function (st) { return dersUnits(st.units, d).length; });
    return DERSLER[d].ad + ": " + Object.keys(ODA_DURUM).filter(function (k) { return k; }).map(function (k) { return ODA_DURUM[k].ad.replace("Öğrenme çıktılarına ulaştı", "Ulaştı") + " " + l.filter(function (st) { return st.oda[d] === k; }).length; }).join(" · ") +
      " · Girilmedi " + l.filter(function (st) { return !st.oda[d]; }).length;
  };
  $("odaAlan").innerHTML = '<div class="row mb small"><span class="badge tr wrap">' + ozet("TR") + '</span><span class="badge mat wrap">' + ozet("MAT") + "</span></div>" +
    '<div class="tw"><table class="t"><thead><tr><th>No</th><th>Adı soyadı</th><th>Sınıf</th><th>Türkçe ÖDA</th><th>Matematik ÖDA</th></tr></thead><tbody>' +
    dahil.map(function (st) { return "<tr><td>" + esc(st.no) + "</td><td>" + esc(st.ad) + "</td><td>" + esc(st.sinif) + "</td><td>" + sec(st, "TR") + "</td><td>" + sec(st, "MAT") + "</td></tr>"; }).join("") + "</tbody></table></div>";
}
function odaGuncelle(sid, d, v) { const st = ogrenci(sid); st.oda[d] = v; odaCiz(); yenile(false); }

/* ---------- öğretim programı ---------- */
function programCiz() {
  const sec = appData.ui.progSekme || "genel";
  $("progTabs").innerHTML = '<button class="btn sm ' + (sec === "genel" ? "pri" : "out") + '" onclick="progSekme(\'genel\')">Genel bakış</button>' +
    UNITS.map(function (u) { return '<button class="btn sm ' + (sec === u.id ? "pri" : "out") + '" onclick="progSekme(\'' + u.id + '\')">' + (u.ders === "TR" ? "📖 " : "📐 ") + esc(u.kisa) + "</button>"; }).join("");
  $("progIcerik").innerHTML = sec === "genel" ? programGenel() : programUnit(UNIT[sec]);
}
function progSekme(s) { appData.ui.progSekme = s; programCiz(); gecikmeliKaydet(); }
function programGenel() {
  const tablo = function (ders) {
    const us = ders === "TR" ? TR_UNITS : MAT_UNITS;
    return '<div class="tw"><table class="t"><thead><tr><th>' + DERSLER[ders].birim + '</th><th class="num">Öğrenme çıktısı</th><th class="num">Ders saati</th><th class="num">%</th></tr></thead><tbody>' +
      us.map(function (u) { return "<tr><td><b>" + esc(u.baslik) + "</b> – " + esc(u.ad) + '<div class="small muted">' + esc(u.odak) + '</div></td><td class="num">' + u.ciktilar.length + '</td><td class="num">' + u.saat + '</td><td class="num">' + u.yuzde + "</td></tr>"; }).join("") +
      '<tr><td><b>TOPLAM</b></td><td class="num"><b>' + us.reduce(function (a, u) { return a + u.ciktilar.length; }, 0) + '</b></td><td class="num"><b>' + TOPLAM_SAAT[ders] + '</b></td><td class="num"><b>100</b></td></tr></tbody></table></div>';
  };
  return '<div class="grid g2"><div><h4 class="mb">📖 İYEP Türkçe (Tablo 2)</h4>' + tablo("TR") +
    '<h4 class="mt mb">Türkçe öğrenme çıktılarının temel dil becerilerine dağılımı (Tablo 1)</h4><div class="tw"><table class="t"><thead><tr><th>Temel dil becerisi</th><th class="num">2. sınıf</th><th class="num">3. sınıf</th><th class="num">Toplam</th></tr></thead><tbody>' +
    TR_BECERI_DAGILIM.map(function (r) { return "<tr><td>" + r.beceri + '</td><td class="num">' + r.s2 + '</td><td class="num">' + r.s3 + '</td><td class="num">' + (r.s2 + r.s3) + "</td></tr>"; }).join("") +
    '<tr><td><b>Toplam</b></td><td class="num"><b>8</b></td><td class="num"><b>12</b></td><td class="num"><b>20</b></td></tr></tbody></table></div></div>' +
    '<div><h4 class="mb">📐 İYEP Matematik (Tablo 3)</h4>' + tablo("MAT") +
    '<h4 class="mt mb">İYEP kitapları (1.5)</h4><div class="tw"><table class="t"><thead><tr><th>Kitap</th><th>Forma</th><th>Ebat</th></tr></thead><tbody>' +
    KITAPLAR.map(function (k) { return "<tr><td>" + k.ad + "</td><td>" + k.forma + "</td><td>" + k.ebat + "</td></tr>"; }).join("") + "</tbody></table></div></div></div>" +
    '<p class="hint mt">İYEP Türkçe dersi toplam ' + TOPLAM_SAAT.TR + ", İYEP Matematik dersi toplam " + TOPLAM_SAAT.MAT + " ders saatidir. Ders kodları: İ.T.D (dinleme / izleme), İ.T.K (konuşma), İ.T.O (okuma), İ.T.Y (yazma), İ.MAT (matematik). Kaynak: " + esc(PROGRAM_KAYNAK) + ".</p>";
}
function programUnit(u) {
  const m = PROGRAM_METIN[u.id] || {};
  const p = function (dizi) { return '<div class="prose">' + (dizi || []).map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + "</div>"; };
  const uyg = (m.uyg || []).map(function (b) { return (b.oc ? '<p><span class="badge blue">' + esc(b.oc) + "</span></p>" : "") + p(b.p); }).join("");
  return '<div class="row between"><div><h3 style="font-size:18px">' + esc(u.baslik + ": " + u.ad) + '</h3><p class="muted small" style="margin:4px 0 0">' + esc(DERSLER[u.ders].uzun) + "</p></div>" +
    '<div class="row"><span class="badge ' + (u.ders === "MAT" ? "mat" : "tr") + '">' + u.saat + " ders saati</span><span class=\"badge\">" + u.ciktilar.length + " öğrenme çıktısı</span></div></div>" +
    '<p class="mt">' + esc(u.aciklama) + "</p>" +
    '<div class="prog-sec"><div class="kv">' +
    [["Alan becerileri", u.alanBecerileri], ["Kavramsal beceriler", u.kavramsal], ["Eğilimler", u.egilimler], ["Sosyal-duygusal öğrenme becerileri", u.sdb], ["Değerler", u.degerler],
      ["Okuryazarlık becerileri", u.okuryazarlik], ["Disiplinler arası ilişkiler", u.disiplinler], ["Beceriler arası ilişkiler", u.becerilerArasi]]
      .map(function (r) { return "<div>" + r[0] + "</div><div>" + esc(r[1]) + "</div>"; }).join("") + "</div></div>" +
    '<div class="prog-sec"><h5>Öğrenme çıktıları ve süreç bileşenleri</h5>' + u.ciktilar.map(function (c) {
      return '<div class="oc-item"><span class="k">' + esc(c.kod) + "</span>" + esc(c.ad) + (c.bilesenler.length ? "<ul>" + c.bilesenler.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    }).join("") + "</div>" +
    '<div class="prog-sec"><div class="kv"><div>İçerik çerçevesi</div><div>' + esc(u.icerik) + "</div>" +
    (u.genellemeler.length ? "<div>Genellemeler</div><div>" + esc(u.genellemeler.join(" ")) + "</div>" : "") +
    "<div>Anahtar kavramlar</div><div>" + esc(u.anahtar) + "</div>" + (u.semboller ? "<div>Sembol ve gösterimler</div><div>" + esc(u.semboller) + "</div>" : "") +
    "<div>Öğrenme kanıtları</div><div>" + esc(u.kanitlar) + "</div></div></div>" +
    (u.notlar.length ? '<div class="prog-sec"><h5>Uygulamada dikkat</h5><ul class="small">' + u.notlar.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></div>" : "") +
    '<div class="prog-sec"><h5>Öğrenme-öğretme yaşantıları</h5>' +
    '<details class="acc" open><summary>Temel kabuller</summary><div>' + p(m.temel) + "</div></details>" +
    '<details class="acc"><summary>Ön değerlendirme süreci</summary><div>' + p(m.on) + "</div></details>" +
    '<details class="acc"><summary>Köprü kurma</summary><div>' + p(m.kopru) + "</div></details>" +
    '<details class="acc"><summary>Öğrenme-öğretme uygulamaları</summary><div>' + uyg + "</div></details>" +
    '<details class="acc"><summary>Farklılaştırma: zenginleştirme</summary><div>' + p(m.zen) + "</div></details>" +
    '<details class="acc"><summary>Farklılaştırma: destekleme</summary><div>' + p(m.des) + "</div></details></div>" +
    '<p class="hint mt">Not: İYEP kitaplarında farklılaştırma bölümlerine yer verilmemektedir (İYEP 1.2.6).</p>';
}

/* ---------- usul ve esaslar ---------- */
function esaslarCiz() {
  if ($("esasIcerik").innerHTML) return;
  const ul = function (a) { return "<ul>" + a.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; };
  const kart = function (baslik, ic) { return '<div class="card"><div class="card-h"><h3>' + baslik + '</h3></div><div class="prose small">' + ic + "</div></div>"; };
  $("esasIcerik").innerHTML =
    '<div class="alert bilgi"><span>📘</span><span class="t">Bu ekran <b>' + esc(PROGRAM_KAYNAK) + "</b> belgesinin uygulamaya ilişkin bölümlerini özetler. Uygulamadaki tüm denetimler bu esaslara göre yapılır.</span></div>" +
    '<div class="grid g2">' +
    kart("🎯 Temel yaklaşım ve özel amaçlar (1.1)",
      "<p>İYEP; Türkiye Yüzyılı Maarif Modeli (TYMM) İlkokul Türkçe Dersi Öğretim Programı'ndaki temel dil becerileri ve İlkokul Matematik Dersi Öğretim Programı'ndaki temalarda yer alan öğrenme çıktılarını yeterli düzeyde edinemeyen öğrencilerin öğrenme eksikliklerinin giderilmesini, rehberlik hizmetleri ile desteklenmesini amaçlayan bir tedbir programıdır.</p>" +
      "<p>Öğrenme somut deneyimlerle başlamalı, anlamlı öğrenme amaçlanmalı ve öğrenme yaşantısına rehberlik hizmetleri sağlanmalıdır. Program öğrencilerin:</p>" +
      ul(["Temel dinleme ve konuşma becerilerini geliştirmesini,", "İlk okuma yazma konusundaki eksikliklerini gidermesini,", "Okuduğunu anlama düzeyini artırmasını,", "Matematiksel okuryazarlık becerilerini geliştirmesini,",
        "Matematiksel kavramları anlamasını ve günlük hayatta kullanmasını,", "Matematiksel muhakeme, problem çözme ve temsil becerilerini kullanabilmesini,", "Matematiğe yönelik olumlu tutum ve öz güvenli bir yaklaşım geliştirmesini amaçlar."])) +
    kart("👥 Hedef kitle (1.1)",
      "<p>İlkokula devam edip <b>özel eğitime ihtiyaç duymayan</b> öğrencilerden:</p>" +
      ul(["Program kapsamında belirlenen öğrenme çıktılarını yeterli düzeyde edinemeyen öğrenciler,", "Sığınmacı, göçmen, göçer ve yarı göçer ailelerin çocukları,", "Geçici koruma altındaki çocuklar,", "Mevsimlik tarım işçilerinin çocukları gibi dezavantajlı öğrenciler."]) +
      "<p><b>İlkeler:</b></p>" + ul(["İYEP'e ihtiyaç duyan öğrenciler belirlenen eksiklikleri doğrultusunda programa alınır.", "Program, öğrenme çıktılarına ulaşma sürecinde öğretmene esneklik sağlar.", "Program öğrenciyi merkeze alır, bütüncül gelişimi önemser.",
        "Programın öğrencinin öğrenim gördüğü okulda uygulanması esastır.", "Öğrencilerin akranlarından ayrışma hissine kapılmasını önleyici tedbirler alınır.", "Akademik gelişimin yanı sıra bütüncül gelişim rehberlik hizmetleriyle desteklenir.",
        "Öğrenme sürekliliği ve program bütünlüğü korunur.", "Program, fırsat eşitliği gereği <b>herhangi bir ücret talep edilmeksizin</b> tüm hak sahibi öğrencilere açıktır."])) +
    kart("📋 Usul ve esaslar (1.2)", ul([
      "Türkçe temel dil becerileri ile matematik temalarındaki alan ve kavramsal becerilere uygun hazırlanan <b>İYEP Öğrenci Belirleme Aracı (ÖBA)</b> MEB'in belirlediği takvim doğrultusunda uygulanır.",
      "Sonuçlar e-Okul Yönetim Bilgi Sistemi'nde <b>İYEP İşlemleri Modülü</b>'ne işlenir.", "ÖBA ile eksiklikleri tespit edilen öğrenciler program sürecine dâhil edilir.",
      "Okul yönetimi İYEP İşlemleri Modülü'nden öğrenci listelerini alır; <b>İYEP Okul Komisyonu</b> İYEP'e dâhil edilecek öğrenciler hakkında karar verir.",
      "İYEP'in <b>öğrencinin kendi sınıf öğretmeni</b> tarafından uygulanması önceliklidir; görevlendirilemediği durumlarda okul yönetimince görevlendirilen başka bir öğretmen uygular.",
      "Öğrenciler belirlenirken TYMM İlkokul Türkçe ve Matematik Dersi Öğretim Programları (1-4. sınıflar) esas alınır.", "İlk okuma yazma öğretimi TYMM İlkokul Türkçe Dersi Öğretim Programı'ndaki esaslara göre yapılır.",
      "Öğrenciler ihtiyaçlarına göre rehberlik hizmetlerinden faydalanır.",
      "Program süresi, <b>ders saatleri dışında</b>; hafta içi günde <b>2</b>, hafta sonu günde <b>6</b>, haftada toplam <b>10</b> ders saatini geçemez.",
      "Ders saatleri öğrencinin öğrenme ihtiyacı dikkate alınarak programda öngörülen saatlere uygun planlanır.", "<b>İYEP Öğrenci Değerlendirme Aracı (ÖDA)</b> MEB'in belirlediği takvim doğrultusunda uygulanır."])) +
    kart("📏 Ölçme ve değerlendirme (1.3)",
      "<p>Süreç, geliştirici (biçimlendirici) değerlendirme ağırlıklı yürütülür. Amaç öğrenciyi yalnızca değerlendirmek değil; öğrenme sürecini sürekli izlemek, eksikleri belirlemek, zamanında geri bildirim vermek ve öğretimi düzenlemektir.</p>" +
      ul(["Programa alınacak öğrenciler <b>ÖBA</b> ile belirlenir.", "Süreçte gözlem, çalışma kâğıdı, öğrenme günlüğü, kavram haritası, performans görevi gibi öğrenme kanıtları kullanılır; sonuçlar not vermekten çok öğrenmeyi geliştirmek için kullanılır.",
        "Her tema / öğrenme alanı için <b>en az bir performans görevi</b> uygulanır; mümkün olduğunca sınıf ortamında, öğretmen rehberliğinde yapılır.", "Program sonunda ulaşılan düzey <b>ÖDA</b> ile belirlenir.",
        "Değerler, eğilimler, okuryazarlık ve sosyal-duygusal öğrenme becerileri süreçte izlenir ancak <b>notla değerlendirilmez</b>."])) +
    kart("🧩 Dikkat edilecek hususlar (1.2)", ul(["Öğrencilerin önceki öğrenmeleri tespit edilmelidir.", "Öğrenciler etkin öğrenmeyi sağlayacak etkinliklerle desteklenmelidir.", "Öğrenme süreleri bireysel öğrenme hızlarına göre planlanmalıdır.",
      "Öğrencinin düşünme sürecini ortaya koymasına ve güçlendirmesine fırsat verilmelidir.", "Bireysel, sosyal ve kültürel farklılıklar dikkate alınmalıdır.",
      "Rehberlik sürecinde öğretmen, rehber öğretmen, okul yönetimi ve veli arasında iş birliği sağlanmalı; destek doğal, gelişimsel, tamamlayıcı ve kapsayıcı olmalıdır."])) +
    kart("🌱 Farklılaştırma (1.2.6)", "<p>Farklılaştırma iki eksende yapılandırılmıştır:</p>" + ul(["<b>Zenginleştirme:</b> akranlarından daha ileri düzeydeki öğrencilere genişletilmiş ve derinlemesine öğrenme fırsatları.",
      "<b>Destekleme:</b> daha fazla zamana ve tekrara ihtiyaç duyan öğrencilere içerik, süreç, öğrenme ortamı ve ürün boyutlarında uyarlanmış yaşantılar."]) +
      "<p>Öğrenme-öğretme yaşantıları; temel kabuller, ön değerlendirme süreci, köprü kurma ve öğrenme-öğretme uygulamalarından oluşur. İYEP kitaplarında farklılaştırma bölümlerine yer verilmemektedir.</p>") +
    "</div>" +
    '<div class="card"><div class="card-h"><h3>🔄 Önceki uygulamaya göre neler değişti?</h3><span class="sub">Önceki İYEP Yönetim Sistemi ile 2026 programının karşılaştırması</span></div>' +
    '<div class="tw"><table class="t"><thead><tr><th>Konu</th><th>Önceki uygulama</th><th>İYEP 2026 (TYMM)</th></tr></thead><tbody>' +
    [["Yapı", "Türkçe ve matematikte 3'er modül, kazanımlar", "Türkçe 2 öğrenme alanı, matematik 4 tema; öğrenme çıktıları ve süreç bileşenleri"],
      ["Süre", "Türkçe 96 + Matematik 64 = 160 ders saati", "Türkçe 68 + 26 = 94, Matematik 10 + 10 + 12 + 34 = 66 ders saati"],
      ["Hedef kitle", "3. sınıf öğrencileri", "Özel eğitime ihtiyaç duymayan ilkokul öğrencileri; göçmen, geçici koruma, mevsimlik tarım işçisi çocukları gibi dezavantajlı öğrenciler açıkça kapsamda"],
      ["Belirleme", "ÖBA → modül", "ÖBA → e-Okul İYEP İşlemleri Modülü → İYEP Okul Komisyonu kararı"],
      ["Uygulayıcı", "Sıralı öğretmen görevlendirme listesi", "Öncelik öğrencinin kendi sınıf öğretmeni; olmazsa okul yönetimince görevlendirilen öğretmen"],
      ["Değerlendirme", "Modül sonu, ÖDA", "Biçimlendirici değerlendirme, her ÖA / tema için en az bir performans görevi, program sonunda ÖDA"],
      ["Ders saati sınırı", "Hafta içi 2, hafta sonu 6, haftalık 10", "Değişmedi: ders saatleri dışında hafta içi 2, hafta sonu 6, haftalık 10"]]
      .map(function (r) { return "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</tbody></table></div>" +
    '<p class="hint mt">Grup büyüklüğü, veli onay formu ve ilçe kurs oluru 2026 program metninde düzenlenmemiştir; uygulamada okul / ilçe tercihine bağlı, düzenlenebilir ayar ve belgeler olarak sunulur.</p></div>';
}

/* ---------- yedek ---------- */
function yedekCiz() { $("surumLbl").textContent = SURUM; $("kaynakLbl").textContent = PROGRAM_KAYNAK; }
function jsonDisaAktar() {
  const blob = new Blob([JSON.stringify(appData, null, 1)], { type: "application/json" });
  dosyaIndir(blob, "IYEP_Yedek_" + dosyaAdi(appData.settings.okul) + "_" + bugunIso() + ".json");
  bildir("Yedek indirildi.");
}
async function jsonIceAktar(ev) {
  const file = ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  try {
    const d = JSON.parse(await file.text());
    if (eskiFormatMi(d)) {
      if (!confirm("Bu yedek önceki İYEP Yönetim Sistemi'ne (modül yapısı) aittir. Okul bilgileri, komisyonlar ve öğrenci listesi aktarılacak; modül bilgileri aktarılmayacak. Mevcut veriler değiştirilsin mi?")) return;
      appData = eskiVeriDonustur(d);
    } else {
      if (!d.settings || !Array.isArray(d.students)) throw new Error("Tanınmayan yedek dosyası.");
      if (!confirm("Mevcut veriler yedekteki verilerle değiştirilecek. Devam edilsin mi?")) return;
      appData = veriNormalize(d);
    }
    kaydet(true);
    bildir("Yedek yüklendi: " + appData.students.length + " öğrenci, " + appData.groups.length + " grup.");
    yenile();
  } catch (e) { bildir("Yedek okunamadı: " + e.message, "hata"); }
}
function ornekYukle() {
  if (!confirm("Örnek (kurgusal) veriler yüklenecek ve mevcut veriler silinecek. Önce yedek almanız önerilir. Devam edilsin mi?")) return;
  appData = veriNormalize(ornekVeri());
  kaydet(true);
  bildir("Örnek veriler yüklendi.");
  sekmeAc("dashboard");
  yenile();
}
function yeniYil() {
  if (!confirm("Öğrenciler, gruplar, izleme ve ÖDA kayıtları silinecek; okul bilgileri, komisyonlar ve tatiller korunacak. Önce yedek almanız önerilir. Devam edilsin mi?")) return;
  appData.students = [];
  appData.groups = [];
  ["obaTarihi", "odaTarihi", "baslama", "bitis"].forEach(function (k) { appData.settings[k] = ""; });
  appData.settings.evrak = {};
  const y = (appData.settings.yil || "").match(/(\d{4})\D+(\d{4})/);
  if (y) appData.settings.yil = (+y[1] + 1) + "-" + (+y[2] + 1);
  kaydet(true);
  bildir("Yeni eğitim yılı için hazır.");
  sekmeAc("settings");
  yenile();
}
function hepsiniSil() {
  if (!confirm("TÜM veriler silinecek. Bu işlem geri alınamaz. Devam edilsin mi?")) return;
  appData = veriNormalize(bosVeri());
  appData.ui.eskiSoruldu = true;
  kaydet(true);
  bildir("Tüm veriler silindi.");
  sekmeAc("settings");
  yenile();
}

/* ---------- Excel çıktıları ---------- */
function ogrenciExcel() {
  const bas = SABLON_BASLIK.concat(["Türkçe Saat", "Matematik Saat", "Gruplar", "Veli Onayı", "ÖDA Türkçe", "ÖDA Matematik"]);
  const satirlar = [bas.map(function (b) { return { v: b, s: 1 }; })];
  appData.students.slice().sort(function (a, b) { return siralaTr(a.sinif, b.sinif) || siralaTr(a.no, b.no); }).forEach(function (st) {
    const hedef = (st.hedef || []).map(function (k) { return ({ yetersiz: "Öğrenme çıktısı yetersiz", gocmen: "Göçmen-sığınmacı", gecici: "Geçici koruma", mevsimlik: "Mevsimlik tarım", dezavantajli: "Dezavantajlı" })[k]; }).join(", ");
    satirlar.push([{ v: st.no, s: 9 }, { v: st.ad, s: 2 }, { v: st.sinif, s: 3 }, { v: st.ogretmen, s: 2 }, { v: dersUnits(st.units, "TR").join(" "), s: 3 }, { v: dersUnits(st.units, "MAT").join(" "), s: 3 },
      { v: hedef, s: 2 }, { v: st.ozel ? "Var" : "Yok", s: 3 }, { v: { dahil: "Dâhil", aday: "Aday", dahil_degil: "Dâhil Değil", ayrildi: "Ayrıldı" }[st.durum], s: 3 }, { v: st.gerekce, s: 2 },
      { v: unitSaatToplam(dersUnits(st.units, "TR")), s: 3 }, { v: unitSaatToplam(dersUnits(st.units, "MAT")), s: 3 },
      { v: ogrenciGruplari(st).map(function (g) { return g.ad; }).join(", "), s: 2 }, { v: { onay: "Onay verdi", ret: "Onay vermedi" }[st.veli] || "", s: 3 },
      { v: ODA_DURUM[st.oda.TR] && st.oda.TR ? ODA_DURUM[st.oda.TR].ad : "", s: 2 }, { v: ODA_DURUM[st.oda.MAT] && st.oda.MAT ? ODA_DURUM[st.oda.MAT].ad : "", s: 2 }]);
  });
  dosyaIndir(xlsxOlustur([{ ad: "Ogrenciler", satirlar: satirlar, genislik: [10, 26, 8, 22, 12, 14, 22, 10, 12, 30, 9, 11, 18, 13, 22, 22], dondur: 1, yukseklik: { 1: 32 } }]),
    "IYEP_Ogrenciler_" + dosyaAdi(appData.settings.okul) + ".xlsx");
  bildir("Öğrenci listesi Excel olarak indirildi (yeniden içe aktarılabilir).");
}
function izlemeExcel() {
  if (!appData.groups.length) { bildir("Grup yok.", "hata"); return; }
  const sayfalar = appData.groups.map(function (g) {
    const ocs = [];
    siraliUnits(g.units).forEach(function (u) { UNIT[u].ciktilar.forEach(function (c) { ocs.push(c.kod); }); });
    const satirlar = [[{ v: g.ad + " – " + DERSLER[g.ders].uzun + " – Öğrenme Çıktıları İzleme (G: Gelişiyor, E: Edindi)", s: 5 }],
      ["No", "Adı Soyadı"].concat(ocs).concat(siraliUnits(g.units).map(function (u) { return UNIT[u].kisa + " PG"; })).map(function (b) { return { v: b, s: 1 }; })];
    grupOgrencileri(g).forEach(function (st) {
      satirlar.push([{ v: st.no, s: 9 }, { v: st.ad, s: 2 }].concat(ocs.map(function (k) { return { v: st.izleme[k] || "", s: 3 }; }))
        .concat(siraliUnits(g.units).map(function (u) { return { v: (st.pg[u] && st.pg[u].puan) || "", s: 3 }; })));
    });
    return { ad: dosyaAdi(g.ad).slice(0, 28), satirlar: satirlar, genislik: [8, 24].concat(ocs.map(function () { return 10; })), dondur: 2, yukseklik: { 2: 30 } };
  });
  dosyaIndir(xlsxOlustur(sayfalar), "IYEP_Izleme_" + dosyaAdi(appData.settings.okul) + ".xlsx");
  bildir("İzleme çizelgesi Excel olarak indirildi.");
}
function planExcel() {
  const g = grup($("takvimGrup").value);
  if (!g) { bildir("Grup seçiniz.", "hata"); return; }
  const p = grupPlanCache(g);
  const satirlar = [[{ v: appData.settings.okul + " – " + g.ad + " (" + DERSLER[g.ders].uzun + ") Yıllık Uygulama Planı", s: 5 }],
    ["Hafta", "Tarih", "Ders Günleri", "Öğrenme Alanı / Tema", "Öğrenme Çıktıları", "Ders Saati", "Kümülatif", "Açıklama"].map(function (b) { return { v: b, s: 1 }; })];
  p.haftalar.forEach(function (h) {
    satirlar.push([{ v: h.no, s: 3 }, { v: trTarih(h.oturumlar[0].tarih) + (h.oturumlar.length > 1 ? " – " + trTarih(h.oturumlar[h.oturumlar.length - 1].tarih) : ""), s: 3 },
      { v: h.oturumlar.map(function (o) { return GUN_KISA[o.gun] + " " + o.saatler.length; }).join(", "), s: 2 }, { v: h.units.map(function (u) { return UNIT[u].baslik + " " + UNIT[u].ad; }).join(", "), s: 2 },
      { v: haftaOcEtiket(h), s: 2 }, { v: h.saatler.length, s: 3 }, { v: h.kumulatif, s: 3 }, { v: haftaNot(g, h), s: 2 }]);
  });
  dosyaIndir(xlsxOlustur([{ ad: "Plan", satirlar: satirlar, genislik: [7, 24, 16, 34, 36, 9, 10, 40], dondur: 2, yatay: true, sigdir: true }]), "IYEP_Plan_" + dosyaAdi(g.ad) + ".xlsx");
  bildir("Plan Excel olarak indirildi.");
}
