#!/bin/sh
# Z2Panel CGI testleri: sahte bir Entware kökü kurar ve api.cgi'yi busybox sh ile çağırır.
# Kullanım: sh tests/run-tests.sh   (busybox gerekli)
set -u
HERE=$(cd "$(dirname "$0")/.." && pwd)
SH="${TEST_SH:-busybox sh}"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
R="$T/opt"
export Z2P_ROOT="$R"
FAILS=0
PASS=0

ok() { PASS=$((PASS + 1)); }
bad() { FAILS=$((FAILS + 1)); echo "FAIL: $*"; }
expect() { # açıklama  beklenen-alt-dizgi  çıktı
  case "$3" in *"$2"*) ok ;; *) bad "$1 — beklenen '$2', gelen: $(printf '%s' "$3" | head -c 400)" ;; esac
}

. "$HERE/tests/fakeroot.sh"
make_fakeroot

# --- CGI çağırıcı
COOKIE=""
cgi() { # action [query-ek] [gövde] [yöntem] [x-header]
  _b="${3:-}"
  printf '%s' "$_b" >"$T/body"
  env REQUEST_METHOD="${4:-POST}" QUERY_STRING="a=$1${2:+&$2}" CONTENT_LENGTH="$(wc -c <"$T/body" | tr -d ' ')" \
    HTTP_X_Z2P="${5-1}" HTTP_COOKIE="$COOKIE" Z2P_ROOT="$R" \
    $SH "$R/share/www/z2panel/api.cgi" <"$T/body"
}
body() { sed '1,/^\r*$/d'; }
json_ok() { printf '%s' "$1" | body | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; }

