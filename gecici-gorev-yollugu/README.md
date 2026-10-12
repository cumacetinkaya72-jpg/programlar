# Geçici Görev Yolluğu

Okul Yönetim Araçları arayüzüyle aynı düzende, **tek dosyalık ve internetsiz çalışan** geçici görev yolluğu hesaplama programı.
Sonucu resmî **M.Y.H.B.Y. Örnek No: 27 – Yurtiçi/Yurtdışı Geçici Görev Yolluğu Bildirimi** formatında verir.

## Kullanım

1. `gecici-gorev-yollugu.html` dosyasını indirip tarayıcıda (Chrome, Edge, Firefox) açın.
2. Program 5 adımda sade sorular sorar: **Kişi → Görev → Yolculuk → Konaklama → Sonuç**.
   Her soruda ipucu ve “Bu ne demek?” açıklamaları vardır; eksik cevaplar kırmızıyla gösterilir.
3. Sonuç ekranında **🖨️ Formu yazdır** veya **📊 Excel dosyası olarak indir** ile Örnek 27 formunu alın.
   Muhasebeye teslim edilecek belgelerin listesi de gösterilir.

Yarım kalan hesap otomatik saklanır; sayfa kapansa bile kaldığınız yerden devam edersiniz.

## Özellikler

- Görev tarihine göre bütçe yılını kendisi seçer (2021–2026); ek gösterge ve kadro derecesine göre yevmiye
- Günübirlik görevde 1/3 – 2/3 oranını yola çıkış/dönüş saatlerinden kendisi hesaplar (m.39)
- Görev günleri dışında yolda geçen gün (önce gitme / sonra dönme) desteği
- m.33 süre sınırı: ilk 90 gün tam, sonraki 90 gün 2/3
- Gidiş/dönüş bileti, iki ayrı şehiriçi kalem, diğer zorunlu giderler
- Konaklama: belgeli (gündelik ×1,5 tavanı), belgesiz (gündeliğin %50'si), ücretsiz
- Damga vergisi bilgisi, tutarın yazıyla gösterimi
- Geçmiş hesaplamalar (tarayıcıda saklanır), CSV dışa aktarma, ayar/geçmiş yedekleme
- Gündelik oranları Ayarlar’dan düzenlenebilir (yeni yıllar için)

> ⚠ 2022 (7 Temmuz sonrası) üst kademeleri ve 2023 6400–8000 kademesi varsayılanları tahminidir; Ayarlar’da
> “⚠ kontrol” ile işaretlidir. Kullanmadan önce ilgili yılın Bütçe Kanunu (H) cetvelinden doğrulayın.

## Geliştirme

Kaynak `src/app.html`, şablon `sablon/ornek27_sablon.xlsx`. Şablon değişirse yeniden derleyin:

```sh
python3 tools/build.py   # gecici-gorev-yollugu.html üretir
```
