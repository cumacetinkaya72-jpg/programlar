#!/bin/sh
# Z2Panel - Keenetic zapret2 (nfqws2) yönetim paneli
# Backend fonksiyonları + komut satırı aracı.
#
#   z2panel status            Durum özetini (JSON) yazdırır
#   z2panel check             Güncellemeleri denetler
#   z2panel install           nfqws2-keenetic paketini kurar
#   z2panel upgrade           Paketi opkg ile günceller
#   z2panel direct [TAG]      nfqws2'yi doğrudan bol-van/zapret2 sürümünden günceller
#   z2panel rollback          Doğrudan güncellemeyi geri alır
#   z2panel backup [ETIKET]   Yapılandırma yedeği alır
#   z2panel passwd            Panel parolasını değiştirir
#   z2panel cron              Zamanlanmış denetim (cron tarafından çağrılır)
#
# Dosya, api.cgi tarafından Z2P_LIB=1 ile kaynak olarak da yüklenir.

R="${Z2P_ROOT:-/opt}"
PATH="$R/sbin:$R/bin:$R/usr/sbin:$R/usr/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export PATH

SHARE="$R/share/z2panel"
ETC="$R/etc/z2panel"
VAR="$R/var/z2panel"
PANEL_CONF="$ETC/panel.conf"
AUTH_FILE="$ETC/auth"
SESS_DIR="$VAR/sess"
JOB_DIR="$VAR/job"
BACKUP_DIR="$VAR/backups"
ROLLBACK_DIR="$VAR/rollback"
CACHE_FILE="$VAR/updates.cache"
STATE_FILE="$VAR/state"

PKG="nfqws2-keenetic"
NFQ_ETC="$R/etc/nfqws2"
NFQ_CONF="$NFQ_ETC/nfqws2.conf"
NFQ_LISTS="$NFQ_ETC/lists"
NFQ_LUA="$NFQ_ETC/lua"
NFQ_BIN="$R/usr/bin/nfqws2"
NFQ_INIT="$R/etc/init.d/S51nfqws2"
OPKG_REPO_CONF="$R/etc/opkg/nfqws2-keenetic.conf"
CRONTAB="$R/etc/crontab"

ZAPRET_REPO="bol-van/zapret2"
PKG_REPO="nfqws/nfqws2-keenetic"
PKG_FEED="https://nfqws.github.io/nfqws2-keenetic"

# Varsayılanlar (panel.conf ile değiştirilebilir)
PORT=8090
AUTO_CHECK=1
AUTO_UPGRADE=0
CHECK_HOUR=4
PANEL_REPO="cumacetinkaya72-jpg/programlar"
PANEL_REF="main"
PANEL_SUBDIR="keenetic-zapret2-panel"
# shellcheck disable=SC1090
[ -f "$PANEL_CONF" ] && . "$PANEL_CONF"

SESSION_TTL_MIN=720
UA="z2panel"

# ---------------------------------------------------------------- yardımcılar

log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
warn() { log "UYARI: $*"; }
die() { log "HATA: $*"; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

panel_version() { cat "$SHARE/VERSION" 2>/dev/null || echo "0.0.0"; }

# JSON string (tırnaklar dahil)
jstr() {
  printf '"'
  printf '%s' "$1" | awk 'BEGIN{ORS=""} {gsub(/\\/,"\\\\"); gsub(/"/,"\\\""); gsub(/\t/,"\\t"); gsub(/\r/,""); gsub(/[\001-\010\013-\037]/,""); if (NR>1) print "\\n"; print}'
  printf '"'
}
jbool() { if [ "$1" = 1 ]; then printf true; else printf false; fi; }

rand_hex() { head -c "${1:-16}" /dev/urandom | od -An -tx1 | tr -d ' \n'; }

sha256() {
  if have sha256sum; then sha256sum | cut -d' ' -f1
  else openssl dgst -sha256 | sed 's/^.*= *//'; fi
}

# a > b ise 0 döner (sürüm karşılaştırma, "v" öneki yok sayılır)
ver_gt() {
  awk -v a="${1#v}" -v b="${2#v}" 'BEGIN{
    na=split(a,x,/[^0-9]+/); nb=split(b,y,/[^0-9]+/); n=(na>nb)?na:nb;
    for(i=1;i<=n;i++){ if((x[i]+0)>(y[i]+0)) exit 0; if((x[i]+0)<(y[i]+0)) exit 1 }
    exit 1 }'
}

# fetch URL [ÇIKTI]  (çıktı yoksa stdout)
fetch() {
  _out="${2:--}"
  if have curl; then
    curl -fsSL --connect-timeout 15 -m 300 -A "$UA" -o "$_out" "$1"
  elif have wget; then
    wget -q -T 30 -U "$UA" -O "$_out" "$1"
  else
    log "curl veya wget bulunamadı"; return 1
  fi
}

gh_latest_tag() {
  fetch "https://api.github.com/repos/$1/releases/latest" 2>/dev/null |
    sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1
}

ndmc_cli() {
  [ -x /bin/ndmc ] || return 1
  LD_LIBRARY_PATH="/lib:/usr/lib" /bin/ndmc -c "$@" 2>/dev/null
}

# ------------------------------------------------------------ sistem bilgisi

device_info() {
  _v=$(ndmc_cli show version)
  MODEL=$(printf '%s\n' "$_v" | sed -n 's/^ *model: *//p' | head -n 1)
  HW_ID=$(printf '%s\n' "$_v" | sed -n 's/^ *hw_id: *//p' | head -n 1)
  FW=$(printf '%s\n' "$_v" | sed -n 's/^ *title: *//p' | head -n 1)
  [ -n "$FW" ] || FW=$(printf '%s\n' "$_v" | sed -n 's/^ *release: *//p' | head -n 1)
  if [ -z "$MODEL" ] && [ -r /proc/device-tree/model ]; then
    MODEL=$(tr -d '\0' </proc/device-tree/model)
  fi
  KERNEL=$(uname -r)
  MACH=$(uname -m)
}

