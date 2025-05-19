#!/usr/bin/env bash
# This script runs while the site is still stopped

su - cmk -c "/usr/bin/env bash" << __EOF__
echo abskjfdalkdhjbld | cmk-passwd cmkadmin -i
echo "Admin password set"

omd config set MKEVENTD off
omd config set AGENT_RECEIVER off
omd config set LIVEPROXYD off
echo "Event console, liveproxy, and trace disabled"
__EOF__