# --- kimlik doğrulama
o=$(cgi auth_state)
expect "auth_state setup" '"setup":true' "$o"
expect "content-type" 'Content-Type: application/json' "$o"
o=$(cgi status)
expect "oturumsuz status reddedilir" '401' "$o"
o=$(cgi auth_state "" "" GET)
expect "GET reddedilir" '405' "$o"
o=$(cgi auth_state "" "" POST "")
expect "X-Z2P başlığı zorunlu" '403' "$o"
o=$(cgi setup "" "123")
expect "kısa parola" 'en az 6' "$o"
o=$(cgi setup "" "gizli-parola")
expect "setup" '"ok":true' "$o"
expect "setup cookie" 'Set-Cookie: z2p=' "$o"
o=$(cgi setup "" "baska-parola")
expect "ikinci setup reddedilir" 'zaten' "$o"
o=$(cgi login "" "yanlis-parola")
expect "yanlış parola" 'hatalı' "$o"
o=$(cgi login "" "gizli-parola")
expect "login" '"ok":true' "$o"
COOKIE="z2p=$(printf '%s' "$o" | sed -n 's/^Set-Cookie: z2p=\([0-9a-f]*\);.*/\1/p')"
[ ${#COOKIE} -eq 36 ] && ok || bad "çerez alınamadı: $COOKIE"

# --- durum
o=$(cgi status)
json_ok "$o" && ok || bad "status geçerli JSON değil: $o"
expect "pkg_version" '"pkg_version":"1.3.0"' "$o"
expect "bin_version" '"bin_version":"v1.0.5.2"' "$o"
expect "mode" '"mode":"auto"' "$o"
expect "iface" '"isp_interface":"eth3"' "$o"
expect "running false" '"running":false' "$o"

# --- servis
o=$(cgi service "c=start")
expect "servis başlat" 'Started NFQWS2' "$o"
o=$(cgi status)
expect "running true" '"running":true' "$o"
o=$(cgi service "c=rm")
expect "geçersiz servis komutu" 'Geçersiz' "$o"

# --- dosyalar
o=$(cgi files)
json_ok "$o" && ok || bad "files JSON: $o"
expect "files listesi" '"name":"user.list"' "$o"
o=$(cgi file_get "f=user.list")
expect "file_get" 'discord.com' "$o"
o=$(cgi file_get "f=../../etc/passwd")
expect "yol geçişi engellenir" 'Geçersiz dosya' "$o"
o=$(cgi file_get "f=passwd")
expect "uzantısız dosya engellenir" 'Geçersiz dosya' "$o"
o=$(cgi file_save "f=user.list" "$(printf 'discord.com\r\ndiscord.gg')")
expect "file_save" '"ok":true' "$o"
[ "$(cat "$R/etc/nfqws2/lists/user.list")" = "$(printf 'discord.com\ndiscord.gg')" ] && ok || bad "CRLF normalizasyonu"
[ -f "$R/etc/nfqws2/lists/user.list-old" ] && ok || bad "-old yedeği yok"
o=$(cgi file_save "f=nfqws2.conf" 'NFQWS_ARGS="--a
ISP_INTERFACE=x"y"')
expect "bozuk conf reddedilir" 'Sözdizimi' "$o"
grep -q 'ISP_INTERFACE="eth3"' "$R/etc/nfqws2/nfqws2.conf" && ok || bad "bozuk conf yazıldı"
o=$(cgi file_save "f=ozel.list" "youtube.com")
expect "yeni liste" '"ok":true' "$o"
o=$(cgi file_delete "f=user.list")
expect "ana dosya silinemez" 'silinemez' "$o"
o=$(cgi file_delete "f=ozel.list")
expect "liste sil" '"ok":true' "$o"

# --- hızlı ayarlar
o=$(cgi quick_save "mode=list&iface=ppp0&ipv6=0")
expect "quick_save" '"ok":true' "$o"
grep -q '^NFQWS_EXTRA_ARGS="\$MODE_LIST"$' "$R/etc/nfqws2/nfqws2.conf" && ok || bad "mod yazılmadı"
grep -q '^ISP_INTERFACE="ppp0"$' "$R/etc/nfqws2/nfqws2.conf" && ok || bad "arayüz yazılmadı"
grep -q '^IPV6_ENABLED=0$' "$R/etc/nfqws2/nfqws2.conf" && ok || bad "ipv6 yazılmadı"
o=$(cgi quick_save "iface=eth3+nwg1")
grep -q '^ISP_INTERFACE="eth3 nwg1"$' "$R/etc/nfqws2/nfqws2.conf" && ok || bad "çoklu arayüz"
o=$(cgi quick_save "iface=a;rm")
expect "arayüz enjeksiyonu engellenir" 'Geçersiz' "$o"

# --- yedekler
o=$(cgi backup_create "label=test")
expect "yedek" 'Yedek alındı' "$o"
o=$(cgi backups)
json_ok "$o" && ok || bad "backups JSON"
B=$(printf '%s' "$o" | grep -o 'z2p-[0-9-]*-test\.tar\.gz' | head -n 1)
[ -n "$B" ] && ok || bad "yedek listede yok"
o=$(cgi backup_download "b=$B" "" GET "")
expect "yedek indirme" 'Content-Disposition: attachment' "$o"
o=$(cgi backup_download "b=../auth" "" GET "")
expect "yedek indirme yol geçişi" '404' "$o"
echo "silinecek.com" >"$R/etc/nfqws2/lists/user.list"
o=$(cgi job_start "j=restore&arg=$B")
expect "restore başlat" '"ok":true' "$o"
i=0; while [ ! -f "$R/var/z2panel/job/rc" ] && [ $i -lt 50 ]; do sleep 0.2; i=$((i + 1)); done
grep -q 'discord.gg' "$R/etc/nfqws2/lists/user.list" && ok || bad "geri yükleme çalışmadı"

# --- işler
o=$(cgi job_start "j=upgrade")
expect "upgrade başlat" '"ok":true' "$o"
i=0; while [ ! -f "$R/var/z2panel/job/rc" ] && [ $i -lt 50 ]; do sleep 0.2; i=$((i + 1)); done
o=$(cgi job_status)
json_ok "$o" && ok || bad "job_status JSON: $o"
expect "upgrade günlüğü" 'nfqws2-keenetic güncelleniyor' "$o"
expect "upgrade rc" '"rc":0' "$o"
o=$(cgi job_start "j=direct&arg=v1;reboot")
expect "direct etiket doğrulaması" 'Geçersiz' "$o"
o=$(cgi job_start "j=evil")
expect "bilinmeyen iş" 'Geçersiz' "$o"
o=$(cgi job_start "j=rollback")
i=0; while [ ! -f "$R/var/z2panel/job/rc" ] && [ $i -lt 50 ]; do sleep 0.2; i=$((i + 1)); done
o=$(cgi job_status)
expect "geri alma noktası yok" 'Geri alma noktası yok' "$o"

# --- doğrudan zapret2 güncellemesi (sahte sürüm arşivi + sahte curl)
REL="$T/rel"; ZB=$(uname -m | sed 's/aarch64/arm64/; s/x86_64/x86_64/')
mkdir -p "$REL/zapret2-v9.9.9/binaries/linux-$ZB" "$REL/zapret2-v9.9.9/lua"
cat >"$REL/zapret2-v9.9.9/binaries/linux-$ZB/nfqws2" <<'EOF2'
#!/bin/sh
case "$1" in --version) echo "github version v9.9.9 (abc) lua_compat_ver 6" ;; --help) echo " --lua-init" ;; esac
EOF2
chmod +x "$REL/zapret2-v9.9.9/binaries/linux-$ZB/nfqws2"
echo 'print(9)' | gzip -c >"$REL/zapret2-v9.9.9/lua/zapret-lib.lua.gz"
(cd "$REL" && tar -czf asset.tar.gz zapret2-v9.9.9 && find zapret2-v9.9.9/binaries -type f -exec sha256sum {} \; | sed 's#  #  ./#' >sha256sum.txt)
cat >"$R/bin/curl" <<EOF2
#!/bin/sh
out=-; for a; do [ "\$prev" = -o ] && out="\$a"; prev="\$a"; url="\$a"; done
case "\$url" in
  *openwrt-embedded.tar.gz) src="$REL/asset.tar.gz" ;;
  *sha256sum.txt) src="$REL/sha256sum.txt" ;;
  *releases/latest) printf '{\n  "tag_name": "v9.9.9",\n  "name": "x"\n}\n'; exit 0 ;;
  *) exit 22 ;;
