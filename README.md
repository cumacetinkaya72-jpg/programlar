# programlar
yaptığım programlar


## Nöbet Dağıtım Programı (`nobet_dagitim.html`)

MEB okulları için öğretmen ve idareci nöbet çizelgesi hazırlayan, **tek dosyalık ve internetsiz çalışan** bir web programı.
Dosyayı tarayıcıda (Chrome, Edge, Firefox) açmanız yeterlidir; veriler tarayıcıda saklanır, JSON olarak yedeklenebilir.

Özellikler: otomatik adil dağıtım (mutlak/oransal eşitlik, zorluk dereceli nöbet yerleri, sıralı/rastgele yer rotasyonu),
ikili eğitim, okul öncesi ve özel eğitim grupları, izin/rapor, sabit nöbet günleri, kilitli hücreler, MEB tatil takvimi,
istatistikler, A4 resmî çıktı, tebliğ-tebellüğ listesi ve Excel (.xlsx) dışa aktarımı.

### Son güncellemede düzeltilen hatalar
- Okul öncesi / özel eğitim öğretmenleri kendi sınıflarında her gün nöbet tuttuğu hâlde her dağıtımda yanlış
  "fazladan nöbet" uyarısı (örnek veride 51 adet) veriliyordu.
- "Örnek Veri" düğmesi, onay sormadan tüm kayıtlı verileri siliyordu.
- "Tüm Sistemi Sıfırla" sonrası sayfa yenilenince örnek veriler geri geliyordu.
- Bir nöbet yeri silinince, "müsait yerleri" yalnızca o yer olan öğretmen hiçbir nöbete atanamıyordu (başvurular artık temizleniyor).
- Excel ve yer günü etiketlerinde "Pazartesi" kısaltması "Paz" (Pazar) olarak yazılıyordu → "Pzt".
- İdarecinin "Aylık Maksimum Nöbet" sınırı birden çok ayı kapsayan dönemde ay bazında değil, tüm dönem için sayılıyordu.
- İmza bloğundaki yıl "2026" olarak sabitti; artık çizelge döneminin yılı yazılıyor.
- Uyarılarda tarih yalnızca gün numarasıyla yazılıyordu (çok aylı dönemde belirsiz) → tam tarih.
- Yapısal kısıt analizi ikili eğitimde sabahçı/öğlenci ayrımı yapmadığı için sıkışık devreyi "esnek" gösteriyordu.
- Excel'de sayılar metin olarak yazılıyordu (toplama/sıralama çalışmıyordu); sütun genişlikleri eklendi,
  indirme bağlantısı erken iptal edilebiliyordu; dosya adlarındaki Türkçe karakterler bozuluyordu.
- Yıl kutusu boşaltılınca geçersiz tarih oluşuyordu; bazı tablo başlıkları geçersiz HTML'di; iki CSS sınıfı tanımsızdı.

### Tasarım
- Yeni ekran tasarım katmanı (degrade başlık, sekme göstergesi, kartlar, form odak halkaları, zebra tablolar).
- Çizelgede **boş kalan nöbet hücreleri kırmızı kesikli çerçeveyle** işaretlenir, bugünün sütunu vurgulanır.
- Engelleyici `alert` pencereleri yerine bildirimler; dağıtım raporu kaydırılabilir ve kopyalanabilir pencerede.
- Düzenle'ye basınca form öne kayar ve "Düzenleniyor: …" etiketiyle vurgulanır.
- Telefon ekranında yatay kaydırma olmadan kullanılabilir.
- Resmî A4 yazdırma çıktısı değişmedi (tasarım yalnızca ekran görünümüne uygulanır).
