#!/bin/sh
# Testler ve geliştirme sunucusu için sahte Entware kökü ($R altında) oluşturur.
# shellcheck disable=SC2154
make_fakeroot() {
mkdir -p "$R/share/z2panel" "$R/share/www/z2panel" "$R/etc/nfqws2/lists" "$R/etc/nfqws2/lua" \
  "$R/usr/bin" "$R/bin" "$R/etc/init.d" "$R/var/log" "$R/tmp"
cp "$HERE/src/share/z2panel.sh" "$HERE/VERSION" "$R/share/z2panel/"
cp "$HERE"/src/www/* "$R/share/www/z2panel/"
cat >"$R/etc/nfqws2/nfqws2.conf" <<'EOF'
ISP_INTERFACE="eth3"
NFQWS_BASE_ARGS="--fastpath-workaround=auto
                 --lua-init=@/opt/etc/nfqws2/lua/zapret-lib.lua"
MODE_LIST="--hostlist=/opt/etc/nfqws2/lists/user.list"
NFQWS_EXTRA_ARGS="$MODE_AUTO"
IPV6_ENABLED=1
EOF
echo "discord.com" >"$R/etc/nfqws2/lists/user.list"
: >"$R/etc/nfqws2/lists/exclude.list"
echo 'print(1)' | gzip -c >"$R/etc/nfqws2/lua/zapret-lib.lua.gz"
cat >"$R/usr/bin/nfqws2" <<'EOF'
#!/bin/sh
case "$1" in
  --version) echo "github version v1.0.5.2 (6b6c63e) lua_compat_ver 5" ;;
  --help) echo " --fastpath-workaround=0|1|auto" ;;
esac
EOF
cat >"$R/etc/init.d/S51nfqws2" <<EOF
#!/bin/sh
S="$R/tmp/svc"
case "\$1" in
  start) echo run >"\$S"; echo 'Started NFQWS2 service' ;;
  stop) rm -f "\$S"; echo 'Stopping NFQWS2 service...' ;;
  restart) echo run >"\$S"; echo 'Started NFQWS2 service' ;;
  status) [ -f "\$S" ] && echo 'Service NFQWS2 is running' || echo 'Service NFQWS2 is stopped' ;;
esac
EOF
cat >"$R/bin/opkg" <<'EOF'
#!/bin/sh
case "$1" in
  status) [ "$2" = nfqws2-keenetic ] && printf 'Package: nfqws2-keenetic\nVersion: 1.3.0\nStatus: install user installed\n' ;;
  update) echo "Updated list of available packages" ;;
  list-upgradable) echo "nfqws2-keenetic - 1.3.0 - 1.3.1" ;;
  upgrade) echo "Upgrading nfqws2-keenetic on root from 1.3.0 to 1.3.1..." ;;
esac
EOF
chmod +x "$R/usr/bin/nfqws2" "$R/etc/init.d/S51nfqws2" "$R/bin/opkg"
printf 'SHELL=/bin/sh\n*/1 * * * * root /opt/bin/run-parts /opt/etc/cron.1min\n' >"$R/etc/crontab"
}
