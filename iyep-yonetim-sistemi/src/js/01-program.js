/* ==========================================================================
   İYEP 2026 ÖĞRETİM PROGRAMI VERİSİ
   Kaynak: T.C. Millî Eğitim Bakanlığı, İlkokullarda Yetiştirme Programı (İYEP),
   Türkiye Yüzyılı Maarif Modeli, 2026. Bölüm numaraları (1.1, 1.2 ...) bu
   belgeye aittir.
   ========================================================================== */

const PROGRAM_KAYNAK = "MEB İlkokullarda Yetiştirme Programı (İYEP) – Türkiye Yüzyılı Maarif Modeli, 2026";

// 1.2 Usul ve Esaslar: program süresi (ders saatleri dışında)
const KURAL = {
  haftaIciGunluk: 2,   // hafta içi günde en fazla
  haftaSonuGunluk: 6,  // hafta sonu günde en fazla
  haftalik: 10         // haftada toplam en fazla
};

const DERSLER = {
  TR: { ad: "Türkçe", uzun: "İYEP Türkçe Dersi", birim: "Öğrenme Alanı", renk: "tr" },
  MAT: { ad: "Matematik", uzun: "İYEP Matematik Dersi", birim: "Tema", renk: "mat" }
};

// 1.1 Programın hedef kitlesi (ilkokula devam eden ve özel eğitime ihtiyaç duymayan öğrencilerden)
const HEDEF_KITLE = [
  { k: "yetersiz", ad: "Öğrenme çıktılarını yeterli düzeyde edinemeyen", kisa: "ÖÇ yetersiz" },
  { k: "gocmen", ad: "Sığınmacı, göçmen, göçer veya yarı göçer aile çocuğu", kisa: "Göç" },
  { k: "gecici", ad: "Geçici koruma altındaki çocuk", kisa: "Geçici koruma" },
  { k: "mevsimlik", ad: "Mevsimlik tarım işçisi çocuğu", kisa: "Mevsimlik tarım" },
  { k: "dezavantajli", ad: "Diğer dezavantajlı öğrenci", kisa: "Dezavantajlı" }
];

