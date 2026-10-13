// Kaynak dosyaları (src/) tek, çevrimdışı çalışan bir HTML dosyasında birleştirir.
// Kullanım: node tools/build.mjs           → iyep_yonetim_sistemi.html üretir
//           node tools/build.mjs --check   → çıktı güncel değilse hata verir (CI)
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(kok, "src");
const cikti = join(kok, "iyep_yonetim_sistemi.html");

const sablon = readFileSync(join(src, "index.html"), "utf8");
const css = readFileSync(join(src, "style.css"), "utf8");
const js = readdirSync(join(src, "js"))
  .filter((f) => f.endsWith(".js"))
  .sort()
  .map((f) => `/* ---- ${f} ---- */\n` + readFileSync(join(src, "js", f), "utf8"))
  .join("\n");

if (!sablon.includes("/*@@STYLE@@*/") || !sablon.includes("/*@@SCRIPT@@*/")) {
  console.error("index.html şablonunda yer tutucular bulunamadı.");
  process.exit(1);
}
if (js.includes("</script")) {
  console.error("JavaScript kaynağında '</script' dizisi var; tek dosyada betiği bozar.");
  process.exit(1);
}
const html = sablon.replace("/*@@STYLE@@*/", () => css).replace("/*@@SCRIPT@@*/", () => '"use strict";\n' + js);

if (process.argv.includes("--check")) {
  const mevcut = existsSync(cikti) ? readFileSync(cikti, "utf8") : "";
  if (mevcut !== html) {
    console.error("iyep_yonetim_sistemi.html güncel değil. 'node tools/build.mjs' çalıştırıp sonucu commit edin.");
    process.exit(1);
  }
  console.log("Derleme çıktısı güncel.");
} else {
  writeFileSync(cikti, html);
  console.log(`Oluşturuldu: ${cikti} (${(html.length / 1024).toFixed(0)} KB)`);
}
