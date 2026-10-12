# Geçici Görev Yolluğu

Okul Yönetim Araçları arayüzüyle aynı düzende, **tek dosyalık ve internetsiz çalışan** geçici görev yolluğu hesaplama programı.
Sonucu resmî **M.Y.H.B.Y. Örnek No: 27 – Yurtiçi/Yurtdışı Geçici Görev Yolluğu Bildirimi** formatında verir.

## Kullanım

1. `gecici-gorev-yollugu.html` dosyasını indirip tarayıcıda (Chrome, Edge, Firefox) açın.
2. **Ayarlar** sekmesinde kurum adı, il/ilçe ve birim yetkilisini girip kaydedin.
3. Personel ve görev bilgilerini doldurup **Hesapla**’ya basın.
4. **📊 Excel (Örnek 27) İndir** → orijinal şablonun biçimiyle (birleştirilmiş hücreler, kenarlıklar, formüller) doldurulmuş `.xlsx`.
   **📄 Bildirim Formunu Aç** → yazdırılabilir / PDF olarak kaydedilebilir form.

## Özellikler

- Bütçe dönemleri 2021–2026, ek gösterge kademesi ve kadro derecesine göre (H cetveli) gündelik
- Yol süresi içinde/dışında, yol günü, m.39 günübirlik 1/3 – 2/3 – tam gündelik oranı
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
