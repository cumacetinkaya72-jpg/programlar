#!/bin/sh
# Paneli sahte bir Entware köküyle yerelde çalıştırır (lighttpd + busybox gerekli).
# Kullanım: sh tests/dev-server.sh [port]   ->  http://127.0.0.1:8090
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
PORT="${1:-8090}"
T="${DEV_ROOT:-/tmp/z2panel-dev}"
R="$T/opt"
rm -rf "$T"; mkdir -p "$T"
. "$HERE/tests/fakeroot.sh"
make_fakeroot
cat >"$T/cgi-sh" <<EOS
#!/bin/sh
Z2P_ROOT="$R" exec busybox sh "\$@"
EOS
chmod +x "$T/cgi-sh"
cat >"$T/lighttpd.conf" <<EOS
server.modules = ( "mod_cgi" )
server.port = $PORT
server.bind = "127.0.0.1"
server.document-root = "$R/share/www/z2panel"
index-file.names = ( "index.html" )
mimetype.assign = ( ".html" => "text/html; charset=utf-8", ".css" => "text/css", ".js" => "text/javascript" )
cgi.assign = ( ".cgi" => "$T/cgi-sh" )
static-file.exclude-extensions = ( ".cgi" )
EOS
echo "http://127.0.0.1:$PORT  (kök: $R)"
exec lighttpd -D -f "$T/lighttpd.conf"
