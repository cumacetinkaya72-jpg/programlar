# Maaş Kesim Raporu (Rapor Kesinti Bordrosu)

Sağlık raporu alan personelin yan ödeme, özel hizmet tazminatı ve ek tazminatından
yapılan **%25 rapor kesintisinin** bordrosunu hazırlayan, tek dosyalık HTML programı.

## Kullanım

`index.html` dosyasını herhangi bir tarayıcıda (Chrome, Edge, Firefox) açmanız yeterli.
Kurulum veya internet bağlantısı gerekmez; veriler yalnızca tarayıcınızda saklanır.

1. Kurum, personel ve imza bilgilerini girin.
2. Her rapor dönemi için ay/yıl, yan ödeme, ÖHT, ek tazminat, rapor günü ve istisnayı girip **Dönem Ekle**'ye basın.
3. **PDF Bordro İndir / Yazdır** ile yazdırma penceresinde "PDF olarak kaydet"i seçin.

## Hesap

```
günlük       = (yan ödeme + ÖHT + ek tazminat) ÷ 30
kesinti günü = rapor günü            (istisna "Hayır")
             = max(0, rapor günü − 7) (istisna "Evet")
%25 kesinti  = günlük × kesinti günü × 0,25
damga v.     = %25 kesinti × 0,00759
net          = %25 kesinti − damga v.
```

## Diğer özellikler

- Dönem düzenleme / silme, otomatik kayıt (sayfa yenilense de veriler kalır)
- Kayıtlı personel listesi (ad yazınca T.C. ve ünvan otomatik dolar)
- Excel (CSV) dışa aktarma, JSON yedek alma / yükleme
- Toplam tutarın yazıyla gösterimi