# REPO_ARCH: nfqws2-keenetic depo mimarisi, ZBIN: zapret2 binaries/ alt dizini
detect_arch() {
  REPO_ARCH=""
  _a=$(grep -oE 'mips-3|mipsel-3|mips64|aarch64-3|armv7|x86_64' "$R/etc/opkg.conf" 2>/dev/null | head -n 1)
  case "$_a" in
    aarch64-3) REPO_ARCH=aarch64 ;;
    mipsel-3) REPO_ARCH=mipsel ;;
    mips-3) REPO_ARCH=mips ;;
    *) REPO_ARCH=all ;;
  esac
  case "$(uname -m)" in
    aarch64*) ZBIN=linux-arm64 ;;
    armv7*|armv6*|arm) ZBIN=linux-arm ;;
    mips64*) ZBIN=linux-mips64 ;;
    mips*)
      if [ "$REPO_ARCH" = mipsel ] || grep -qi 'mediatek\|mt7621\|mt7628' /proc/cpuinfo 2>/dev/null; then
        ZBIN=linux-mipsel
      else
        ZBIN=linux-mips
      fi ;;
    x86_64) ZBIN=linux-x86_64 ;;
    i?86) ZBIN=linux-x86 ;;
    *) ZBIN="" ;;
  esac
}

kmods_ok() {
  _k=$(uname -r)
  for _d in "/lib/modules/$_k" "/lib/system-modules/$_k" /lib/system-modules; do
    [ -d "$_d" ] && find "$_d" -name 'nfnetlink_queue.ko*' 2>/dev/null | grep -q . && return 0
  done
  grep -q '^nfnetlink_queue ' /proc/modules 2>/dev/null
}

pkg_version() {
  have opkg || return 0
  opkg status "$PKG" 2>/dev/null | awk -F': ' '/^Version:/{print $2; exit}'
}

bin_version() {
  [ -x "$NFQ_BIN" ] || return 0
  "$NFQ_BIN" --version 2>&1 | sed -n 's/.*version \(v[0-9][^ ]*\).*/\1/p' | head -n 1
}

service_running() {
  [ -x "$NFQ_INIT" ] && "$NFQ_INIT" status 2>/dev/null | grep -q 'is running'
}

conf_get() { # DEĞİŞKEN -> değer (yalnızca tek satırlık atamalar)
  sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}\$/\1/p" "$NFQ_CONF" 2>/dev/null | head -n 1
}

current_mode() {
  case "$(conf_get NFQWS_EXTRA_ARGS)" in
    '$MODE_AUTO') echo auto ;;
    '$MODE_LIST') echo list ;;
    '$MODE_ALL') echo all ;;
    *) echo custom ;;
  esac
}

state_get() { sed -n "s/^$1=//p" "$STATE_FILE" 2>/dev/null | head -n 1; }
state_set() {
  mkdir -p "$VAR"
  { grep -v "^$1=" "$STATE_FILE" 2>/dev/null; echo "$1=$2"; } >"$STATE_FILE.tmp"
  mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# ---------------------------------------------------------- güncelleme kontrolü

check_updates() { # [force]
  mkdir -p "$VAR"
  _now=$(date +%s)
  if [ "$1" != force ] && [ -f "$CACHE_FILE" ]; then
    # shellcheck disable=SC1090
    . "$CACHE_FILE"
    [ $((_now - ${CHECKED_AT:-0})) -lt 3600 ] && return 0
  fi
  LATEST_ZAPRET=$(gh_latest_tag "$ZAPRET_REPO")
  LATEST_PKG=$(gh_latest_tag "$PKG_REPO")
  LATEST_PANEL=$(fetch "https://raw.githubusercontent.com/$PANEL_REPO/$PANEL_REF/$PANEL_SUBDIR/VERSION" 2>/dev/null | head -n 1 | tr -d ' \r')
  case "$LATEST_PANEL" in [0-9]*) ;; *) LATEST_PANEL="" ;; esac
  CHECKED_AT=$_now
  {
    echo "LATEST_ZAPRET='$LATEST_ZAPRET'"
    echo "LATEST_PKG='$LATEST_PKG'"
    echo "LATEST_PANEL='$LATEST_PANEL'"
    echo "CHECKED_AT=$CHECKED_AT"
  } >"$CACHE_FILE"
}

load_cache() {
  LATEST_ZAPRET="" LATEST_PKG="" LATEST_PANEL="" CHECKED_AT=0
  # shellcheck disable=SC1090
  [ -f "$CACHE_FILE" ] && . "$CACHE_FILE"
}

# Güncelleme var mı? (cron için)
pkg_update_available() {
  _pv=$(pkg_version)
  [ -n "$_pv" ] && [ -n "$LATEST_PKG" ] && ver_gt "$LATEST_PKG" "$_pv"
}

# ----------------------------------------------------------------- durum JSON

status_json() {
  device_info
  detect_arch
  load_cache
  _pv=$(pkg_version)
  _bv=$(bin_version)
  _run=0; service_running && _run=1
  _ent=0; have opkg && [ -d "$R/etc" ] && _ent=1
  _km=0; kmods_ok && _km=1
  _inst=0; [ -x "$NFQ_BIN" ] && _inst=1
  _opkgnew=$(cd "$NFQ_ETC" 2>/dev/null && find . -name '*-opkg' 2>/dev/null | sed 's#^\./##;s#^lists/##' | tr '\n' ' ')
  _cron=0; [ -f "$CRONTAB" ] && _cron=1
  _rb=0; [ -f "$ROLLBACK_DIR/nfqws2" ] && _rb=1
  printf '{"ok":true'
  printf ',"device":{"model":%s,"hw_id":%s,"firmware":%s,"kernel":%s,"machine":%s,"repo_arch":%s,"zbin":%s}' \
    "$(jstr "$MODEL")" "$(jstr "$HW_ID")" "$(jstr "$FW")" "$(jstr "$KERNEL")" "$(jstr "$MACH")" "$(jstr "$REPO_ARCH")" "$(jstr "$ZBIN")"
  printf ',"entware":%s,"kmods":%s,"installed":%s,"running":%s' "$(jbool $_ent)" "$(jbool $_km)" "$(jbool $_inst)" "$(jbool $_run)"
  printf ',"pkg_version":%s,"bin_version":%s,"panel_version":%s' "$(jstr "$_pv")" "$(jstr "$_bv")" "$(jstr "$(panel_version)")"
  printf ',"direct_tag":%s,"rollback":%s' "$(jstr "$(state_get DIRECT_TAG)")" "$(jbool $_rb)"
  printf ',"latest":{"zapret":%s,"pkg":%s,"panel":%s,"checked_at":%s}' \
    "$(jstr "$LATEST_ZAPRET")" "$(jstr "$LATEST_PKG")" "$(jstr "$LATEST_PANEL")" "${CHECKED_AT:-0}"
  printf ',"mode":%s,"isp_interface":%s,"ipv6":%s' "$(jstr "$(current_mode)")" "$(jstr "$(conf_get ISP_INTERFACE)")" "$(jstr "$(conf_get IPV6_ENABLED)")"
  printf ',"opkg_new":%s,"cron":%s' "$(jstr "$_opkgnew")" "$(jbool $_cron)"
  printf ',"settings":{"auto_check":%s,"auto_upgrade":%s,"check_hour":%s,"port":%s}' \
    "$(jbool "$AUTO_CHECK")" "$(jbool "$AUTO_UPGRADE")" "${CHECK_HOUR:-4}" "${PORT:-8090}"
  printf '}\n'
}

