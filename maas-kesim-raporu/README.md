# Maaş Kesim Raporu (Rapor Kesinti Bordrosu)

Sağlık raporu alan personelin yan ödeme, özel hizmet tazminatı ve ek tazminatından
yapılan **%25 rapor kesintisinin** bordrosunu hazırlayan, tek dosyalık HTML programı.

## Kullanım

`index.html` dosyasını herhangi bir tarayıcıda (Chrome, Edge, Firefox) açmanız yeterli.
Kurulum veya internet bağlantısı gerekmez; veriler yalnızca tarayıcınızda saklanır.
Program ilk açılışta kısa bir kullanım rehberi gösterir; denemek için **🧪 Örnekle dene** butonu vardır.

1. **Kişi bilgileri:** Okul adı, personel adı ve imza bilgileri.
2. **Rapor bilgileri:** Maaş bordrosundaki tutarlar ve rapor günü. Hesap yazarken anında görünür; her ay için **Bu dönemi listeye ekle**.
3. **Kontrol ve yazdır:** Bordro önizlemesine bakıp **Bordroyu yazdır / PDF olarak kaydet**.

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