esac
if [ "\$out" = - ]; then cat "\$src"; else cp "\$src" "\$out"; fi
EOF2
chmod +x "$R/bin/curl"
cgi service "c=start" >/dev/null
waitjob() { i=0; while [ ! -f "$R/var/z2panel/job/rc" ] && [ $i -lt 100 ]; do sleep 0.2; i=$((i + 1)); done; }
o=$(cgi job_start "j=direct"); waitjob
o=$(cgi job_status)
expect "direct rc" '"rc":0' "$o"
expect "direct sha" 'SHA-256 doğrulandı' "$o"
expect "direct fastpath" 'fastpath-workaround desteklemiyor' "$o"
"$R/usr/bin/nfqws2" --version | grep -q v9.9.9 && ok || bad "ikili değişmedi"
grep -q fastpath "$R/etc/nfqws2/nfqws2.conf" && bad "fastpath kaldırılmadı" || ok
[ "$(gzip -dc "$R/etc/nfqws2/lua/zapret-lib.lua.gz")" = 'print(9)' ] && ok || bad "lua güncellenmedi"
o=$(cgi status)
expect "direct_tag" '"direct_tag":"v9.9.9"' "$o"
expect "rollback var" '"rollback":true' "$o"
o=$(cgi job_start "j=rollback"); waitjob
"$R/usr/bin/nfqws2" --version | grep -q v1.0.5.2 && ok || bad "geri alma ikiliyi geri yüklemedi"
grep -q fastpath "$R/etc/nfqws2/nfqws2.conf" && ok || bad "geri alma conf'u geri yüklemedi"
[ "$(gzip -dc "$R/etc/nfqws2/lua/zapret-lib.lua.gz")" = 'print(1)' ] && ok || bad "geri alma lua"
# bozuk sha -> reddedilmeli
sed -i 's/^[0-9a-f]\{4\}/0000/' "$REL/sha256sum.txt"
o=$(cgi job_start "j=direct&arg=v9.9.9"); waitjob
o=$(cgi job_status)
expect "sha uyuşmazlığı" 'SHA-256 uyuşmuyor' "$o"
"$R/usr/bin/nfqws2" --version | grep -q v1.0.5.2 && ok || bad "sha hatasında ikili değişti"
# güncelleme denetimi
o=$(cgi job_start "j=check"); waitjob
o=$(cgi status)
expect "latest zapret" '"zapret":"v9.9.9"' "$o"

# --- ayarlar / cron
o=$(cgi settings_save "auto_check=1&auto_upgrade=0&hour=5")
expect "settings" '"cron":true' "$o"
grep -q '^17 5 \* \* \* root .*z2panel cron .*# z2panel$' "$R/etc/crontab" && ok || bad "cron satırı yok"
grep -q 'run-parts' "$R/etc/crontab" && ok || bad "crontab bozuldu"
o=$(cgi settings_save "auto_check=0&auto_upgrade=0&hour=5")
grep -q 'z2panel' "$R/etc/crontab" && bad "cron satırı kaldırılmadı" || ok
o=$(cgi settings_save "auto_check=1&auto_upgrade=0&hour=25")
expect "saat doğrulaması" '0-23' "$o"

# --- günlük
echo "auto: test.example eklendi" >"$R/var/log/nfqws2.log"
o=$(cgi log_get "f=nfqws2.log")
expect "log_get" 'test.example' "$o"
o=$(cgi log_get "f=/etc/shadow")
expect "log yol geçişi" 'Geçersiz' "$o"

# --- sürüm karşılaştırma
v() { Z2P_LIB=1 $SH -c ". '$R/share/z2panel/z2panel.sh'; ver_gt '$1' '$2' && echo gt || echo le"; }
[ "$(v v1.0.10 v1.0.9)" = gt ] && ok || bad "ver_gt 1.0.10 > 1.0.9"
[ "$(v 1.3.1 1.3.1)" = le ] && ok || bad "ver_gt eşit"
[ "$(v v1.0.5.2 1.0.5)" = gt ] && ok || bad "ver_gt 4 parça"

# --- parola değiştirme ve çıkış
o=$(cgi passwd "" "$(printf 'yanlis\nyeni-parola')")
expect "passwd yanlış eski" 'hatalı' "$o"
o=$(cgi passwd "" "$(printf 'gizli-parola\nyeni-parola')")
expect "passwd" '"ok":true' "$o"
COOKIE="z2p=$(printf '%s' "$o" | sed -n 's/^Set-Cookie: z2p=\([0-9a-f]*\);.*/\1/p')"
o=$(cgi logout)
expect "logout" 'Max-Age=0' "$o"
o=$(cgi status)
expect "çıkıştan sonra 401" '401' "$o"

echo "Geçen: $PASS  Başarısız: $FAILS"
[ $FAILS = 0 ]
