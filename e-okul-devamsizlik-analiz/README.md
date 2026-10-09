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
diğer kayıtlar korunur. Üst çubuktaki **Verileri temizle** düğmesi (onay penceresiyle) tüm verileri siler.
Veriler tarayıcıya bağlıdır: başka tarayıcıda, gizli pencerede ya da tarayıcı verileri
temizlendiğinde görünmez.

## Geliştirme

Kaynak `index.html` dosyasıdır; PDF okuyucuyu (pdf.js 3.11.174) internetten yükler.
Tek dosya sürümü pdf.js gömülü olarak şu komutla üretilir:

```sh
npm pack pdfjs-dist@3.11.174 && tar xzf pdfjs-dist-3.11.174.tgz
python3 build.py package/build
```

## Bölümler

- **Bugün:** o gün devamsız olan öğrenciler sınıf sınıf. Her sınıfın listesi JPEG / PDF olarak
  indirilip sınıf öğretmenine gönderilebilir (telefonda **Paylaş** ile WhatsApp vb.).
- **Rapor oluştur:** sırayla seçin:
  1. **Tarih aralığı:** Bugün, Bu hafta, Geçen hafta, Bu ay, Geçen ay, Tüm kayıtlar ya da istediğiniz iki tarih.
  2. **Sınıflar:** bir veya birden çok sınıf.
  3. **Öğrenciler** (isteğe bağlı): ad ya da numara yazıp listeden seçin.
  4. **Rapor türü:** Öğrenci listesi, Gün gün, Hafta hafta, Ay ay, Sınıf özeti; devamsızlık türü (özürsüz/özürlü).
  5. **PDF indir / JPEG indir / Excel'e kopyala.** "Her sınıf ayrı sayfa / ayrı resim" seçiliyken her sınıf
     ayrı sayfada ve ayrı JPEG dosyasında olur; öğretmenlere ayrı ayrı gönderilebilir.
- **Uyarılar:** sınırı aşan, sınıra yaklaşan ve art arda gelmeyen öğrenciler.
- **Rapor yükle ve ayarlar:** PDF yükleme, kayıtlı veriler, devamsızlık sınırları.

Öğrencinin adına tıklayınca takvimi açılır; **Bu öğrencinin raporu** ile yalnız o öğrencinin raporu hazırlanır.

## Sınırlar

**Devamsızlık sınırları** bölümünden değiştirilebilir (tarayıcıda saklanır). Varsayılanlar:
özürsüz 10 gün, toplam 30 gün, veli bildirimi 5 gün özürsüz, art arda 5 iş günü.
Okulunuzun bağlı olduğu yönetmeliğin güncel değerlerini kontrol edip gerekirse düzenleyin.

Türü sütunundaki **D** kodu özürsüz sayılır; diğer kodlar (Ö, R, S, İ…) yalnızca toplama eklenir.
Hangi kodların özürsüz sayılacağı ayarlardan değiştirilebilir. Art arda gün hesabı hafta sonlarını
atlar, resmî tatilleri bilmez.