interfaces_json() {
  printf '{"ok":true,"interfaces":['
  _first=1
  for _i in $(ip -o link show 2>/dev/null | awk -F': ' '{sub(/@.*/,"",$2); print $2}' | grep -vE '^(lo|ip6tnl|sit|gre|ifb|teql|tun|dummy)'); do
    [ $_first = 1 ] || printf ','
    _first=0
    _addr=$(ip -o -4 addr show dev "$_i" 2>/dev/null | awk '{print $4}' | head -n 1)
    printf '{"name":%s,"addr":%s}' "$(jstr "$_i")" "$(jstr "$_addr")"
  done
  _def=$(ip route 2>/dev/null | awk '/^default/{for(i=1;i<=NF;i++) if($i=="dev"){print $(i+1); exit}}')
  printf '],"default":%s}\n' "$(jstr "$_def")"
}

# ------------------------------------------------------------------- servis

service_action() { # start|stop|restart
  [ -x "$NFQ_INIT" ] || { echo "nfqws2 kurulu değil"; return 1; }
  "$NFQ_INIT" "$1" 2>&1
}

# ------------------------------------------------------------------ yedekler

backup_create() { # [etiket]
  [ -d "$NFQ_ETC" ] || { log "Yedeklenecek yapılandırma yok"; return 0; }
  mkdir -p "$BACKUP_DIR"
  _lbl=$(printf '%s' "${1:-manuel}" | tr -c 'A-Za-z0-9_-' '_' | cut -c1-24)
  _f="$BACKUP_DIR/z2p-$(date +%Y%m%d-%H%M%S)-$_lbl.tar.gz"
  # lua betikleri ikili sürüme bağlıdır; yedeğe yalnızca yapılandırma ve listeler girer
  # shellcheck disable=SC2046
  (cd "$R/etc" && tar -czf "$_f" $(find nfqws2 -maxdepth 1 -type f -name '*.conf*' 2>/dev/null) nfqws2/lists 2>/dev/null) || {
    rm -f "$_f"; log "Yedek alınamadı"; return 1; }
  log "Yedek alındı: $(basename "$_f")"
  # en fazla 20 yedek tut
  ls -1t "$BACKUP_DIR"/z2p-*.tar.gz 2>/dev/null | tail -n +21 | while read -r _o; do rm -f "$_o"; done
  return 0
}

backup_list_json() {
  printf '{"ok":true,"backups":['
  _first=1
  # shellcheck disable=SC2045
  for _f in $(ls -1t "$BACKUP_DIR"/z2p-*.tar.gz 2>/dev/null); do
    [ $_first = 1 ] || printf ','
    _first=0
    _sz=$(wc -c <"$_f" | tr -d ' ')
    printf '{"name":%s,"size":%s}' "$(jstr "$(basename "$_f")")" "$_sz"
  done
  printf ']}\n'
}

valid_backup_name() {
  printf '%s' "$1" | grep -qE '^z2p-[0-9]{8}-[0-9]{6}-[A-Za-z0-9_-]+\.tar\.gz$' && [ -f "$BACKUP_DIR/$1" ]
}

backup_restore() {
  valid_backup_name "$1" || { log "Geçersiz yedek: $1"; return 1; }
  _was=0; service_running && _was=1
  backup_create "geri-yukleme-oncesi"
  [ $_was = 1 ] && service_action stop
  # shellcheck disable=SC2046
  (cd "$R/etc" && tar -xzf "$BACKUP_DIR/$1") || { log "Yedek açılamadı"; return 1; }
  log "Geri yüklendi: $1"
  [ $_was = 1 ] && service_action start
  return 0
}

# -------------------------------------------------------------------- işler
# Uzun süren işlemler (kurulum, güncelleme) arka planda çalışır; arayüz günlüğü izler.

job_running() {
  [ -f "$JOB_DIR/pid" ] && kill -0 "$(cat "$JOB_DIR/pid")" 2>/dev/null
}

job_start() { # ad [arg]
  mkdir -p "$JOB_DIR"
  job_running && { echo "busy"; return 1; }
  rm -f "$JOB_DIR/rc" "$JOB_DIR/pid"
  echo "$1" >"$JOB_DIR/name"
  date +%s >"$JOB_DIR/started"
  _self="$SHARE/z2panel.sh"
  if have setsid; then
    setsid sh "$_self" _job "$1" "$2" >"$JOB_DIR/log" 2>&1 </dev/null &
  else
    nohup sh "$_self" _job "$1" "$2" >"$JOB_DIR/log" 2>&1 </dev/null &
  fi
  # pid dosyası iş tarafından yazılır; kısa bir süre bekle
  _n=0
  while [ ! -f "$JOB_DIR/pid" ] && [ ! -f "$JOB_DIR/rc" ] && [ $_n -lt 20 ]; do sleep 0.1 2>/dev/null || sleep 1; _n=$((_n + 1)); done
  return 0
}

