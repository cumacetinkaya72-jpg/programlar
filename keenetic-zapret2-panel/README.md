# Z2Panel: Keenetic için zapret2 yönetim paneli

Keenetic routerlarda (**Titan BE7200 / KN-1812** ve diğer Entware destekli modeller)
[zapret2](https://github.com/bol-van/zapret2) (`nfqws2`) kurmak, güncellemek ve yönetmek için
hafif bir web paneli.

- **Kurulum:** [nfqws2-keenetic](https://github.com/nfqws/nfqws2-keenetic) opkg deposunu
  cihazın mimarisine göre ekler ve paketi kurar.
- **Güncelleme (önerilen yol):** `opkg upgrade nfqws2-keenetic`. Öncesinde otomatik yapılandırma
  yedeği alır, paketle gelen yeni varsayılan dosyaları (`*-opkg`) bildirir.
- **Doğrudan zapret2 güncellemesi (gelişmiş):** Paket henüz yeni zapret2 sürümüne
  geçmediyse `nfqws2` ikilisini ve lua betiklerini doğrudan
  [bol-van/zapret2 sürümlerinden](https://github.com/bol-van/zapret2/releases) yükler.
  SHA-256 doğrulaması yapar, geri alma noktası oluşturur, servis başlamazsa otomatik geri alır.
- **Güncelleme denetimi:** zapret2, nfqws2-keenetic ve panelin son sürümlerini gösterir.
  İsteğe bağlı olarak her gün cron ile denetler ve paket güncellemesini otomatik kurar.
- **Servis yönetimi:** başlat / durdur / yeniden başlat, durum göstergesi.
- **Hızlı ayarlar:** çalışma modu (otomatik / liste / tümü), ISP arayüzü, IPv6.
- **Dosya düzenleyici:** `nfqws2.conf` ve `lists/*.list`. Kaydederken sözdizimi denetimi yapılır,
  önceki sürüm `*-old` olarak saklanır.
- **Günlükler:** `nfqws2.log`, debug günlüğü, Keenetic sistem günlüğü, işlem günlüğü.
- **Yedekler:** yedek alma, indirme, geri yükleme (en fazla 20 yedek saklanır).
- **Güvenlik:** parola ile giriş (tuzlu SHA-256), HttpOnly/SameSite oturum çerezi,
  CSRF koruması (özel başlık), dosya adlarında beyaz liste.

Arayüz tamamen Türkçedir. Telefonda da kullanılabilir ve koyu temayı destekler.

## Gereksinimler

1. **Entware (OPKG):** Keenetic'e [dahili belleğe](https://help.keenetic.com/hc/en-us/articles/360021888880)
   veya [USB belleğe](https://help.keenetic.com/hc/en-us/articles/360021214160) Entware kurulu olmalı.
2. Keenetic web arayüzü → **Genel ayarlar → Bileşenleri değiştir** bölümünden şu bileşenleri kurun:
   - **OPKG paket yöneticisi**
   - **Netfilter alt sistemi çekirdek modülleri** (*Kernel modules for Netfilter*). Bu bileşen olmadan nfqws2 çalışmaz.
   - (Eski sürümlerde gerekiyorsa) **IPv6 protokolü**
3. Önerilir: İnternet bağlantısı ayarlarında **“Sağlayıcının DNS sunucularını yok say”**
   seçeneğini açın ve [DoT/DoH](https://help.keenetic.com/hc/en-us/articles/360007687159) kullanın.
   DNS ile yapılan engeller zapret ile aşılamaz.
4. İnternet filtrelerini (AdGuard DNS, SkyDNS vb.) kapatın.

> KN-1812 (Titan) **aarch64** mimarisidir. Panel mimariyi `opkg.conf` ve `uname -m` üzerinden
> kendisi algılar ve uygun depoyu (`aarch64`) seçer.

## Kurulum

Entware ortamına SSH ile bağlanın (`ssh root@192.168.1.1 -p 222`, varsayılan parola `keenetic`)
veya telnet ile bağlandıktan sonra `exec sh` çalıştırın. Ardından:

```sh
opkg update && opkg install curl ca-certificates
curl -fsSL https://raw.githubusercontent.com/cumacetinkaya72-jpg/programlar/main/keenetic-zapret2-panel/install.sh | sh
```

> Depo gizliyse (private) yukarıdaki komut çalışmaz. Bu durumda `keenetic-zapret2-panel`
> klasörünü routera kopyalayıp (`scp -P 222 -r keenetic-zapret2-panel root@192.168.1.1:/opt/tmp/`)
> şu komutu çalıştırın: `sh /opt/tmp/keenetic-zapret2-panel/install.sh`

Kurulum betiği `lighttpd`, `lighttpd-mod-cgi`, `curl` ve `cron` paketlerini kurar, paneli
`/opt/share/www/z2panel` altına yerleştirir ve parola sorar. Ardından tarayıcıdan açın:

```
http://192.168.1.1:8090
```

Panelde **Kurulum & Güncelleme → Kur** düğmesi nfqws2-keenetic paketini kurar.
Farklı port için: `sh install.sh --port 8095`.

## Güncelleme mantığı

| Bileşen | Kaynak | Panel ne yapar |
|---|---|---|
| **nfqws2-keenetic** paketi | [nfqws/nfqws2-keenetic](https://github.com/nfqws/nfqws2-keenetic/releases) | `opkg upgrade` (önce yedek) |
| **nfqws2 ikilisi** (zapret2) | [bol-van/zapret2](https://github.com/bol-van/zapret2/releases) | Doğrudan güncelleme (`*-openwrt-embedded.tar.gz` + `sha256sum.txt`) |
| **Z2Panel** | bu depo | `Paneli güncelle` |

**Hangisini kullanmalıyım?** Normalde **paket güncellemesini** kullanın. nfqws2-keenetic paketi
zapret2'yi Keenetic için yamalayarak derler (ör. `--fastpath-workaround` seçeneği). Doğrudan
güncelleme ise upstream (yamasız) ikiliyi kurar. Bu seçenek yapılandırmanızda varsa ve yeni
ikili desteklemiyorsa panel bu seçeneği otomatik kaldırır; eski ayarlar geri alma noktasında
saklanır. Paket yeni sürüme geçtiğinde **Paketi güncelle** demeniz yeterlidir; paket ikiliyi
kendi sürümüyle değiştirir.

## Komut satırı

Panel, SSH'tan kullanılabilen `z2panel` komutunu da kurar:

```sh
z2panel check            # son sürümleri göster
z2panel install          # nfqws2-keenetic kur
z2panel upgrade          # paketi güncelle
z2panel direct           # zapret2 son sürümüne doğrudan güncelle
z2panel direct v1.0.5.2  # belirli bir sürüme
z2panel rollback         # doğrudan güncellemeyi geri al
z2panel backup etiket    # yedek al
z2panel passwd           # panel parolasını değiştir/sıfırla
```

## Dosya konumları

| Yol | İçerik |
|---|---|
| `/opt/share/z2panel/` | Backend betiği (`z2panel.sh`) |
| `/opt/share/www/z2panel/` | Web arayüzü + `api.cgi` |
| `/opt/etc/z2panel/` | Panel ayarları (`panel.conf`) ve parola özeti (`auth`) |
| `/opt/var/z2panel/` | Yedekler, geri alma noktası, işlem günlüğü, oturumlar |
| `/opt/etc/lighttpd/conf.d/85-z2panel.conf` | Web sunucusu yapılandırması |
| `/opt/etc/nfqws2/` | nfqws2 yapılandırması ve listeler (pakete aittir) |

## Kaldırma

```sh
sh /opt/tmp/keenetic-zapret2-panel/uninstall.sh          # paneli kaldırır, yedekleri korur
sh /opt/tmp/keenetic-zapret2-panel/uninstall.sh --purge  # yedekler dahil
```

nfqws2'yi kaldırmak için panelde **Kurulum & Güncelleme → nfqws2'yi kaldır** veya
`opkg remove --autoremove nfqws2-keenetic`.

## Sorun giderme

- **Panel açılmıyor:** `/opt/etc/init.d/S80lighttpd restart` çalıştırın ve
  `lighttpd -tt -f /opt/etc/lighttpd/lighttpd.conf` ile yapılandırmayı denetleyin.
- **Parolayı unuttum:** SSH'tan `z2panel passwd`.
- **nfqws2 çalışmıyor:** Genel Bakış'taki uyarılara bakın (çekirdek modülü, ISP arayüzü).
  `Günlükler → Keenetic sistem günlüğü` nfqws mesajlarını gösterir.
- **Siteler hâlâ açılmıyor:** Alan adını `user.list`'e ekleyin, modu kontrol edin ve
  `nfqws2.conf` içindeki stratejiyi ([zapret2 belgeleri](https://github.com/bol-van/zapret2/blob/master/docs/manual.md))
  sağlayıcınıza göre ayarlayın.

## Geliştirme

```sh
sh tests/run-tests.sh      # API testleri (busybox gerekir)
sh tests/dev-server.sh     # sahte Entware köküyle yerel sunucu: http://127.0.0.1:8090
```

Backend tamamen POSIX `sh` (busybox ash) ile yazılmıştır. PHP veya Python gerektirmez,
bu yüzden routerda yalnızca birkaç yüz KB yer kaplar.

## Uyarı

Bu yazılım eğitim ve teknik amaçlıdır. Kullanımından doğan sorumluluk kullanıcıya aittir.
zapret2: [bol-van/zapret2](https://github.com/bol-van/zapret2) ·
Keenetic paketi: [nfqws/nfqws2-keenetic](https://github.com/nfqws/nfqws2-keenetic) ·
Esinlenilen panel: [nfqws/nfqws-keenetic-web](https://github.com/nfqws/nfqws-keenetic-web)
