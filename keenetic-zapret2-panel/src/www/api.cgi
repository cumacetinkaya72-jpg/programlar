#!/bin/sh
# Z2Panel CGI giriş noktası
# shellcheck disable=SC2034
Z2P_LIB=1
# shellcheck source=../share/z2panel.sh
. "${Z2P_ROOT:-/opt}/share/z2panel/z2panel.sh"
cgi_main
