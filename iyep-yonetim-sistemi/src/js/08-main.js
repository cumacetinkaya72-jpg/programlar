/* ==========================================================================
   BAŞLATMA
   ========================================================================== */

function baslat() {
  temaUygula();
  const kaynak = veriYukle();
  docNavCiz();
  ayarBagla();
  // gezinme: data-tab, data-go, data-doc
  document.addEventListener("click", function (e) {
    const t = e.target.closest("[data-tab],[data-go],[data-doc]");
    if (!t) return;
    if (t.hasAttribute("data-doc")) { belgeAc(t.getAttribute("data-doc")); return; }
    const hedef = t.getAttribute("data-tab") || t.getAttribute("data-go");
    if (hedef) sekmeAc(hedef);
  });
  // öğrenci listesi filtreleri ve toplu seçim
  ["stAra", "stFiltreDurum", "stFiltreDers"].forEach(function (id) { $(id).addEventListener(id === "stAra" ? "input" : "change", ogrenciListeCiz); });
  $("stHepsi").addEventListener("change", function () { const v = this.checked; document.querySelectorAll(".stSec").forEach(function (c) { c.checked = v; }); });
  $("atamaGrup").addEventListener("change", atamaCiz);
  window.addEventListener("beforeprint", function () {
    const b = BELGE[appData.ui.doc];
    if (appData.ui.tab === "docs" && b) {
      sayfaStili(b.yatay);
      if (appData.ui.doc === "olur") olurSigdir();
    }
  });
  window.addEventListener("resize", function () { if (appData.ui.tab === "docs" && appData.ui.doc === "olur") olurSigdir(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { modalKapat(); menuKapat(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); kaydet(); }
  });
  sekmeAc(appData.ui.tab || "dashboard");
  yenile(false);
  if (kaynak === "ornek" && !eskiVeriVarMi()) bildir("Örnek (kurgusal) veriler yüklendi. Kendi verileriniz için Yedek & Excel › Yeni başlangıç bölümünü kullanın.");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat);
else baslat();