job_status_json() {
  _r=0; job_running && _r=1
  _rc=$(cat "$JOB_DIR/rc" 2>/dev/null)
  printf '{"ok":true,"running":%s,"name":%s,"rc":%s,"log":%s}\n' \
    "$(jbool $_r)" "$(jstr "$(cat "$JOB_DIR/name" 2>/dev/null)")" "${_rc:-null}" \
    "$(jstr "$(tail -n 400 "$JOB_DIR/log" 2>/dev/null)")"
}

job_run() { # (arka plan süreci)
  mkdir -p "$JOB_DIR"
  echo $$ >"$JOB_DIR/pid"
  log "İşlem başladı: $1"
  _rc=0
  case "$1" in
    install) job_install || _rc=$? ;;
    upgrade) job_upgrade || _rc=$? ;;
    direct) job_direct "$2" || _rc=$? ;;
    rollback) job_rollback || _rc=$? ;;
    uninstall) job_uninstall || _rc=$? ;;
    panel_update) job_panel_update || _rc=$? ;;
    restore) backup_restore "$2" || _rc=$? ;;
    check) check_updates force; load_cache
           log "zapret2: ${LATEST_ZAPRET:-?}  nfqws2-keenetic: ${LATEST_PKG:-?}  panel: ${LATEST_PANEL:-?}" ;;
    *) log "Bilinmeyen işlem: $1"; _rc=2 ;;
  esac
  if [ $_rc = 0 ]; then log "Tamamlandı."; else log "Başarısız (kod $_rc)."; fi
  echo "$_rc" >"$JOB_DIR/rc"
  rm -f "$JOB_DIR/pid"
  return $_rc
}

need_entware() {
  have opkg || die "opkg bulunamadı. Önce Entware kurulmalı (help.keenetic.com: OPKG/Entware)."
}

job_install() {
  need_entware
  device_info; detect_arch
  log "Cihaz: ${MODEL:-?} ${HW_ID:+($HW_ID)}  KeeneticOS: ${FW:-?}  Mimari: $MACH -> depo: $REPO_ARCH"
  if ! kmods_ok; then
    warn "nfnetlink_queue çekirdek modülü bulunamadı."
    warn "Keenetic web arayüzü > Genel Ayarlar > Bileşenleri değiştir > 'Netfilter alt sistemi çekirdek modülleri' (Kernel modules for Netfilter) bileşenini kurun."
    warn "Bileşen kurulmadan nfqws2 çalışmaz; kurulum yine de devam ediyor."
  fi
  if opkg status nfqws-keenetic 2>/dev/null | grep -q '^Status:.*installed'; then
    log "Eski nfqws-keenetic bulundu, yedeklenip kaldırılıyor (nfqws2 ile çakışır)..."
    mkdir -p "$BACKUP_DIR"
    # shellcheck disable=SC2046
  (cd "$R/etc" && tar -czf "$BACKUP_DIR/eski-nfqws-$(date +%Y%m%d-%H%M%S).tar.gz" nfqws 2>/dev/null)
    opkg remove nfqws-keenetic-web nfqws-keenetic 2>&1 || true
  fi
  log "opkg update..."
  opkg update 2>&1 || die "opkg update başarısız. İnternet bağlantısını kontrol edin."
  log "Bağımlılıklar kuruluyor (ca-certificates, wget-ssl, curl)..."
  opkg install ca-certificates wget-ssl curl 2>&1 || warn "Bazı bağımlılıklar kurulamadı"
  opkg remove wget-nossl >/dev/null 2>&1 || true
  mkdir -p "$(dirname "$OPKG_REPO_CONF")"
  echo "src/gz nfqws2-keenetic $PKG_FEED/$REPO_ARCH" >"$OPKG_REPO_CONF"
  log "Depo eklendi: $PKG_FEED/$REPO_ARCH"
  opkg update 2>&1 || die "opkg update başarısız"
  log "nfqws2-keenetic kuruluyor..."
  opkg install "$PKG" 2>&1 || die "Paket kurulamadı"
  state_set DIRECT_TAG ""
  log "Kurulu paket: $(pkg_version)  nfqws2: $(bin_version)"
  if service_running; then log "Servis çalışıyor."; else warn "Servis çalışmıyor; Günlükler ve yapılandırmayı kontrol edin."; fi
  log "Not: Keenetic'te 'nfqws' adlı bir erişim politikası oluşturursanız yalnızca o politikadaki cihazlar işlenir."
}

job_upgrade() {
  need_entware
  opkg status "$PKG" 2>/dev/null | grep -q '^Status:.*installed' || die "$PKG kurulu değil. Önce kurulum yapın."
  _old=$(pkg_version)
  backup_create "paket-guncelleme-oncesi"
  log "opkg update..."
  opkg update 2>&1 || die "opkg update başarısız"
  if ! opkg list-upgradable 2>/dev/null | grep -q "^$PKG "; then
    log "$PKG zaten güncel ($_old)."
    return 0
  fi
  log "$PKG güncelleniyor..."
  opkg upgrade "$PKG" 2>&1 || die "Güncelleme başarısız"
  state_set DIRECT_TAG ""
  log "Sürüm: $_old -> $(pkg_version)  nfqws2: $(bin_version)"
  _new=$(cd "$NFQ_ETC" 2>/dev/null && find . -name '*-opkg' | sed 's#^\./##')
  if [ -n "$_new" ]; then
    warn "Yeni varsayılan yapılandırma dosyaları geldi (sizinkiler korundu):"
    printf '%s\n' "$_new" | sed 's/^/    /'
    warn "Panelde 'Dosyalar' bölümünden karşılaştırabilirsiniz."
  fi
  service_running || service_action start
  service_running && log "Servis çalışıyor." || warn "Servis çalışmıyor!"
}

