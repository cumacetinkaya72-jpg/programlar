# İYEP Yönetim Sistemi (TYMM 2026)

İlkokullarda Yetiştirme Programı (İYEP) için okul yönetimi aracı. MEB'in **Türkiye Yüzyılı
Maarif Modeli'ne göre hazırlanan 2026 İYEP programına** göre baştan yazıldı. Önceki sürüm,
2022 yönergesindeki modül yapısını (Türkçe 3 modül, Matematik 3 modül) kullanıyordu.

**Kullanım:** [`iyep_yonetim_sistemi.html`](iyep_yonetim_sistemi.html) dosyasını indirip
tarayıcıda (Chrome, Edge, Firefox) açın. Kurulum ve internet gerekmez. Veriler yalnızca o
tarayıcıda saklanır, hiçbir sunucuya gönderilmez.

## 2026 programına göre yapı

| Ders | Öğrenme alanı / tema | Öğrenme çıktısı | Ders saati |
|---|---|---:|---:|
| Türkçe | 1. Öğrenme Alanı: İYEP 2. Sınıf Türkçe (ilk okuma yazma) | 8 | 68 |
| Türkçe | 2. Öğrenme Alanı: İYEP 3. Sınıf Türkçe (okuduğunu / dinlediğini anlama) | 12 | 26 |
| Matematik | 1. Tema: Sayılar ve Nicelikler-1 | 3 | 10 |
| Matematik | 2. Tema: İşlemlerden Cebirsel Düşünmeye-1 | 3 | 10 |
| Matematik | 3. Tema: Sayılar ve Nicelikler-2 | 3 | 12 |
| Matematik | 4. Tema: İşlemlerden Cebirsel Düşünmeye-2 | 3 | 34 |

Program 32 öğrenme çıktısının tamamını süreç bileşenleriyle birlikte içerir. Her öğrenme
alanı / tema için temel kabuller, ön değerlendirme, köprü kurma, öğrenme-öğretme uygulamaları
ile zenginleştirme ve destekleme metinleri de programdaki haliyle yer alır.

## Neler yapılabilir?

- **Öğrenciler ve ÖBA:** ÖBA ile eksikliği belirlenen öğrenme alanı / temalar, hedef kitle
  (öğrenme çıktısı yetersiz, göçmen, geçici koruma, mevsimlik tarım vb.) ve İYEP Okul Komisyonu
  kararı girilir. Özel eğitim ihtiyacı olan öğrenci programa dâhil edilmez.
- **Toplu aktarım:** Excel şablonu (`.xlsx`) ya da e-Okul / Excel listesinden kopyala-yapıştır.
  Kodlar: `T1 T2`, `T1+`, `M2-M4`, `M3+`.
- **Gruplar ve ders saatleri:** Hafta içi günde 2, hafta sonu günde 6, haftada 10 ders saati
  sınırı hem grup bazında hem de öğrencinin katıldığı tüm grupların toplamında denetlenir.
  Otomatik gruplama yapılabilir. Öğrencinin kendi sınıf öğretmeninin önceliği izlenir.
- **Uygulama takvimi:** Grubun öğrenme alanı / temaları, haftalık ders dağılımına göre
  tatiller atlanarak haftalara yerleştirilir. Tahmini bitiş tarihi hesaplanır.
- **İzleme ve değerlendirme:** Öğrenme çıktısı izleme matrisi (Gelişiyor / Edindi), her öğrenme
  alanı / tema için performans görevi (analitik veya bütüncül DPA), öğretmen yansıtmaları ve
  program sonu ÖDA sonuçları.
- **Belgeler (19 adet):**
  - Komisyon belgeleri: planlama toplantısı, ÖBA sonrası karar, ara değerlendirme ve program
    sonu tutanakları (metinleri düzenlenebilir).
  - Resmî yazışmalar: ilçe MEM kurs oluru (Excel çıktısı ve EBYS alanlarıyla), grup listesi,
    görevlendirme yazısı, dilekçe, veli bilgilendirme ve onay formu.
  - Uygulama belgeleri: yıllık uygulama planı, ders defteri, aylık yoklama.
  - İzleme belgeleri: öğrenme çıktıları izleme formu, performans görevi ve DPA, rehberlik ve
    öğretmen yansıtma formları.
  - Raporlar: ÖDA sonuç çizelgesi, istatistik formu, program sonu raporu.

  Belgeler yazdırılabilir, PDF olarak kaydedilebilir ve biçimiyle panoya kopyalanabilir
  (EBYS / Word).
- **Yedek:** JSON yedek alma ve yükleme. Excel çıktıları: öğrenci listesi (yeniden içe
  aktarılabilir), kurs oluru, izleme çizelgesi, plan.

## Önceki sürümden geçiş

Eski programı kullandığınız tarayıcıda yeni dosyayı açarsanız gösterge panelinde
**"Önceki İYEP Yönetim Sistemi verisi bulundu"** uyarısı çıkar. Eski JSON yedeğinizi
*Yedek & Excel* ekranından da yükleyebilirsiniz. Okul bilgileri, komisyonlar ve öğrenci listesi
aktarılır. Eski modül bilgileri yeni programda karşılığı olmadığı için aktarılmaz; öğrencilerin
öğrenme alanı / temalarını yeni ÖBA sonucuna göre seçin.

## Programda düzenlenmeyen konular

2026 program metni grup büyüklüğü, veli onay formu ve ilçe kurs oluru konusunda hüküm
içermez. Bunlar okul / ilçe uygulamasına göre ayarlanabilen seçenek ve belgeler olarak
sunulur. Grup büyüklüğü varsayılan olarak önerilen 6, uyarı sınırı 10'dur ve *Okul & Komisyon*
ekranından değiştirilebilir.

## Geliştirme

Kaynaklar `src/` altındadır. Tek dosyalık sürüm derleme betiğiyle üretilir:

```sh
node tools/build.mjs            # iyep_yonetim_sistemi.html dosyasını üretir
node tools/build.mjs --check    # çıktı güncel mi? (CI)
NODE_PATH="$(npm root -g)" node tests/smoke.cjs   # Playwright + Chromium duman testleri
```

| Dosya | İçerik |
|---|---|
| `src/js/01-program.js` | Öğrenme çıktıları, süreç bileşenleri, saatler, kurallar |
| `src/js/02-program-metin.js` | Öğrenme-öğretme yaşantıları metinleri (PDF'ten çıkarıldı) |
| `src/js/03-core.js` | Veri modeli, saklama, takvim motoru, uyum denetimi |
| `src/js/04-xlsx.js` | Kütüphanesiz `.xlsx` okuma / yazma |
| `src/js/05-ui.js` | Gösterge paneli, ayarlar, öğrenciler, toplu aktarım, gruplar |
| `src/js/06-takvim-izleme.js` | Takvim, izleme, öğretim programı, usul ve esaslar, yedek |
| `src/js/07-belgeler.js` | Tüm belgeler, kurs oluru Excel'i, EBYS kopyalama, yazdırma |

Dayanak: T.C. Millî Eğitim Bakanlığı, *İlkokullarda Yetiştirme Programı (İYEP) – Türkiye
Yüzyılı Maarif Modeli*, 2026. Örnek verilerdeki kişi ve okul adları kurgusaldır.
