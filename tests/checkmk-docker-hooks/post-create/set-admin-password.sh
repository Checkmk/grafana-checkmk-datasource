#!/usr/bin/env bash
su - cmk -c "/usr/bin/env bash" << __EOF__
echo abskjfdalkdhjbld | cmk-passwd cmkadmin -i
echo "Admin password set"

omd stop
omd config set MKEVENTD off
omd start
echo "Event console disabled"

__EOF__