# nfqws2 ikilisini ve lua betiklerini doğrudan bol-van/zapret2 sürümünden günceller.
job_direct() { # [tag]
  [ -x "$NFQ_BIN" ] || die "Önce nfqws2-keenetic paketini kurun (init betikleri ve yapılandırma paketle gelir)."
  detect_arch
  [ -n "$ZBIN" ] || die "Desteklenmeyen mimari: $(uname -m)"
  _tag="$1"
  if [ -z "$_tag" ]; then
    log "Son zapret2 sürümü sorgulanıyor..."
    _tag=$(gh_latest_tag "$ZAPRET_REPO")
  fi
  printf '%s' "$_tag" | grep -qE '^v[0-9][0-9A-Za-z._-]*$' || die "Geçersiz/alınamayan sürüm etiketi: '$_tag'"
  log "Hedef sürüm: $_tag  (ikili: $ZBIN)  Mevcut: $(bin_version)"

  _tmp="$R/tmp/z2p-direct"
  rm -rf "$_tmp"; mkdir -p "$_tmp"
  _base="https://github.com/$ZAPRET_REPO/releases/download/$_tag"
  _arc="zapret2-$_tag-openwrt-embedded.tar.gz"
  log "İndiriliyor: $_arc"
  fetch "$_base/$_arc" "$_tmp/z.tar.gz" || die "İndirme başarısız"
  fetch "$_base/sha256sum.txt" "$_tmp/sha256sum.txt" || warn "sha256sum.txt indirilemedi"
  log "Açılıyor..."
  tar -xzf "$_tmp/z.tar.gz" -C "$_tmp" || die "Arşiv açılamadı"
  _src="$_tmp/zapret2-$_tag"
  _nb="$_src/binaries/$ZBIN/nfqws2"
  [ -f "$_nb" ] || die "Arşivde $ZBIN/nfqws2 bulunamadı"

  if [ -s "$_tmp/sha256sum.txt" ]; then
    _exp=$(grep "binaries/$ZBIN/nfqws2\$" "$_tmp/sha256sum.txt" | head -n 1 | cut -d' ' -f1)
    _act=$(sha256 <"$_nb")
    if [ -n "$_exp" ] && [ "$_exp" = "$_act" ]; then
      log "SHA-256 doğrulandı."
    elif [ -n "$_exp" ]; then
      die "SHA-256 uyuşmuyor! beklenen=$_exp gelen=$_act"
    else
      warn "sha256sum.txt içinde kayıt yok, doğrulama atlandı"
    fi
  fi
  chmod +x "$_nb"
  "$_nb" --version >/dev/null 2>&1 || die "Yeni ikili bu cihazda çalışmıyor"
  log "Yeni ikili: $("$_nb" --version 2>&1 | head -n 1)"

  log "Geri alma noktası oluşturuluyor..."
  rm -rf "$ROLLBACK_DIR"; mkdir -p "$ROLLBACK_DIR"
  cp -p "$NFQ_BIN" "$ROLLBACK_DIR/nfqws2"
  [ -d "$NFQ_LUA" ] && cp -pR "$NFQ_LUA" "$ROLLBACK_DIR/lua"
  cp -p "$NFQ_CONF" "$ROLLBACK_DIR/nfqws2.conf"
  state_get DIRECT_TAG >"$ROLLBACK_DIR/direct_tag"
  backup_create "dogrudan-guncelleme-oncesi"

  _was=0; service_running && _was=1
  [ $_was = 1 ] && service_action stop

  cp "$_nb" "$NFQ_BIN.new" && chmod +x "$NFQ_BIN.new" && mv -f "$NFQ_BIN.new" "$NFQ_BIN" || die "İkili kopyalanamadı"
  # lua: mevcut dizin .gz kullanıyorsa sıkıştırılmış, değilse açık kopyala
  mkdir -p "$NFQ_LUA"
  _gz=0; ls "$NFQ_LUA"/*.lua.gz >/dev/null 2>&1 && _gz=1
  for _l in "$_src"/lua/*.lua.gz "$_src"/lua/*.lua; do
    [ -f "$_l" ] || continue
    _n=$(basename "$_l")
    case "$_n" in
      *.gz)
        _plain="${_n%.gz}"
        if [ $_gz = 1 ]; then cp "$_l" "$NFQ_LUA/$_n"; rm -f "$NFQ_LUA/$_plain"
        else gzip -dc "$_l" >"$NFQ_LUA/$_plain"; rm -f "$NFQ_LUA/$_n"; fi ;;
      *) cp "$_l" "$NFQ_LUA/$_n" ;;
    esac
  done
  log "Lua betikleri güncellendi."

  # Paket sürümündeki yamalı seçenek upstream ikilide yoksa yapılandırmadan çıkar
  if grep -q -- '--fastpath-workaround' "$NFQ_CONF" && ! "$NFQ_BIN" --help 2>&1 | grep -q 'fastpath-workaround'; then
    sed -i 's/--fastpath-workaround=[^ "]*[ ]*//' "$NFQ_CONF"
    warn "Bu upstream sürüm --fastpath-workaround desteklemiyor; seçenek yapılandırmadan kaldırıldı (yedek alındı)."
  fi

  state_set DIRECT_TAG "$_tag"
  rm -rf "$_tmp"

  if [ $_was = 1 ]; then
    service_action start
    sleep 2
    if ! service_running; then
      warn "Servis yeni sürümle başlamadı, otomatik geri alınıyor..."
      job_rollback
      return 1
    fi
    log "Servis yeni sürümle çalışıyor."
  fi
  log "nfqws2 artık: $(bin_version). Not: bir sonraki 'paket güncellemesi' bu ikiliyi paket sürümüyle değiştirir."
}

job_rollback() {
  [ -f "$ROLLBACK_DIR/nfqws2" ] || die "Geri alma noktası yok"
  _was=0; service_running && _was=1
  [ $_was = 1 ] && service_action stop
  cp -p "$ROLLBACK_DIR/nfqws2" "$NFQ_BIN"
  if [ -d "$ROLLBACK_DIR/lua" ]; then rm -rf "$NFQ_LUA"; cp -pR "$ROLLBACK_DIR/lua" "$NFQ_LUA"; fi
  [ -f "$ROLLBACK_DIR/nfqws2.conf" ] && cp -p "$ROLLBACK_DIR/nfqws2.conf" "$NFQ_CONF"
  state_set DIRECT_TAG "$(cat "$ROLLBACK_DIR/direct_tag" 2>/dev/null)"
  log "Geri alındı. nfqws2: $(bin_version)"
  [ $_was = 1 ] && service_action start
  return 0
}

