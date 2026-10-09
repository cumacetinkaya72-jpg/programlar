# e-Okul Devamsızlık Analizi

e-Okul **Günlük Devamsızlık Girişi → Raporlar → IOK08002** (Öğrenci Devamsızlıkları – Detaylı)
PDF raporunu okuyup devamsızlıkları sınıf sınıf analiz eden tek dosyalık web uygulaması.

## Kullanım

1. e-Okul'dan IOK08002 raporunu PDF olarak indirin (tüm şubeler tek PDF'te olabilir).
2. **`devamsizlik-analizi.html`** dosyasını bilgisayarınıza indirip çift tıklayarak tarayıcıda açın
   (Chrome, Edge, Firefox). Tek dosyadır, internet bağlantısı gerektirmez; USB bellekle taşınabilir.
3. PDF'i sayfaya sürükleyin veya **PDF seç** ile yükleyin. Birden çok PDF aynı anda yüklenebilir;
   aynı kayıt bir kez sayılır.

PDF yalnızca tarayıcınızda okunur, hiçbir yere gönderilmez.

**Veriler saklanır:** yüklenen devamsızlık kayıtları o bilgisayardaki tarayıcıda (IndexedDB) saklanır;
program kapatılıp açıldığında yerinde durur. Her gün yeni raporu yüklemeniz yeterlidir: yeni rapor,
kapsadığı şube ve tarih aralığı için esas alınır (e-Okul'da düzeltilen kayıtlar da güncellenir),
diğer kayıtlar korunur. **Kayıtlı verileri sil** düğmesi (iki kez basılır) tüm verileri siler.
Veriler tarayıcıya bağlıdır: başka tarayıcıda, gizli pencerede ya da tarayıcı verileri
temizlendiğinde görünmez.

## Geliştirme

Kaynak `index.html` dosyasıdır; PDF okuyucuyu (pdf.js 3.11.174) internetten yükler.
Tek dosya sürümü pdf.js gömülü olarak şu komutla üretilir:

```sh
npm pack pdfjs-dist@3.11.174 && tar xzf pdfjs-dist-3.11.174.tgz
python3 build.py package/build
```

## Neler gösterir

Arayüz beş bölümden oluşur: **1. Günlük liste**, **2. Uyarılar**, **3. Raporlar**, **4. Sınıflar**,
**5. Rapor yükle ve ayarlar**.

- **Özet:** devamsız öğrenci sayısı, toplam devamsızlık günü, sınırı aşan ve uyarı düzeyindeki öğrenciler.
- **Sınırı aşan / dikkat gereken öğrenciler:** özürsüz ve toplam devamsızlık sınırını aşanlar,
  veli bildirimi eşiğine gelenler ve art arda uzun süre gelmeyenler (sürüyorsa ayrıca belirtilir).
- **Günlük / Haftalık / Aylık** tablo ve grafik; sınıf sütunlarıyla.
- **Öğrenci listesi:** öğrenci × gün/hafta/ay tablosu. İsme tıklayınca takvim ve tüm kayıtlar açılır.
- **Sınıf karşılaştırması** ve **en çok devamsız olanlar** sıralaması.
- **Günlük devamsız listesi:** **Bugün** düğmesi (veya tarih seçimi / ◀ ▶) ile o gün devamsız
  olan öğrenciler sınıf sınıf listelenir. Her sınıfın listesi **JPEG** ya da **PDF** olarak indirilip
  sınıf öğretmenine gönderilebilir; tüm sınıflar tek PDF'te (her sınıf ayrı sayfa) de alınabilir.
  Telefonda **Paylaş** düğmesi WhatsApp vb. uygulamalarla doğrudan gönderir.
- Filtreler: sınıf/şube, tarih aralığı, devamsızlık türü, öğrenci adı/numarası.
- Her tablo **Tabloyu kopyala** ile Excel'e yapıştırılabilir.

## Sınırlar

**Devamsızlık sınırları** bölümünden değiştirilebilir (tarayıcıda saklanır). Varsayılanlar:
özürsüz 10 gün, toplam 30 gün, veli bildirimi 5 gün özürsüz, art arda 5 iş günü.
Okulunuzun bağlı olduğu yönetmeliğin güncel değerlerini kontrol edip gerekirse düzenleyin.

Türü sütunundaki **D** kodu özürsüz sayılır; diğer kodlar (Ö, R, S, İ…) yalnızca toplama eklenir.
Hangi kodların özürsüz sayılacağı ayarlardan değiştirilebilir. Art arda gün hesabı hafta sonlarını
atlar, resmî tatilleri bilmez.
