# Görevlendirme Süresi Takip

Görevlendirme listesini (Excel) yükleyip her kişinin görevlendirme bitiş tarihini ve kalan gününü gösteren tek dosyalık HTML programı.

## Kullanım

1. `index.html` dosyasını tarayıcıda açın (çift tıklamak yeterli; Excel okuma kütüphanesi için internet gerekir).
2. Excel dosyasını sürükleyip bırakın veya tıklayıp seçin. Tüm sayfalar okunur, aynı kişi iki sayfada varsa bir kez gösterilir.
3. Bitişine **10 gün veya daha az** kalanlar ve süresi dolanlar sayfanın üstünde **kırmızı uyarı** ile listelenir, tabloda kırmızı satır olarak görünür.

Kalan günler sayfa her açıldığında o günün tarihine göre yeniden hesaplanır. Veriler hiçbir yere gönderilmez.

## Elle öğretmen ekleme

**+ Öğretmen ekle** ile listeye kişi eklenir (Ad, Soyad, Görev, Başlama tarihi zorunlu; T.C., Branş, Kurum isteğe bağlı).
Süre alanı boş bırakılırsa görev adına göre otomatik belirlenir; özel bir süre (ör. 12 ay) de yazılabilir.
Her satırdaki **Düzenle / Sil** düğmeleriyle Excel'den gelen kayıtlar da değiştirilebilir.
Yeni bir Excel yüklendiğinde önceki Excel kayıtlarının yerini yeni liste alır; elle eklenenler korunur.

## Otomatik kayıt (elektrik kesintisine karşı)

Her değişiklik (Excel yükleme, ekleme, düzenleme, silme, ayar) anında otomatik kaydedilir:

1. Tarayıcının kalıcı hafızasına (localStorage)
2. Ayrıca IndexedDB'ye (diske hemen yazılan ikinci kopya); açılışta hangisi daha yeniyse o kullanılır
3. İsteğe bağlı: **Kayıt dosyası oluştur** ile bilgisayarda seçilen bir `.json` dosyasına (Chrome / Edge). Sonraki açılışlarda bu dosyaya otomatik bağlanır; tarayıcı izin isterse **Kayıt dosyasına yeniden bağlan** düğmesine basmak yeterlidir.

**Yedek indir / Yedekten geri yükle** ile elle yedek alınabilir (başka bilgisayara taşımak için de kullanılır).
Not: Tarayıcı geçmişi/site verileri temizlenirse 1. ve 2. kopya silinir; bu yüzden kayıt dosyası veya düzenli yedek önerilir.

## Süre kuralları (varsayılan)

| Görev adında geçen | Süre |
|---|---|
| Müdür Yardımcısı | 6 ay |
| Şube Müdürü | 6 ay |
| MEBBİS (İlçe Yöneticisi / Koordinatör) | 6 ay |
| Koordinatör | 6 ay |
| Müdür (Müdür Yetkili Öğretmen dahil) | 6 ay |
| Diğer görevler | takip edilmez ("Süre tanımsız") |

Bitiş tarihi = Başlama tarihi + 6 ay − 1 gün. Kurallar, uyarı gün sayısı (10) ve diğer görevlerin süresi sayfadaki **Ayarlar** bölümünden değiştirilebilir.

## Beklenen Excel sütunları

`T.C. Kimlik No`, `Adı`, `Soyadı`, `Başlama Tarih`, `Görev`, `Branş`, `Görevlendirildiği Kurum` — başlık satırı ilk 30 satır içinde otomatik bulunur.