// 1.4 Öğrenme çıktıları sayısı ve süre tabloları + 1.7 / 1.8 öğrenme alanları ve temalar
const UNITS = [
  {
    id: "T1", ders: "TR", sira: 1,
    baslik: "1. Öğrenme Alanı", ad: "İYEP 2. Sınıf Türkçe Dersi", kisa: "Türkçe 1. ÖA",
    odak: "İlk okuma yazma", saat: 68, yuzde: 72,
    aciklama: "Bu öğrenme alanında İlkokul 2. Sınıf Türkçe Dersi Öğretim Programı’nın öngördüğü ilk okuma ve yazma öğretimini kapsayan uygulamalara ilişkin öğrenme-öğretme yaşantıları yer almaktadır.",
    alanBecerileri: "TAB1. Dinleme / İzleme, TAB2. Okuma, TAB3. Konuşma, TAB4. Yazma",
    kavramsal: "–",
    egilimler: "E1.6. Seçicilik, E3.2. Odaklanma, E3.7. Sistematiklik",
    sdb: "SDB2.1. İletişim, SDB2.2. İş Birliği, SDB3.2. Esneklik",
    degerler: "D7. Estetik, D14. Saygı, D16. Sorumluluk",
    okuryazarlik: "OB4. Görsel Okuryazarlık",
    disiplinler: "Hayat Bilgisi, Matematik, Görsel Sanatlar",
    becerilerArasi: "KB1. Temel Beceriler, KB2.7. Karşılaştırma, KB2.12. Mevcut Bilgiye / Veriye Dayalı Tahmin Etme, KB2.16. Muhakeme (Akıl Yürütme), KB2.20. Sentezleme",
    icerik: "Bu öğrenme alanındaki etkinlikler aracılığı ile dinleme / izleme, konuşma, okuma ve yazma becerilerine ait öğrenme çıktılarının öğrencilere kazandırılması beklenmektedir.",
    genellemeler: [],
    anahtar: "harfler, rakamlar, okuma, yazma",
    semboller: "",
    kanitlar: "Öğrenme çıktıları; gözlem formu, performans görevi, dereceli puanlama anahtarı, kontrol listesi, öz değerlendirme formu, çalışma kâğıdı, öğrenci öğrenme dosyası kullanılarak değerlendirilebilir. Öğrencilere okuduğunu ve dinlediğini anlama, yazma ve konuşma becerisini içine alan bir performans görevi verilebilir. Performans görevi analitik dereceli puanlama anahtarı kullanılarak değerlendirilebilir.",
    olcmeKisa: "Gözlem formu, kontrol listesi, çalışma kâğıdı, öz değerlendirme formu, öğrenci öğrenme dosyası",
    performans: {
      gorev: "Öğrencilerin dinlediğini / okuduğunu anlama, yazma ve konuşma becerilerini bütüncül biçimde ortaya koyabilecekleri bir görev.",
      dpa: "analitik",
      olcutler: ["Dinlediğini / okuduğunu anlama", "Okuma (harf, hece, sözcük ve cümleleri doğru okuma)", "Yazma (harf ve rakamları kuralına uygun yazma, uygun boşluk bırakma)", "Konuşma (işitilebilir ses düzeyi, sözcükleri yerinde kullanma)"]
    },
    notlar: [
      "İlk harf grubunun (A, N, E, T, İ, L) öğretiminde hece ve sözcükler üzerinde durulur, cümleler kurulmaz.",
      "İkinci harf grubundan itibaren (O, K, U, R, I, M) cümle ve metin çalışmalarına geçilir.",
      "İlk iki harf grubu içinde bütün rakamların (1, 2, 3, 4, 5, 6, 7, 8, 9, 0) yazılışları kuralına uygun öğretilir.",
      "Önce harfin küçük yazılışı, ardından büyük yazılışı ve rakamların yazımı çalışılır.",
      "Hece ve sözcükler farklı renkle yazılmamalıdır (heceleyerek okumaya neden olur)."
    ],
    ciktilar: [
      { kod: "İ.T.D.2.1", beceri: "Dinleme / İzleme", ad: "Dinleme / İzlemeyi yönetebilme", bilesenler: [
        "a) Verilen görseller arasından öğrendiği sesin geçtiği görseli / görselleri seçer."] },
      { kod: "İ.T.D.2.2", beceri: "Dinleme / İzleme", ad: "Dinledikleri / izledikleri ile ilgili anlam oluşturabilme", bilesenler: [
        "a) Sese karşılık gelen sembolü / harfi tanır.",
        "b) Dinlediği sesin kaynağını tahmin eder.",
        "c) Dinlediği sesin bulunduğu sözcüklere örnekler verir."] },
      { kod: "İ.T.D.2.3", beceri: "Dinleme / İzleme", ad: "Dinlediklerini / izlediklerini çözümleyebilme", bilesenler: [
        "a) Seslere karşılık gelen sembolleri / harfleri ayırt eder."] },
      { kod: "İ.T.K.2.1", beceri: "Konuşma", ad: "Konuşma kurallarını uygulayabilme", bilesenler: [
        "a) Öğrendiği ses, hece, sözcük, cümleleri işitilebilir bir ses düzeyinde söyler.",
        "b) Konuşmalarında sözcükleri yerinde ve anlamına uygun kullanır."] },
      { kod: "İ.T.O.2.1", beceri: "Okuma", ad: "Okuma sürecini yönetebilme", bilesenler: [
        "a) Harf ve heceleri doğru seslendirir.",
        "b) Sözcükleri doğru okur.",
        "c) Basit ve kısa cümleleri doğru okur.",
        "ç) Öğrendiği ses, hece, sözcük veya cümleleri işitilebilir bir ses düzeyinde okur.",
        "d) Noktalama işaretlerine dikkat ederek okur.",
        "e) Kuralına uygun sesli ve sessiz okur.",
        "f) Anlaşılabilir ve uygun bir hızda sesli okur."] },
      { kod: "İ.T.Y.2.1", beceri: "Yazma", ad: "Yazılı anlatım becerilerini yönetebilme", bilesenler: [
        "a) Boyama ve çizgi çalışmaları yapar.",
        "b) Hece, sözcük veya cümleler yazar.",
        "c) Kısa metinler yazar.",
        "ç) Verilen bir metni metne bakarak yazar.",
        "d) Söylenen sözcük ve cümleleri yazar."] },
      { kod: "İ.T.Y.2.2", beceri: "Yazma", ad: "Yazılarında içerik oluşturabilme", bilesenler: [
        "a) Görsellerle ilgili sözcük ve cümleler yazar.",
        "b) Sözcük ve cümlelerde eksik bırakılan yerleri ön bilgileri doğrultusunda yazarak tamamlar."] },
      { kod: "İ.T.Y.2.3", beceri: "Yazma", ad: "Yazma kurallarını uygulayabilme", bilesenler: [
        "a) Anlamlı ve kurallı cümleler yazar.",
        "b) Harfleri temel formuna ve yazım yönlerine göre yazar.",
        "c) Rakamları temel formuna ve yazım yönlerine göre yazar.",
        "ç) Harf, sözcük veya cümleler arasında uygun boşluk bırakır.",
        "d) Harflerin büyük yazılışını yerinde kullanır.",
        "e) Yazılarında anlamlı ve kurallı cümleler kullanır.",
        "f) Rakam ve sayıları kuralına uygun yazar.",
        "g) Büyük harfleri kuralına uygun yazar.",
        "ğ) Yazılarında harfler, sözcükler ve satırlar arasında uygun boşluk bırakır.",
        "h) Yazılarında noktalama işaretlerini (nokta, kesme işareti, soru işareti, virgül, ünlem) kuralına uygun kullanır."] }
    ]
  },
  {
    id: "T2", ders: "TR", sira: 2,
    baslik: "2. Öğrenme Alanı", ad: "İYEP 3. Sınıf Türkçe Dersi", kisa: "Türkçe 2. ÖA",
    odak: "Okuduğunu ve dinlediğini anlama", saat: 26, yuzde: 28,
    aciklama: "Bu öğrenme alanında, belirlenen öğrenme çıktılarına ilişkin seviyeye uygun metinlerle dinleme / izleme, konuşma, okuma ve yazma becerilerinin geliştirilmesine yönelik öğrenme-öğretme yaşantılarının gerçekleştirilmesi amaçlanmaktadır.",
    alanBecerileri: "TAB1. Dinleme / İzleme, TAB2. Okuma, TAB3. Konuşma, TAB4. Yazma",
    kavramsal: "–",
    egilimler: "E1.1. Merak, E1.2. Bağımsızlık, E1.5. Kendine Güvenme (Öz Güven), E3.1. Muhakeme, E3.3. Yaratıcılık",
    sdb: "SDB1.1. Kendini Tanıma (Öz Farkındalık), SDB1.2. Kendini Düzenleme (Öz Düzenleme), SDB1.3. Kendine Uyarlama (Öz Yansıtma), SDB2.1. İletişim, SDB3.1. Uyum",
    degerler: "D7. Estetik, D14. Saygı",
    okuryazarlik: "OB1. Bilgi Okuryazarlığı, OB2. Dijital Okuryazarlık, OB4. Görsel Okuryazarlık",
    disiplinler: "Hayat Bilgisi, Görsel Sanatlar",
    becerilerArasi: "KB1. Temel Beceriler, KB2.5. Sınıflandırma, KB2.6. Bilgi Toplama, KB2.10. Çıkarım Yapma, KB2.12. Mevcut Bilgiye / Veriye Dayalı Tahmin Etme, KB2.13. Yapılandırma, KB2.17. Değerlendirme, KB3.1. Karar Verme",
    icerik: "Bu öğrenme alanındaki etkinlikler ve metinler aracılığı ile dinleme / izleme, konuşma, okuma, yazma becerilerine ait öğrenme çıktılarının kazandırılması beklenmektedir.",
    genellemeler: [],
    anahtar: "metin, dinleme / izleme, konuşma, okuma, yazma",
    semboller: "",
    kanitlar: "Öğrenme çıktıları; gözlem formu, kontrol listesi, dereceli puanlama anahtarı ve çalışma kâğıdı kullanılarak değerlendirilebilir. Öğrencilere okuduğunu ve dinlediğini anlama, yazma ve konuşma becerisini içine alan bir performans görevi verilebilir. Performans görevi analitik dereceli puanlama anahtarı kullanılarak değerlendirilebilir.",
    olcmeKisa: "Gözlem formu, kontrol listesi, dereceli puanlama anahtarı, çalışma kâğıdı, öz değerlendirme formu",
    performans: {
      gorev: "Öğrencilerin dinlediğini / okuduğunu anlama, yazma ve konuşma becerilerini bütüncül biçimde ortaya koyabilecekleri bir görev.",
      dpa: "analitik",
      olcutler: ["Dinlediğini / okuduğunu anlama (konu, karakter, olay, neden-sonuç)", "Okuma (doğru, akıcı, noktalama ve telaffuza uygun)", "Konuşma (anlamlı ve kurallı cümle, hız, vurgu ve tonlama)", "Yazma (içerik oluşturma, yazım ve noktalama kuralları)"]
    },
    notlar: [
      "Öğrenme-öğretme uygulamaları belirlenen sırayla yapılır: merak uyandırma → başlık ve görsellerden tahmin → örnek sesli okuma → sessiz okuma → noktalama işaretlerine dikkat ederek sesli okuma → sözcük çalışmaları → konuşma → yazma.",
      "Öğrenciler kendi okuma, dinleme ve yazma süreçlerini değerlendirir; hatalar belirlenip düzeltilir, olumlu davranışlar sonrakilere aktarılır."
    ],
    ciktilar: [
      { kod: "İ.T.D.3.1", beceri: "Dinleme / İzleme", ad: "Dinleme / İzlemeyi yönetebilme", bilesenler: [
        "a) Dinleme kurallarına uygun olarak dinler.",
        "b) Dinleme esnasında konuşmaya dâhil olmak için uygun zamanda söz alır."] },
      { kod: "İ.T.D.3.2", beceri: "Dinleme / İzleme", ad: "Dinledikleri / izledikleri ile ilgili anlam oluşturabilme", bilesenler: [
        "a) Görselden / görsellerden hareketle dinleyeceği / izleyeceği metin hakkında tahminde bulunur.",
        "b) Dinlediklerinde / izlediklerinde geçen olayların öncesi hakkında tahminde bulunur.",
        "c) Dinlediklerinde / izlediklerinde geçen olayların sonrası hakkında tahminde bulunur."] },
      { kod: "İ.T.K.3.1", beceri: "Konuşma", ad: "Konuşmalarında içerik oluşturabilme", bilesenler: [
        "a) Dinlediklerini, izlediklerini veya okuduklarını kendi cümleleriyle ifade eder.",
        "b) Dinledikleri, izledikleri veya okudukları metinlerdeki kişilerin benzer ve farklı yönlerini açıklar.",
        "c) Dinlediği, izlediği veya okuduğu bir metindeki olayları oluş sırasına göre kendi ifadeleriyle anlatır.",
        "ç) Dinlediği, izlediği veya okuduğu bir metindeki görüşlere katılıp katılmadığını nedenleriyle ifade eder.",
        "d) Dinlediği, izlediği veya okuduğu metindeki neden-sonuç ilişkisini söyler."] },
      { kod: "İ.T.K.3.2", beceri: "Konuşma", ad: "Konuşma kurallarını uygulayabilme", bilesenler: [
        "a) Konuşmalarında anlamlı ve kurallı cümleler kullanır.",
        "b) Konuşmalarında konuşma hızını ayarlar.",
        "c) Konuşmalarında vurgu ve tonlamaya dikkat eder."] },
      { kod: "İ.T.O.3.1", beceri: "Okuma", ad: "Okuma sürecini yönetebilme", bilesenler: [
        "a) Basit ve kısa cümleleri doğru okur.",
        "b) Telaffuza dikkat ederek okur.",
        "c) Anlaşılabilir ve uygun bir hızda sesli okur.",
        "ç) Okuyacağı metnin başlığı ve görsellerini inceler.",
        "d) Kuralına uygun sesli ve sessiz okur.",
        "e) Noktalama işaretlerine dikkat ederek okur."] },
      { kod: "İ.T.O.3.2", beceri: "Okuma", ad: "Okudukları ile ilgili anlam oluşturabilme", bilesenler: [
        "a) Okuduğu metindeki yönergeleri uygular.",
        "b) Okuduğu metindeki bilgiler ile ön bilgileri arasında bağlantı kurar.",
        "c) Okuyacağı metnin başlığından ve görsellerinden hareketle metnin konusu hakkında tahminde bulunur.",
        "ç) Metnin başlığı ve görsellerinden hareketle metinde geçen bilgiler / olaylar hakkında tahminde bulunur.",
        "d) Okuduğu metindeki verilerden yararlanarak içeriğe uygun çıkarımlar yapar."] },
      { kod: "İ.T.O.3.3", beceri: "Okuma", ad: "Okuduklarını çözümleyebilme", bilesenler: [
        "a) Okuduğu metindeki karakter, olay ve bilgileri açıklar.",
        "b) Okuduğu metnin konusunu bulur."] },
      { kod: "İ.T.O.3.4", beceri: "Okuma", ad: "Okuma sürecini değerlendirebilme", bilesenler: [
        "a) Okuma sürecindeki hatalarını belirler.",
        "b) Okuma sürecinde belirlediği hatalarını düzeltir.",
        "c) Okuma sürecindeki olumlu davranışlarını sonraki okumalarına aktarır."] },
      { kod: "İ.T.Y.3.1", beceri: "Yazma", ad: "Yazılı anlatım becerilerini yönetebilme", bilesenler: [
        "a) Kısa metinler yazar.",
        "b) Söylenen sözcük ve cümleleri yazar."] },
      { kod: "İ.T.Y.3.2", beceri: "Yazma", ad: "Yazılarında içerik oluşturabilme", bilesenler: [
        "a) Sözcük ve cümlelerde eksik bırakılan yerleri ön bilgileri doğrultusunda yazarak tamamlar.",
        "b) Yazılarını karşıdakinin iletilerinden yola çıkarak devam ettirir.",
        "c) Seçtiği görselden hareketle kısa bir metin yazar.",
        "ç) Dinlediği, izlediği veya okuduğu bir metindeki olayları oluş sırasına göre kendi ifadeleriyle yazar.",
        "d) Dinlediği, izlediği veya okuduğu metindeki neden-sonuç ilişkisini yazar."] },
      { kod: "İ.T.Y.3.3", beceri: "Yazma", ad: "Yazma kurallarını uygulayabilme", bilesenler: [
        "a) Yazılarında sözcükleri yerinde ve anlamına uygun kullanır.",
        "b) Yazışmalarında mesajlarını açık ve anlaşılır şekilde ifade eder.",
        "c) Yazılarında anlamlı ve kurallı cümleler kullanır.",
        "ç) Soru edatını (mı, mi) kuralına uygun yazar.",
        "d) Yazılarında noktalama işaretlerini (nokta, kesme işareti, virgül, iki nokta, ünlem, tırnak işareti, soru işareti, kısa çizgi) kuralına uygun kullanır."] },
      { kod: "İ.T.Y.3.4", beceri: "Yazma", ad: "Yazma sürecini değerlendirebilme", bilesenler: [
        "a) Yazılarında hatalarını bulur.",
        "b) Yazılarında belirlediği hataları düzeltir.",
        "c) Yazılarındaki uygun davranışları sonraki yazılarına aktarır."] }
    ]
  },
  {
    id: "M1", ders: "MAT", sira: 1,
    baslik: "1. Tema", ad: "Sayılar ve Nicelikler-1", kisa: "Mat. 1. Tema",
    odak: "20'ye kadar sayılar, çözümleme, ritmik sayma", saat: 10, yuzde: 15,
    aciklama: "Bu temada öğrencilerin rakam ve sayıları niceliklerin büyüklüklerini temsil edebilmek için kullanabilmeleri, 20’ye kadar olan nesne grubunu sayarken (20 dâhil) parçalar arasındaki ilişkileri belirleyebilmeleri, 100’e kadar (100 dâhil) ileriye ve 20’den geriye ritmik sayabilmeleri amaçlanmaktadır.",
    alanBecerileri: "MAB3. Matematiksel Temsil (MAB3.1. Matematiksel Temsillerden Yararlanma)",
    kavramsal: "KB1. Temel Beceriler, KB2.4. Çözümleme",
    egilimler: "E1.1. Merak, E1.3. Azim ve Kararlılık, E2.5. Oyunseverlik, E3.2. Odaklanma",
    sdb: "SDB2.1. İletişim, SDB2.2. İş Birliği, SDB3.1. Uyum",
    degerler: "D6. Dürüstlük, D7. Estetik, D12. Sabır, D16. Sorumluluk, D20. Yardımseverlik",
    okuryazarlik: "OB1. Bilgi Okuryazarlığı, OB7. Veri Okuryazarlığı",
    disiplinler: "Beden Eğitimi ve Oyun, Müzik",
    becerilerArasi: "KB2.16. Muhakeme (Akıl Yürütme) (KB2.16.2. Tümdengelimsel Akıl Yürütme)",
    icerik: "Rakamlar ve Sayılar, Sayıları Çözümleme, Ritmik Sayma",
    genellemeler: ["Sayılar çoklukları temsil eder."],
    anahtar: "rakamlar, sayılar, çözümleme, ritmik sayma",
    semboller: "–",
    kanitlar: "Bu temanın öğrenme çıktıları; eşleştirme ve boşluk doldurma sorularından oluşan çalışma yaprağı, kontrol listesi, izleme testleri ve gözlem formu ile değerlendirilebilir. Öğrencilerin 10-20 arasındaki nesneleri onluk ve birlik şeklinde çözümleyerek ifade etme ile ilgili öğrenme durumlarını ölçmek için öğrencilere performans görevi verilebilir. Verilen performans görevi analitik dereceli puanlama anahtarı ile değerlendirilebilir.",
    olcmeKisa: "Çalışma yaprağı (eşleştirme, boşluk doldurma), kontrol listesi, izleme testi, gözlem formu",
    performans: {
      gorev: "10-20 arasındaki nesneleri onluk ve birlik şeklinde çözümleyerek ifade etme.",
      dpa: "analitik",
      olcutler: ["Nesne grubunu doğru sayma", "10'luk grup oluşturma (onluk ve birlik)", "Çözümlemeyi uygun temsille gösterme", "Sayıyı rakamla okuma ve yazma"]
    },
    notlar: [],
    ciktilar: [
      { kod: "İ.MAT.1.1", beceri: "Sayılar ve Nicelikler", ad: "Rakamları ve 20’ye kadar olan sayıları (20 dâhil), niceliklerin büyüklüklerini temsil etmek için kullanabilme", bilesenler: [
        "a) Niceliklerin büyüklüklerinin farklı temsillerini tanır.",
        "b) Karşılaştığı niceliklerin büyüklüklerini, farklı temsilleri bağlamında belirler.",
        "c) Karşılaştığı niceliklerin büyüklüklerini rakam ve sayılarla okur ve yazar."] },
      { kod: "İ.MAT.1.2", beceri: "Sayılar ve Nicelikler", ad: "Ögeleri dağınık veya düzenli bir şekilde bulunan bir nesne grubunu sayarken parçalar arasındaki ilişkileri çözümleyebilme", bilesenler: [
        "a) Ögeleri dağınık veya düzenli bir şekilde bulunan bir nesne grubunun parçalarını belirler.",
        "b) Ögeleri dağınık veya düzenli bir şekilde bulunan bir nesne grubunu sayarken parçalar arasındaki ilişkileri belirler."] },
      { kod: "İ.MAT.1.3", beceri: "Sayılar ve Nicelikler", ad: "100’e kadar ileriye ve 20’den geriye doğru ritmik sayabilme", bilesenler: [] }
    ]
  },
  {
    id: "M2", ders: "MAT", sira: 2,
    baslik: "2. Tema", ad: "İşlemlerden Cebirsel Düşünmeye-1", kisa: "Mat. 2. Tema",
    odak: "20'ye kadar toplama-çıkarma, eşitlik", saat: 10, yuzde: 15,
    aciklama: "Bu temada öğrencilerin günlük yaşamın içerdiği toplama ve çıkarma işlemlerini çözümleyebilmesi, 20’den küçük sayılarla toplamları 20’ye kadar (20 dâhil) olan eldesiz toplama işlemi ve onluk bozma gerektirmeyen 20’den (20 dâhil) küçük sayılarla çıkarma işlemi yapabilmesi, toplama ve çıkarma işlemi bağlamında eşitliği yorumlayabilmesi, toplama ve çıkarma işlemlerinin sonuçlarını tahminde bulunarak ve zihinden işlem yaparak muhakeme edebilmesi amaçlanmaktadır.",
    alanBecerileri: "MAB1. Matematiksel Muhakeme",
    kavramsal: "KB2.4. Çözümleme, KB2.14. Yorumlama",
    egilimler: "E1.1. Merak, E2.5. Oyunseverlik, E3.2. Odaklanma, E3.3. Yaratıcılık, E3.6. Analitiklik",
    sdb: "SDB1.2. Kendini Düzenleme (Öz Düzenleme), SDB2.1. İletişim, SDB2.2. İş Birliği, SDB3.2. Esneklik, SDB3.3. Sorumlu Karar Verme",
    degerler: "D3. Çalışkanlık, D4. Dostluk, D10. Mütevazılık",
    okuryazarlik: "OB1. Bilgi Okuryazarlığı",
    disiplinler: "Beden Eğitimi ve Oyun",
    becerilerArasi: "–",
    icerik: "Toplama ve Çıkarma İşlemlerini Çözümleme, Toplama ve Çıkarma İşlemlerinin Sonuçlarını Tahmin Etme ve Zihinden İşlem, Toplama ve Çıkarma İşlemlerinde Eşitlik",
    genellemeler: ["Toplama ve çıkarma matematikte temel aritmetik işlemlerdendir."],
    anahtar: "toplama, toplanan, toplam, artma, çoğalma, artı, çıkarma, eksilen, çıkan, fark, azalma, eksilme, eksi, eşittir",
    semboller: "+, −, =",
    kanitlar: "Bu temanın öğrenme çıktıları; gözlem formu, açık uçlu sorular, boşluk doldurma ve eşleştirme sorularından oluşan çalışma kâğıtları ve kontrol listeleri kullanılarak değerlendirilebilir. \"Eşit işaretinin anlamını toplama ve çıkarma işlemi bağlamında yorumlayabilme\" öğrenme çıktısını değerlendirmek üzere öğrencilere performans görevi verilebilir. Performans görevleri analitik dereceli puanlama anahtarı ile değerlendirilebilir.",
    olcmeKisa: "Gözlem formu, açık uçlu sorular, çalışma kâğıdı (boşluk doldurma, eşleştirme), kontrol listesi",
    performans: {
      gorev: "Günlük yaşantıda karşılaşılan toplama ve çıkarma işlemleri içeren örnek olay yazma; eşitlik kavramı için eşit kollu terazi modeli tasarlama.",
      dpa: "analitik",
      olcutler: ["Günlük yaşam durumuna uygun örnek olay yazma", "Toplama / çıkarma işlemini doğru kurma", "Eşit kollu terazi modelini tasarlama", "Eşit işaretinin anlamını açıklama"]
    },
    notlar: ["Toplama işlemi iki sayı ile sınırlıdır; eldesiz alt alta ve yan yana yapılır.", "Kütle kavramına değinilmez."],
    ciktilar: [
      { kod: "İ.MAT.2.1", beceri: "İşlemlerden Cebirsel Düşünmeye", ad: "Günlük yaşamın içerdiği toplama ve çıkarma işlemlerini çözümleyebilme", bilesenler: [
        "a) Günlük yaşam durumunun toplama ve çıkarma işlemlerinden hangisini gerektirdiğini fark eder.",
        "b) Günlük yaşam durumuna karşılık gelen toplama ve çıkarma işlemlerini birbirleriyle ilişkilendirir."] },
      { kod: "İ.MAT.2.2", beceri: "İşlemlerden Cebirsel Düşünmeye", ad: "Toplama ve çıkarma işlemlerinin sonuçlarını tahminde bulunarak ve zihinden işlem yaparak muhakeme edebilme", bilesenler: [
        "a) Toplama ve çıkarma işlemlerine ilişkin ögeleri belirler.",
        "b) Toplama ve çıkarma işlemlerine ilişkin ögeler arasındaki ilişkileri belirler.",
        "c) Toplama ve çıkarma işlemlerine yönelik tahmin ve zihinden işlem sonuçları arasında ilişki kurar.",
        "ç) Tahmin ve zihinden işlem sonuçlarının tutarlılığını ifade eder."] },
      { kod: "İ.MAT.2.3", beceri: "İşlemlerden Cebirsel Düşünmeye", ad: "Eşit işaretinin anlamını toplama ve çıkarma işlemi bağlamında yorumlayabilme", bilesenler: [
        "a) Toplama ve çıkarma işlemlerinde eşit işaretinin kullanımını inceler.",
        "b) Eşit işaretinin anlamını kullanarak bir toplama ya da çıkarma işlemini dönüştürür.",
        "c) Dönüştürdüğü toplama ve çıkarma işlemlerini kendi cümleleriyle ifade eder."] }
    ]
  },
  {
    id: "M3", ders: "MAT", sira: 3,
    baslik: "3. Tema", ad: "Sayılar ve Nicelikler-2", kisa: "Mat. 3. Tema",
    odak: "100'e kadar sayılar, basamak değeri, ritmik sayma", saat: 12, yuzde: 18,
    aciklama: "Bu temada öğrencilerin nesne miktarlarını belirlerken 100’e kadar (100 dâhil) olan sayıları kullanabilmeleri, nesne sayısı 100’e kadar olan nesne grubunu çözümleyebilmeleri, 100’e kadar ileriye doğru ritmik sayabilmeleri amaçlanmaktadır.",
    alanBecerileri: "MAB3. Matematiksel Temsil (MAB3.1. Matematiksel Temsillerden Yararlanma)",
    kavramsal: "KB1. Temel Beceriler, KB2.4. Çözümleme",
    egilimler: "E3.3. Yaratıcılık",
    sdb: "SDB1.1. Kendini Tanıma (Öz Farkındalık), SDB1.2. Kendini Düzenleme (Öz Düzenleme), SDB1.3. Kendine Uyarlama (Öz Yansıtma), SDB2.1. İletişim, SDB2.2. İş Birliği",
    degerler: "D3. Çalışkanlık, D7. Estetik",
    okuryazarlik: "OB1. Bilgi Okuryazarlığı, OB2. Dijital Okuryazarlık, OB7. Veri Okuryazarlığı",
    disiplinler: "Beden Eğitimi ve Oyun, Müzik, Görsel Sanatlar",
    becerilerArasi: "KB2.16. Muhakeme (Akıl Yürütme) (KB2.16.2. Tümdengelimsel Akıl Yürütme)",
    icerik: "Sayılar, Sayıları Çözümleme, Ritmik Sayma",
    genellemeler: ["Sayılar çoklukları temsil eder."],
    anahtar: "sayı doğrusu, basamak değeri, çözümleme, onluk, birlik",
    semboller: "–",
    kanitlar: "Bu temanın öğrenme çıktıları; boşluk doldurma soruları, eşleştirme soruları ve açık uçlu sorular, gözlem formları, performans görevi, izleme testleri ve kontrol listesi kullanılarak değerlendirilebilir. Öğrencilere sınıf ortamında grup hâlinde çalışarak ileriye veya geriye doğru ritmik sayma becerilerini sergileyebilecekleri bir performans görevi verilebilir. Performans görevinin değerlendirilmesi bütüncül dereceli puanlama anahtarı ile yapılabilir.",
    olcmeKisa: "Boşluk doldurma, eşleştirme, açık uçlu sorular, gözlem formu, izleme testi, kontrol listesi",
    performans: {
      gorev: "Sınıf ortamında grup hâlinde çalışarak ileriye veya geriye doğru ritmik sayma becerilerini sergileme.",
      dpa: "bütüncül",
      olcutler: ["İleriye ve geriye doğru ritmik sayma, örüntüyü fark etme ve genelleme, grup içinde iş birliği (bütüncül değerlendirme)"]
    },
    notlar: ["Ritmik sayma: 20 içinde ikişer, 30 içinde üçer, 40 içinde dörder, 100 içinde beşer (ve onar) ileriye ve geriye doğru."],
    ciktilar: [
      { kod: "İ.MAT.3.1", beceri: "Sayılar ve Nicelikler", ad: "100’e kadar olan niceliklerin büyüklüklerini temsil etmede sayıların sembolik temsillerinden yararlanabilme", bilesenler: [
        "a) Niceliklerin büyüklüklerinin farklı temsillerini tanır.",
        "b) Niceliklerin büyüklüklerine uygun sayı temsillerini belirler.",
        "c) Niceliklerin büyüklüklerine karşılık gelen sayıları okur ve yazar."] },
      { kod: "İ.MAT.3.2", beceri: "Sayılar ve Nicelikler", ad: "İki basamaklı sayıları çözümleyebilme", bilesenler: [
        "a) İki basamaklı sayıların basamak ve basamak değerini belirler.",
        "b) İki basamaklı sayıların basamak ve basamak değerleri arasındaki ilişkileri belirler."] },
      { kod: "İ.MAT.3.3", beceri: "Sayılar ve Nicelikler", ad: "İleriye ve geriye doğru ritmik sayabilme", bilesenler: [
        "a) Yüzlük tablo üzerinde ileriye ve geriye doğru ritmik saymaya ilişkin gözlem yapar.",
        "b) 20 içinde ikişer, 30 içinde üçer, 40 içinde dörder, 100 içinde beşer ileriye ve geriye doğru ritmik sayarken örüntü bulur.",
        "c) İleriye ve geriye doğru ritmik sayarken bulduğu örüntüyü geneller."] }
    ]
  },
  {
    id: "M4", ders: "MAT", sira: 4,
    baslik: "4. Tema", ad: "İşlemlerden Cebirsel Düşünmeye-2", kisa: "Mat. 4. Tema",
    odak: "Problemler, çarpma ve bölme", saat: 34, yuzde: 52,
    aciklama: "Bu temada öğrencilerin toplama ve çıkarma işlemleri gerektiren günlük yaşam problemlerini çözebilmesi; çarpma işlemini tekrarlı toplama, bölme işlemini ardışık çıkarma ile anlamlandırabilmesi; tahmin ederek veya zihinden işlemlerle çarpma ve bölme işleminin sonucunu bulabilmesi amaçlanmaktadır.",
    alanBecerileri: "MAB1. Matematiksel Muhakeme, MAB2. Matematiksel Problem Çözme",
    kavramsal: "KB2.4. Çözümleme",
    egilimler: "E3.3. Yaratıcılık",
    sdb: "SDB2.1. İletişim, SDB3.1. Uyum, SDB3.2. Esneklik",
    degerler: "D3. Çalışkanlık, D10. Mütevazılık",
    okuryazarlik: "OB1. Bilgi Okuryazarlığı",
    disiplinler: "Hayat Bilgisi, Beden Eğitimi ve Oyun",
    becerilerArasi: "–",
    icerik: "Toplama ve Çıkarma İşlemleriyle İlgili Problemler, Çarpma ve Bölme İşlemleri, Çarpma ve Bölme İşlemlerinin Sonuçlarını Tahmin Etme ve Zihinden İşlem",
    genellemeler: ["Toplama, çıkarma, çarpma ve bölme matematiğin temel işlemleridir."],
    anahtar: "eldeli toplama, tekrarlı toplama, çarpma, çarpan, çarpım, ardışık çıkarma, bölme, bölünen, bölen, bölüm, kalan, gruplandırma, eşit paylaştırma, deste, düzine",
    semboller: "x, ÷",
    kanitlar: "Öğrenme-öğretme uygulamaları neticesinde ulaşılmak istenen öğrenme çıktıları; gözlem formları, performans görevi, kontrol listeleri, eşleştirme soruları ve izleme testleri kullanılarak değerlendirilebilir. Toplama ve çıkarma işlemleri gerektiren günlük yaşam problemlerinin çözülmesine yönelik performans görevi verilebilir. Performans görevinin değerlendirilmesi bütüncül dereceli puanlama anahtarı ile yapılabilir.",
    olcmeKisa: "Gözlem formu, kontrol listesi, eşleştirme soruları, izleme testi, performans görevi",
    performans: {
      gorev: "Toplama ve çıkarma işlemlerini gerektiren günlük yaşam problemlerini çözümleri ile hazırlama.",
      dpa: "bütüncül",
      olcutler: ["Problem kurma, verilen-istenenleri belirleme, uygun strateji ile çözme ve çözümü kontrol etme (bütüncül değerlendirme)"]
    },
    notlar: ["En çok iki işlemli problemlerle çalışılır; toplamlar 100'ü geçmez.", "Çarpma: 10'a kadar sayılar 1, 2, 3, 4 ve 5 ile; 5'e kadar (5 dâhil) çarpım tablosu.", "Bölme: bölüneni 20'ye kadar olan sayılarla (2, 3, 4, 5) kalansız bölme.", "0 için yutan eleman, 1 için etkisiz eleman ifadelerine yer verilmez."],
    ciktilar: [
      { kod: "İ.MAT.4.1", beceri: "İşlemlerden Cebirsel Düşünmeye", ad: "Toplama ve çıkarma işlemleri gerektiren günlük yaşam problemlerini çözebilme", bilesenler: [
        "a) Problemi anlayarak verilenler ve istenilenleri belirler.",
        "b) Problemde verilenler ile istenilenlerin gerektirdiği işlemler arasındaki ilişkiyi belirler.",
        "c) Probleme ilişkin verilenleri belirleyerek uygun matematiksel temsillere dönüştürür.",
        "ç) Matematiksel temsillere dönüştürdüğü problemi kendi ifadeleri ile açıklar.",
        "d) Problemlerin sonucuna ilişkin tahminde bulunarak işlemleri gerçekleştirmek için stratejiler geliştirir.",
        "e) Belirlenen strateji ya da stratejileri çözüm için uygular.",
        "f) Çözüm yollarını kontrol ederek çözüme ulaştırmayan stratejiyi değiştirir.",
        "g) Problemin çözümü için kullandığı veya geliştirdiği stratejileri gözden geçirerek kısa yolları değerlendirir.",
        "ğ) Çözüme ulaştıran stratejinin / stratejilerin hangi problemlere uygulanabileceğini geneller.",
        "h) Genellemenin geçerliliğini matematiksel örneklerle değerlendirir."] },
      { kod: "İ.MAT.4.2", beceri: "İşlemlerden Cebirsel Düşünmeye", ad: "Çarpma ve bölme işlemlerini toplama ve çıkarma işlemlerine dayalı olarak çözümleyebilme", bilesenler: [
        "a) Çarpma ve bölme işlemlerinin anlamlarının toplama ve çıkarma işlemleriyle ilişkili olduğunu fark eder.",
        "b) Çarpma ve bölme işlemlerini toplama ve çıkarma işlemleriyle ilişkilendirir."] },
      { kod: "İ.MAT.4.3", beceri: "İşlemlerden Cebirsel Düşünmeye", ad: "Çarpma ve bölme işlemlerinin sonuçlarını tahminde bulunarak ve zihinden işlem yaparak muhakeme edebilme", bilesenler: [
        "a) Çarpma ve bölme işlemlerine ilişkin bileşenleri belirler.",
        "b) Çarpma ve bölme işlemlerine ilişkin bileşenler arasındaki ilişkileri belirler.",
        "c) Çarpma ve bölme işlemine yönelik tahmin ve zihinden işlem sonuçlarını ifade eder.",
        "ç) Tahmin ve zihinden işlem sonuçlarını açıklar."] }
    ]
  }
];

