# Dinamik Takvim 2026-2027

`Dinamik_Takvim_2026-2027.xlsx` dosyasının tarayıcıda çalışan HTML sürümü. Kurulum gerektirmez:
**`index.html` dosyasını çift tıklayıp açmanız yeterli** (internet bağlantısı da gerekmez).

## Sekmeler

**Pano**
- Kartlar: **Devam edenler**, **Günlük işler** (bugün yapılan / toplam), **Tamamlananlar**,
  **Cevap verilemeyenler**, **Ertelenenler**, **Cevap verilenler**. Karta tıklayınca o listedeki işler açılır.
- Her işin durumu açılır listeden değiştirilebilir: Devam ediyor (DE), Ertelendi (ER), Cevap verilemedi (CVM),
  Cevap verildi (CV), Tamamlandı (T).

**İş Programı** (Excel'deki "İŞ PROGRAMI" sayfası)
- Başlangıç tarihi + sayfa numarası ile kayan Gantt görünümü (Excel'deki `BAŞLANGIÇ` / `SAYFA` hücreleri gibi); 1, 2, 5 veya 10 haftalık görünüm.
- Excel'deki koşullu biçimlendirmeler: tamamlanan (T/CV/DY) gri, 5 gün içinde bitecek pembe, bugün yeşil, DE sarı, BGVH kırmızı vb.
- Açık işler sırasıyla: **Devam edenler (DE)** tarih sırasına göre en üstte, altında **Bu hafta yapılacaklar**,
  sonra **Süresi geçmiş, tamamlanmamış** işler ve en altta dönemdeki diğer işler.
- Kutu ile "tamamlandı" işaretlenen iş listeden çıkar ve tamamlanma tarihiyle **Tamamlananlar** listesine geçer
  (oradan kutuyu kaldırarak geri alınabilir).
- Tüm listeler **başlangıç tarihine** göre sıralanır (Hft sütununda yıl da yazar; 2026'da başlayıp 2027'de biten işler karışmaz).
- **Rutin işler:** Yeni iş eklerken ve düzenlerken Tekrar seçilebilir (tek seferlik, günlük, haftalık, aylık, yıllık).
  *Günlük rutin* Günlük İş Programı'na eklenir; *haftalık / aylık / yıllık rutin* seçilen son tarihe kadar
  (varsayılan: eğitim yılı sonu 30 Haziran, yıllıkta 5 yıl) otomatik kayıtlar oluşturur. Düzenlerken tekrar türü
  değiştirilirse sonraki kayıtlar yeniden oluşturulur; "Tek seferlik" seçilirse kayıt seriden ayrılır.
  Rutin bir kaydı düzenlerken değişiklikler sonraki kayıtlara da uygulanabilir; "Seriyi sil" ile bu ve sonraki kayıtlar silinir.
- Özet kartları ile filtreleme, arama; göreve tıklayınca düzenleme / silme / kopyalama; yeni iş ekleme.

**Günlük İş Programı** (Excel'deki "GÜNLÜK İŞ PROGRAMI" sayfası)
- Bugünün kontrol listesi ve ilerleme çubuğu.
- Günlük işler × günler tablosu: hücreye tıklayarak işaretleme, iş bazında tamamlanma yüzdesi, gün bazında toplam.
- Günlük iş ekleme, düzenleme, sıralama, silme.

**Açıklamalar & Veri**
- Yedek alma / yedekten yükleme (.json), iş programını Excel'de açılabilen .csv olarak dışa aktarma.
- Kod kısaltmalarına (Aİ, Hİ, DE, BGVH…) açıklama yazma.

Değişiklikler tarayıcının yerel depolamasında saklanır; başka bir bilgisayara taşımak için yedek alıp diğer bilgisayarda yükleyin.

## Excel güncellenirse

```sh
pip install openpyxl
python3 tools/excel_to_html.py Dinamik_Takvim_2026-2027.xlsx   # index.html yeniden üretilir
```

Sayfa tasarımı `src/takvim.template.html` içindedir; betik Excel verisini bu şablona gömer.

## Kodlar

| Süre kodu 1 | | Süre kodu 2 | | Süre kodu 3 | | Durum | |
|---|---|---|---|---|---|---|---|
| DY | Ders yılı başında | AB | Ay başında | Aİ | Ay içerisinde | A | Acil |
| DYB | Ders yılı boyunca | Aİ | Ay içerisinde | Aİ/Gİ | Ay/gün içerisinde | BE | Bekliyor |
| DYİ | Ders yılı içerisinde | AS | Ay sonunda | Aİ/Hİ | Ay/hafta içerisinde | BY | Başvuru yapıldı |
| DYS | Ders yılı sonunda | A1H | Ayın birinci haftası | BGVH | Belirli gün ve hafta | BYM | Başvuru yapılmadı |
| TB | Takvime bağlı | A2H | Ayın ikinci haftası | Gİ | Gün içerisinde | CV | Cevap verildi |
| YBA | Yıl başında | A3H | Ayın üçüncü haftası | HB | Hafta başında | CVM | Cevap verilemedi |
| YBO | Yıl boyunca | A4H | Ayın dördüncü haftası | Hİ | Hafta içerisinde | DE | Devam ediyor |
| Yİ | Yıl içerisinde | A5H | Ayın beşinci haftası | Hİ/Gİ | Hafta/gün içerisinde | E | Ertelendi |
| YS | Yıl sonunda | | | HS | Hafta sonunda | İ | İptal edildi |
| | | | | | | S | Sürekli/süresiz |
| | | | | | | SD | Süresi doldu |
| | | | | | | T | Tamamlandı |
