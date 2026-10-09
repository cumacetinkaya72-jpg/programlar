# Görevlendirme Süresi Takip

Görevlendirme listesini (Excel) yükleyip her kişinin görevlendirme bitiş tarihini ve kalan gününü gösteren tek dosyalık HTML programı.

## Kullanım

1. `index.html` dosyasını tarayıcıda açın (çift tıklamak yeterli; Excel okuma kütüphanesi için internet gerekir).
2. Excel dosyasını sürükleyip bırakın veya tıklayıp seçin. Tüm sayfalar okunur, aynı kişi iki sayfada varsa bir kez gösterilir.
3. Bitişine **10 gün veya daha az** kalanlar ve süresi dolanlar sayfanın üstünde **kırmızı uyarı** ile listelenir, tabloda kırmızı satır olarak görünür.

Liste tarayıcıda saklanır; sayfayı tekrar açtığınızda kalan günler o günün tarihine göre yeniden hesaplanır. Dosya hiçbir yere gönderilmez.

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
