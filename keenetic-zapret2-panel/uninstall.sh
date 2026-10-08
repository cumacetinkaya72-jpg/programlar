#!/bin/sh
# Z2Panel'i kaldırır. nfqws2-keenetic paketine ve yapılandırmasına dokunmaz.
# Yedekleri de silmek için: sh uninstall.sh --purge
R=/opt
PATH="$R/sbin:$R/bin:$R/usr/sbin:$R/usr/bin:/usr/sbin:/usr/bin:/sbin:/bin"

rm -f "$R/etc/lighttpd/conf.d/85-z2panel.conf" "$R/bin/z2panel"
rm -rf "$R/share/www/z2panel" "$R/share/z2panel" "$R/etc/z2panel"
if [ -f "$R/etc/crontab" ]; then
  grep -v '# z2panel$' "$R/etc/crontab" >"$R/etc/crontab.z2p" && cat "$R/etc/crontab.z2p" >"$R/etc/crontab"
  rm -f "$R/etc/crontab.z2p"
fi
if [ "$1" = "--purge" ]; then
  rm -rf "$R/var/z2panel"
else
  rm -rf "$R/var/z2panel/sess" "$R/var/z2panel/job"
  echo "Yedekler korundu: $R/var/z2panel/backups"
fi
[ -x "$R/etc/init.d/S80lighttpd" ] && "$R/etc/init.d/S80lighttpd" restart >/dev/null 2>&1
echo "Z2Panel kaldırıldı."