job_uninstall() {
  need_entware
  backup_create "kaldirma-oncesi"
  service_action stop >/dev/null 2>&1
  opkg remove --autoremove "$PKG" 2>&1 || die "Kaldırılamadı"
  rm -rf "$ROLLBACK_DIR"
  state_set DIRECT_TAG ""
  log "nfqws2-keenetic kaldırıldı. Yedekler $BACKUP_DIR içinde duruyor."
}

job_panel_update() {
  _tmp="$R/tmp/z2p-panel"
  rm -rf "$_tmp"; mkdir -p "$_tmp"
  _url="https://codeload.github.com/$PANEL_REPO/tar.gz/$PANEL_REF"
  log "Panel indiriliyor: $PANEL_REPO@$PANEL_REF"
  fetch "$_url" "$_tmp/p.tar.gz" || die "İndirme başarısız"
  tar -xzf "$_tmp/p.tar.gz" -C "$_tmp" || die "Arşiv açılamadı"
  _inst=$(find "$_tmp" -path "*/$PANEL_SUBDIR/install.sh" | head -n 1)
  [ -f "$_inst" ] || die "install.sh bulunamadı"
  sh "$_inst" --update 2>&1 || die "Kurulum betiği başarısız"
  rm -rf "$_tmp"
}

# --------------------------------------------------------------------- cron

cron_apply() {
  [ -f "$CRONTAB" ] || return 1
  grep -v '# z2panel$' "$CRONTAB" >"$CRONTAB.z2p"
  if [ "$AUTO_CHECK" = 1 ]; then
    echo "17 ${CHECK_HOUR:-4} * * * root $R/bin/z2panel cron >/dev/null 2>&1 # z2panel" >>"$CRONTAB.z2p"
  fi
  cat "$CRONTAB.z2p" >"$CRONTAB"
  rm -f "$CRONTAB.z2p"
}

settings_save() { # auto_check auto_upgrade check_hour
  AUTO_CHECK=$1; AUTO_UPGRADE=$2; CHECK_HOUR=$3
  mkdir -p "$ETC"
  {
    grep -vE '^(AUTO_CHECK|AUTO_UPGRADE|CHECK_HOUR)=' "$PANEL_CONF" 2>/dev/null
    echo "AUTO_CHECK=$AUTO_CHECK"
    echo "AUTO_UPGRADE=$AUTO_UPGRADE"
    echo "CHECK_HOUR=$CHECK_HOUR"
  } >"$PANEL_CONF.tmp"
  mv "$PANEL_CONF.tmp" "$PANEL_CONF"
  cron_apply
}

cron_run() {
  check_updates force
  load_cache
  if pkg_update_available && [ "$AUTO_UPGRADE" = 1 ]; then
    job_running || job_start upgrade
  fi
}

# --------------------------------------------------------------- kimlik doğrulama

auth_is_set() { [ -s "$AUTH_FILE" ]; }

pw_hash() { # tuz parola
  _h=$(printf '%s%s' "$1" "$2" | sha256)
  _i=0
  while [ $_i -lt 64 ]; do _h=$(printf '%s%s' "$1" "$_h" | sha256); _i=$((_i + 1)); done
  printf '%s' "$_h"
}

pw_set() {
  mkdir -p "$ETC"
  _s=$(rand_hex 8)
  printf '%s:%s\n' "$_s" "$(pw_hash "$_s" "$1")" >"$AUTH_FILE.tmp"
  chmod 600 "$AUTH_FILE.tmp"
  mv "$AUTH_FILE.tmp" "$AUTH_FILE"
}

pw_check() {
  _line=$(head -n 1 "$AUTH_FILE" 2>/dev/null)
  _s=${_line%%:*}
  _h=${_line#*:}
  [ -n "$_s" ] && [ -n "$_h" ] && [ "$(pw_hash "$_s" "$1")" = "$_h" ]
}

sess_new() {
  mkdir -p "$SESS_DIR"; chmod 700 "$SESS_DIR"
  find "$SESS_DIR" -type f -mmin +$SESSION_TTL_MIN -exec rm -f {} \; 2>/dev/null
  _t=$(rand_hex 16)
  : >"$SESS_DIR/$_t"
  printf '%s' "$_t"
}

sess_valid() {
  printf '%s' "$1" | grep -qE '^[0-9a-f]{32}$' || return 1
  [ -f "$SESS_DIR/$1" ] || return 1
  if [ -n "$(find "$SESS_DIR/$1" -mmin +$SESSION_TTL_MIN 2>/dev/null)" ]; then
    rm -f "$SESS_DIR/$1"; return 1
  fi
  touch "$SESS_DIR/$1"
}

# --------------------------------------------------------------------- dosyalar

valid_fname() { printf '%s' "$1" | grep -qE '^[A-Za-z0-9_-][A-Za-z0-9._-]{0,63}$'; }

file_path() {
  valid_fname "$1" || return 1
  case "$1" in
    *.list|*.list-opkg|*.list-old) echo "$NFQ_LISTS/$1" ;;
    *.conf|*.conf-opkg|*.conf-old) echo "$NFQ_ETC/$1" ;;
    *) return 1 ;;
  esac
}

