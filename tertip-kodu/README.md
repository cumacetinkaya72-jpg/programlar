# Tertip Kodu Sorgula

Tek dosyalık (`index.html`) ekonomik kod (tertip) sorgulama programı. Kurulum gerektirmez; dosyayı tarayıcıda açmanız yeterli, internet bağlantısı gerekmez.

## Özellikler

- 4 düzeyli ekonomik sınıflandırmadaki **1.979 kodun tamamı** (9 / 60 / 264 / 1.646)
- Kod veya açıklamayla arama (Türkçe karakter duyarsız: `kirtasiye` = `kırtasiye`)
- Eski biçimli (`03.2.1.01`) ve noktasız (`03021001`) kod girişi otomatik olarak yeni biçime (`03.02.10.01`) çevrilir
- Birbirine bağlı 1.–4. düzey filtreleri
- Her sonuçta üst düzeylerin zinciri; tıklayınca o düzeye gider
- Koda tıklayınca panoya kopyalanır
- Açık / koyu tema, mobil uyumlu

## Açıklamalar hakkında

Kod listesinin tamamı programın içindedir. Yerleşik açıklamalar 1. ve 2. düzeyin büyük kısmını ve okullarda en çok kullanılan **03 Mal ve Hizmet Alım Giderleri** grubunun temel kodlarını kapsar. Açıklaması olmayan kodlar “Açıklama girilmemiş” olarak görünür.

Eksik açıklamaları tamamlamak için **📥 Açıklama yükle / dışa aktar** bölümünü kullanın:

- Excel'den *Kod | Açıklama* sütunlarını kopyalayıp yapıştırın, ya da `.csv` / `.txt` / `.json` dosyası seçin
- Ayırıcı sekme, `;` veya `,` olabilir; eski biçimli kodlar dönüştürülür
- Yüklenen açıklamalar tarayıcıda saklanır ve yerleşik olanların yerine geçer
- **CSV olarak indir** ile tüm liste (kod, düzey, açıklama) dışa aktarılabilir
