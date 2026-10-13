# Dinamik Takvim 2026-2027

`Dinamik_Takvim_2026-2027.xlsx` dosyasının tarayıcıda çalışan HTML sürümü. Kurulum gerektirmez:
**`index.html` dosyasını çift tıklayıp açmanız yeterli** (internet bağlantısı da gerekmez).

## Sekmeler

**İş Programı** (Excel'deki "İŞ PROGRAMI" sayfası)
- Başlangıç tarihi + sayfa numarası ile kayan Gantt görünümü (Excel'deki `BAŞLANGIÇ` / `SAYFA` hücreleri gibi); 1, 2, 5 veya 10 haftalık görünüm.
- Excel'deki koşullu biçimlendirmeler: tamamlanan (T/CV/DY) gri, 5 gün içinde bitecek pembe, bugün yeşil, DE sarı, BGVH kırmızı vb.
- Özet kartları ile filtreleme: açık, bugün süren, 5 gün içinde bitecek, süresi geçmiş, tamamlanan.
- Arama, sıralama, satırdaki kutu ile "tamamlandı" işaretleme; göreve tıklayınca düzenleme / silme / kopyalama; yeni iş ekleme.

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
