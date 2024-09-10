#!/usr/bin/env bash
su - cmk -c "/usr/bin/env bash" << __EOF__
echo abskjfdalkdhjbld | cmk-passwd cmkadmin -i
echo "Admin password set"

omd stop
omd config set MKEVENTD off
omd config set AGENT_RECEIVER off
omd config set LIVEPROXYD off
omd config set TRACE_SEND off
omd config set TRACE_RECEIVE off
omd start
echo "Event console, agent receiver, liveproxy, and trace disabled"
__EOF__