# e-Okul Devamsızlık Analizi

e-Okul **Günlük Devamsızlık Girişi → Raporlar → IOK08002** (Öğrenci Devamsızlıkları – Detaylı)
PDF raporunu okuyup devamsızlıkları sınıf sınıf analiz eden tek dosyalık web uygulaması.

## Kullanım

1. e-Okul'dan IOK08002 raporunu PDF olarak indirin (tüm şubeler tek PDF'te olabilir).
2. `index.html` dosyasını tarayıcıda açın (Chrome, Edge, Firefox).
3. PDF'i sayfaya sürükleyin veya **PDF seç** ile yükleyin. Birden çok PDF aynı anda yüklenebilir;
   aynı öğrenci + tarih + tür kaydı bir kez sayılır.

PDF yalnızca tarayıcınızda okunur, hiçbir yere gönderilmez. PDF okuyucu (pdf.js) internetten
yüklendiği için ilk açılışta internet bağlantısı gerekir.

## Neler gösterir

- **Özet:** devamsız öğrenci sayısı, toplam devamsızlık günü, sınırı aşan ve uyarı düzeyindeki öğrenciler.
- **Sınırı aşan / dikkat gereken öğrenciler:** özürsüz ve toplam devamsızlık sınırını aşanlar,
  veli bildirimi eşiğine gelenler ve art arda uzun süre gelmeyenler (sürüyorsa ayrıca belirtilir).
- **Günlük / Haftalık / Aylık** tablo ve grafik; sınıf sütunlarıyla.
- **Öğrenci listesi:** öğrenci × gün/hafta/ay tablosu. İsme tıklayınca takvim ve tüm kayıtlar açılır.
- **Sınıf karşılaştırması** ve **en çok devamsız olanlar** sıralaması.
- Filtreler: sınıf/şube, tarih aralığı, devamsızlık türü, öğrenci adı/numarası.
- Her tablo **Tabloyu kopyala** ile Excel'e yapıştırılabilir.

## Sınırlar

**Devamsızlık sınırları** bölümünden değiştirilebilir (tarayıcıda saklanır). Varsayılanlar:
özürsüz 10 gün, toplam 30 gün, veli bildirimi 5 gün özürsüz, art arda 5 iş günü.
Okulunuzun bağlı olduğu yönetmeliğin güncel değerlerini kontrol edip gerekirse düzenleyin.

Türü sütunundaki **D** kodu özürsüz sayılır; diğer kodlar (Ö, R, S, İ…) yalnızca toplama eklenir.
Hangi kodların özürsüz sayılacağı ayarlardan değiştirilebilir. Art arda gün hesabı hafta sonlarını
atlar, resmî tatilleri bilmez.