const UNIT = {};
UNITS.forEach(function (u) { UNIT[u.id] = u; });
const UNIT_IDS = UNITS.map(function (u) { return u.id; });
const TR_UNITS = UNITS.filter(function (u) { return u.ders === "TR"; });
const MAT_UNITS = UNITS.filter(function (u) { return u.ders === "MAT"; });
const TOPLAM_SAAT = {
  TR: TR_UNITS.reduce(function (a, u) { return a + u.saat; }, 0),   // 94
  MAT: MAT_UNITS.reduce(function (a, u) { return a + u.saat; }, 0)  // 66
};

// 1.4 Tablo 1: Türkçe temel dil becerilerine göre öğrenme çıktısı dağılımı
const TR_BECERI_DAGILIM = [
  { beceri: "Dinleme / İzleme", s2: 3, s3: 2 },
  { beceri: "Konuşma", s2: 1, s3: 2 },
  { beceri: "Okuma", s2: 1, s3: 4 },
  { beceri: "Yazma", s2: 3, s3: 4 }
];

// 1.5 İYEP kitaplarının forma sayıları ve ebadı
const KITAPLAR = [
  { ad: "İYEP Türkçe 2. Sınıf", forma: "36-38", ebat: "19,5 cm x 27,5 cm" },
  { ad: "İYEP Türkçe 3. Sınıf", forma: "12-14", ebat: "19,5 cm x 27,5 cm" },
  { ad: "İYEP Matematik", forma: "20-22", ebat: "19,5 cm x 27,5 cm" }
];

// Öğrenme kanıtları izleme durumları (biçimlendirici değerlendirme; not verilmez)
const IZLEME_DURUM = {
  "": { ad: "Gözlenmedi", kisa: "–" },
  G: { ad: "Gelişiyor", kisa: "G" },
  E: { ad: "Edindi", kisa: "E" }
};

// Program sonu ÖDA ile belirlenen düzey
const ODA_DURUM = {
  "": { ad: "Girilmedi" },
  ulasti: { ad: "Öğrenme çıktılarına ulaştı" },
  kismen: { ad: "Kısmen ulaştı" },
  ulasamadi: { ad: "Ulaşamadı" }
};

// Performans görevi dereceli puanlama anahtarı düzeyleri
const DPA_DUZEY = [
  { p: 4, ad: "Çok iyi" },
  { p: 3, ad: "İyi" },
  { p: 2, ad: "Geliştirilmeli" },
  { p: 1, ad: "Başlangıç" }
];