files_json() {
  printf '{"ok":true,"files":['
  _first=1
  for _f in "$NFQ_ETC"/*.conf "$NFQ_ETC"/*.conf-opkg "$NFQ_ETC"/*.conf-old "$NFQ_LISTS"/*.list "$NFQ_LISTS"/*.list-opkg "$NFQ_LISTS"/*.list-old; do
    [ -f "$_f" ] || continue
    [ $_first = 1 ] || printf ','
    _first=0
    _n=$(basename "$_f")
    _l=$(wc -l <"$_f" | tr -d ' ')
    printf '{"name":%s,"lines":%s}' "$(jstr "$_n")" "$_l"
  done
  printf ']}\n'
}

log_path() {
  case "$1" in
    nfqws2.log) echo "$R/var/log/nfqws2.log" ;;
    nfqws2-debug.log) echo "$R/var/log/nfqws2-debug.log" ;;
    job.log) echo "$JOB_DIR/log" ;;
    syslog) echo "syslog" ;;
    *) return 1 ;;
  esac
}

# ---------------------------------------------------------------------- CGI

qs() { printf '%s' "$QUERY_STRING" | tr '&' '\n' | sed -n "s/^$1=//p" | head -n 1; }

http_json() {
  printf 'Content-Type: application/json; charset=utf-8\r\nCache-Control: no-store\r\n'
  [ -n "$1" ] && printf '%s\r\n' "$1"
  printf '\r\n'
}
reply() { http_json "$2"; printf '%s\n' "$1"; exit 0; }
fail() { http_json "${2:-}"; printf '{"ok":false,"error":%s}\n' "$(jstr "$1")"; exit 0; }
denied() { printf 'Status: %s\r\nContent-Type: application/json\r\n\r\n{"ok":false,"error":%s}\n' "$1" "$(jstr "$2")"; exit 0; }
ok_out() { reply "$(printf '{"ok":%s,"output":%s}' "$(jbool "$1")" "$(jstr "$2")")"; }

cookie_token() {
  printf '%s' "$HTTP_COOKIE" | tr ';' '\n' | sed -n 's/^ *z2p=\([0-9a-f]*\).*$/\1/p' | head -n 1
}

cgi_main() {
  umask 077
  mkdir -p "$VAR" "$SESS_DIR"
  BODY="$VAR/body.$$"
  trap 'rm -f "$BODY"' EXIT
  : >"$BODY"
  _len=${CONTENT_LENGTH:-0}
  case "$_len" in ''|*[!0-9]*) _len=0 ;; esac
  [ "$_len" -gt 4194304 ] && denied "413 Payload Too Large" "İstek çok büyük"
  [ "$_len" -gt 0 ] && head -c "$_len" >"$BODY"

  A=$(qs a)
  M=$REQUEST_METHOD

  # İndirme dışındaki tüm çağrılar POST + özel başlık (CSRF koruması)
  if [ "$A" != backup_download ]; then
    [ "$M" = POST ] || denied "405 Method Not Allowed" "POST gerekli"
    [ "$HTTP_X_Z2P" = 1 ] || denied "403 Forbidden" "Geçersiz istek"
  fi

  TOKEN=$(cookie_token)
  AUTHED=0
  sess_valid "$TOKEN" && AUTHED=1

  case "$A" in
    auth_state)
      reply "$(printf '{"ok":true,"setup":%s,"auth":%s,"version":%s}' "$(jbool "$(auth_is_set && echo 0 || echo 1)")" "$(jbool $AUTHED)" "$(jstr "$(panel_version)")")" ;;
    setup)
      auth_is_set && fail "Parola zaten belirlenmiş"
      _pw=$(cat "$BODY")
      [ ${#_pw} -ge 6 ] || fail "Parola en az 6 karakter olmalı"
      pw_set "$_pw"
      _t=$(sess_new)
      reply '{"ok":true}' "Set-Cookie: z2p=$_t; Path=/; HttpOnly; SameSite=Strict" ;;
    login)
      auth_is_set || fail "Önce parola belirleyin"
      if pw_check "$(cat "$BODY")"; then
        _t=$(sess_new)
        reply '{"ok":true}' "Set-Cookie: z2p=$_t; Path=/; HttpOnly; SameSite=Strict"
      fi
      sleep 2
      fail "Parola hatalı" ;;
  esac

  [ $AUTHED = 1 ] || denied "401 Unauthorized" "Oturum gerekli"

  case "$A" in
    logout)
      rm -f "$SESS_DIR/$TOKEN"
      reply '{"ok":true}' "Set-Cookie: z2p=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict" ;;
    passwd)
      _old=$(sed -n 1p "$BODY"); _new=$(sed -n 2p "$BODY")
      pw_check "$_old" || { sleep 2; fail "Mevcut parola hatalı"; }
      [ ${#_new} -ge 6 ] || fail "Yeni parola en az 6 karakter olmalı"
      pw_set "$_new"
      rm -f "$SESS_DIR"/*
      _t=$(sess_new)
      reply '{"ok":true}' "Set-Cookie: z2p=$_t; Path=/; HttpOnly; SameSite=Strict" ;;
    status)
      reply "$(status_json)" ;;
    interfaces)
      reply "$(interfaces_json)" ;;
    service)
      _c=$(qs c)
      case "$_c" in start|stop|restart) ;; *) fail "Geçersiz komut" ;; esac
      _o=$(service_action "$_c"); _rc=$?
      sleep 1
      ok_out "$([ $_rc = 0 ] && echo 1 || echo 0)" "$_o" ;;
    job_start)
      _j=$(qs j); _arg=$(qs arg)
      case "$_j" in
        install|upgrade|rollback|uninstall|panel_update|check) _arg="" ;;
        direct) [ -z "$_arg" ] || printf '%s' "$_arg" | grep -qE '^v[0-9][0-9A-Za-z._-]*$' || fail "Geçersiz sürüm etiketi" ;;
        restore) valid_backup_name "$_arg" || fail "Geçersiz yedek" ;;
        *) fail "Geçersiz işlem" ;;
      esac
      job_start "$_j" "$_arg" >/dev/null || fail "Başka bir işlem sürüyor"
      reply '{"ok":true}' ;;
    job_status)
      reply "$(job_status_json)" ;;
    files)
      reply "$(files_json)" ;;
    file_get)
      _p=$(file_path "$(qs f)") || fail "Geçersiz dosya"
      [ -f "$_p" ] || fail "Dosya yok"
      printf 'Content-Type: text/plain; charset=utf-8\r\nCache-Control: no-store\r\n\r\n'
      cat "$_p"; exit 0 ;;
    file_save)
      _f=$(qs f)
      _p=$(file_path "$_f") || fail "Geçersiz dosya adı (.conf veya .list olmalı)"
      mkdir -p "$(dirname "$_p")"
      tr -d '\r' <"$BODY" >"$_p.z2p"
      [ -s "$_p.z2p" ] && [ "$(tail -c 1 "$_p.z2p" | od -An -c | tr -d ' ')" != '\n' ] && echo >>"$_p.z2p"
      case "$_f" in
        *.conf)
          if ! _e=$(sh -n "$_p.z2p" 2>&1); then rm -f "$_p.z2p"; fail "Sözdizimi hatası, kaydedilmedi: $_e"; fi ;;
      esac
      [ -f "$_p" ] && cp -p "$_p" "$_p-old" 2>/dev/null
      mv -f "$_p.z2p" "$_p" || fail "Kaydedilemedi"
      chmod 644 "$_p"
      if [ "$(qs restart)" = 1 ] && [ -x "$NFQ_INIT" ]; then
        _o=$(service_action restart)
        ok_out 1 "$_o"
      fi
      reply '{"ok":true}' ;;
    file_delete)
      _f=$(qs f)
      case "$_f" in
        nfqws2.conf|user.list|exclude.list|auto.list|ipset.list|ipset_exclude.list) fail "Ana dosyalar silinemez" ;;
      esac
      _p=$(file_path "$_f") || fail "Geçersiz dosya"
      rm -f "$_p" && reply '{"ok":true}' ;;
    log_get)
      _p=$(log_path "$(qs f)") || fail "Geçersiz günlük"
      printf 'Content-Type: text/plain; charset=utf-8\r\nCache-Control: no-store\r\n\r\n'
      if [ "$_p" = syslog ]; then
        ndmc_cli "show log" | grep -i 'nfqws' | tail -n 300
      elif [ -f "$_p" ]; then
        tail -n 500 "$_p"
      fi
      exit 0 ;;
    log_clear)
      _p=$(log_path "$(qs f)") || fail "Geçersiz günlük"
      [ -f "$_p" ] && : >"$_p"
      reply '{"ok":true}' ;;
    quick_save)
      [ -f "$NFQ_CONF" ] || fail "Yapılandırma dosyası yok"
      _mode=$(qs mode); _if=$(qs iface); _v6=$(qs ipv6)
      case "$_mode" in auto) _mv='$MODE_AUTO' ;; list) _mv='$MODE_LIST' ;; all) _mv='$MODE_ALL' ;; '') _mv='' ;; *) fail "Geçersiz mod" ;; esac
      printf '%s' "$_if" | grep -qE '^[A-Za-z0-9._+-]*$' || fail "Geçersiz arayüz"
      _if=$(printf '%s' "$_if" | tr '+' ' ')
      case "$_v6" in 0|1|'') ;; *) fail "Geçersiz IPv6 değeri" ;; esac
      cp -p "$NFQ_CONF" "$NFQ_CONF-old"
      [ -n "$_mv" ] && sed -i "s/^NFQWS_EXTRA_ARGS=.*/NFQWS_EXTRA_ARGS=\"$_mv\"/" "$NFQ_CONF"
      [ -n "$_if" ] && sed -i "s/^ISP_INTERFACE=.*/ISP_INTERFACE=\"$_if\"/" "$NFQ_CONF"
      [ -n "$_v6" ] && sed -i "s/^IPV6_ENABLED=.*/IPV6_ENABLED=$_v6/" "$NFQ_CONF"
      _o=""
      service_running && _o=$(service_action restart)
      ok_out 1 "$_o" ;;
    backups)
      reply "$(backup_list_json)" ;;
    backup_create)
      _o=$(backup_create "$(qs label)")
      ok_out 1 "$_o" ;;
    backup_delete)
      _b=$(qs b)
      valid_backup_name "$_b" || fail "Geçersiz yedek"
      rm -f "$BACKUP_DIR/$_b"
      reply '{"ok":true}' ;;
    backup_download)
      _b=$(qs b)
      valid_backup_name "$_b" || denied "404 Not Found" "Yedek yok"
      printf 'Content-Type: application/gzip\r\nContent-Disposition: attachment; filename="%s"\r\n\r\n' "$_b"
      cat "$BACKUP_DIR/$_b"; exit 0 ;;
    settings_save)
      _ac=$(qs auto_check); _au=$(qs auto_upgrade); _h=$(qs hour)
      case "$_ac$_au" in [01][01]) ;; *) fail "Geçersiz değer" ;; esac
      printf '%s' "$_h" | grep -qE '^([0-9]|1[0-9]|2[0-3])$' || fail "Saat 0-23 olmalı"
      settings_save "$_ac" "$_au" "$_h"
      if [ -f "$CRONTAB" ]; then reply '{"ok":true,"cron":true}'
      else reply '{"ok":true,"cron":false}'; fi ;;
    *)
      fail "Bilinmeyen işlem" ;;
  esac
}

