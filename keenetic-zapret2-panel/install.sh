#!/bin/sh
# Z2Panel kurulum betiği (Keenetic + Entware)
#
# Uzaktan:  curl -fsSL https://raw.githubusercontent.com/cumacetinkaya72-jpg/programlar/main/keenetic-zapret2-panel/install.sh | sh
# Yerelden: sh install.sh            (proje dizini routera kopyalandıysa)
# Seçenekler: --update  (parola sormadan dosyaları yeniler)
#             --port N  (panel portu, varsayılan 8090)

set -e
R=/opt
PATH="$R/sbin:$R/bin:$R/usr/sbin:$R/usr/bin:/usr/sbin:/usr/bin:/sbin:/bin"
REPO="${Z2P_REPO:-cumacetinkaya72-jpg/programlar}"
REF="${Z2P_REF:-main}"
SUBDIR="keenetic-zapret2-panel"

UPDATE=0
NEW_PORT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --update) UPDATE=1 ;;
    --port) shift; NEW_PORT="$1" ;;
  esac
  shift
done

say() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mHATA:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "root olarak çalıştırın"
[ -d "$R/etc" ] && command -v opkg >/dev/null 2>&1 || die "Entware bulunamadı. Önce Keenetic'e Entware (OPKG) kurun."

# --- kaynak dosyalar
SRC=""
_here=$(cd "$(dirname "$0")" 2>/dev/null && pwd)
if [ -n "$_here" ] && [ -f "$_here/src/share/z2panel.sh" ]; then
  SRC="$_here"
else
  say "Panel dosyaları indiriliyor ($REPO@$REF)..."
  command -v curl >/dev/null 2>&1 || { opkg update >/dev/null && opkg install curl ca-certificates; }
  TMP="$R/tmp/z2p-install"
  rm -rf "$TMP"; mkdir -p "$TMP"
  curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" -o "$TMP/p.tar.gz" || die "İndirme başarısız"
  tar -xzf "$TMP/p.tar.gz" -C "$TMP"
  SRC=$(dirname "$(find "$TMP" -path "*/$SUBDIR/src/share/z2panel.sh" | head -n 1)")
  SRC="${SRC%/src/share}"
  [ -f "$SRC/src/share/z2panel.sh" ] || die "Arşivde panel bulunamadı"
fi

# --- bağımlılıklar
need=""
for p in lighttpd lighttpd-mod-cgi curl ca-certificates cron; do
  opkg status "$p" 2>/dev/null | grep -q '^Status:.*installed' || need="$need $p"
done
if [ -n "$need" ]; then
  say "Paketler kuruluyor:$need"
  opkg update
  # shellcheck disable=SC2086
  opkg install $need
fi

# --- dosyalar
say "Dosyalar kopyalanıyor..."
mkdir -p "$R/share/z2panel" "$R/share/www/z2panel" "$R/etc/z2panel" "$R/var/z2panel"
cp "$SRC/src/share/z2panel.sh" "$R/share/z2panel/z2panel.sh"
cp "$SRC/VERSION" "$R/share/z2panel/VERSION"
cp "$SRC"/src/www/* "$R/share/www/z2panel/"
chmod 755 "$R/share/z2panel/z2panel.sh" "$R/share/www/z2panel/api.cgi"
chmod 700 "$R/etc/z2panel" "$R/var/z2panel"
ln -sf "$R/share/z2panel/z2panel.sh" "$R/bin/z2panel"

# --- panel ayarları
CONF="$R/etc/z2panel/panel.conf"
[ -f "$CONF" ] || echo "PORT=8090" >"$CONF"
if [ -n "$NEW_PORT" ]; then
  echo "$NEW_PORT" | grep -qE '^[0-9]{2,5}$' || die "Geçersiz port: $NEW_PORT"
  { grep -v '^PORT=' "$CONF"; echo "PORT=$NEW_PORT"; } >"$CONF.tmp" && mv "$CONF.tmp" "$CONF"
fi
PORT=$(sed -n 's/^PORT=//p' "$CONF" | head -n 1)
PORT=${PORT:-8090}

# --- lighttpd
LCONF="$R/etc/lighttpd/conf.d/85-z2panel.conf"
mkdir -p "$R/etc/lighttpd/conf.d"
: >"$LCONF.tmp"
CGI_LOADED=0
for f in "$R/etc/lighttpd/lighttpd.conf" "$R"/etc/lighttpd/conf.d/*.conf; do
  [ "$f" = "$LCONF" ] && continue
  grep -qs 'mod_cgi' "$f" && CGI_LOADED=1
done
if [ $CGI_LOADED = 0 ]; then
  echo 'server.modules += ( "mod_cgi" )' >>"$LCONF.tmp"
fi
sed "s/__PORT__/$PORT/g" "$SRC/src/etc/lighttpd-z2panel.conf" >>"$LCONF.tmp"
mv "$LCONF.tmp" "$LCONF"

if command -v lighttpd >/dev/null 2>&1 && ! lighttpd -tt -f "$R/etc/lighttpd/lighttpd.conf" >/dev/null 2>&1; then
  lighttpd -tt -f "$R/etc/lighttpd/lighttpd.conf" || true
  die "lighttpd yapılandırması hatalı ($LCONF)"
fi

# --- parola
if [ $UPDATE = 0 ] && [ ! -s "$R/etc/z2panel/auth" ] && [ -r /dev/tty ] && [ -w /dev/tty ]; then
  printf 'Panel parolası belirleyin (boş bırakırsanız ilk girişte web arayüzünden sorulur): ' >/dev/tty
  stty -echo </dev/tty 2>/dev/null || true
  read -r PW </dev/tty || PW=""
  stty echo </dev/tty 2>/dev/null || true
  echo >/dev/tty
  if [ -n "$PW" ]; then
    [ ${#PW} -ge 6 ] || die "Parola en az 6 karakter olmalı (sonra 'z2panel passwd' ile de belirleyebilirsiniz)"
    Z2P_LIB=1 . "$R/share/z2panel/z2panel.sh"
    pw_set "$PW"
    say "Parola kaydedildi."
  fi
fi

# --- cron
"$R/bin/z2panel" cron-apply || true
[ -x "$R/etc/init.d/S10cron" ] && { "$R/etc/init.d/S10cron" status >/dev/null 2>&1 || "$R/etc/init.d/S10cron" start >/dev/null 2>&1 || true; }

# --- web sunucusunu yeniden başlat
if [ -x "$R/etc/init.d/S80lighttpd" ]; then
  say "lighttpd yeniden başlatılıyor..."
  "$R/etc/init.d/S80lighttpd" restart >/dev/null 2>&1 || "$R/etc/init.d/S80lighttpd" start >/dev/null 2>&1 || true
fi

[ -n "${TMP:-}" ] && rm -rf "$TMP"

IP=$(ip -4 addr show br0 2>/dev/null | awk '/inet /{sub(/\/.*/,"",$2); print $2; exit}')
say "Z2Panel $(cat "$R/share/z2panel/VERSION") kuruldu."
echo "    Adres: http://${IP:-<router-ip>}:$PORT"
echo "    Komut satırı: z2panel check | install | upgrade | direct | rollback | passwd"