# ---------------------------------------------------------------------- CLI

cli_main() {
  _cmd="$1"; shift 2>/dev/null
  case "$_cmd" in
    _job) job_run "$@" ;;
    status) status_json ;;
    check)
      check_updates force; load_cache
      echo "zapret2 (son):          ${LATEST_ZAPRET:-?}"
      echo "nfqws2-keenetic (son):  ${LATEST_PKG:-?}  kurulu: $(pkg_version)"
      echo "nfqws2 ikilisi:         $(bin_version)"
      echo "panel (son):            ${LATEST_PANEL:-?}  kurulu: $(panel_version)" ;;
    install|upgrade|rollback|uninstall|panel_update) job_run "$_cmd" ;;
    direct) job_run direct "$1" ;;
    backup) backup_create "$1" ;;
    restore) backup_restore "$1" ;;
    cron) cron_run ;;
    cron-apply) cron_apply || echo "Uyarı: $CRONTAB yok (opkg install cron)" ;;
    passwd)
      printf 'Yeni panel parolası: '
      stty -echo 2>/dev/null; read -r _p; stty echo 2>/dev/null; echo
      [ ${#_p} -ge 6 ] || die "En az 6 karakter"
      pw_set "$_p"; rm -f "$SESS_DIR"/* 2>/dev/null; echo "Parola güncellendi." ;;
    version|-v) panel_version ;;
    *)
      sed -n '2,15p' "$SHARE/z2panel.sh" 2>/dev/null | sed 's/^# \{0,1\}//' ;;
  esac
}

[ "${Z2P_LIB:-0}" = 1 ] || cli_main "$@"
