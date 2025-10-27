#!/usr/bin/env bash
# This script runs when the site is running

su - cmk -c "/usr/bin/env bash" << __EOF__

# Watch for new rrd files and fill them with random data
python3 -m pip install watchdog
export GRRD_FORK=1
python3 -u /docker-entrypoint.d/post-start/generate_random_rrd_data.py

# Wait until Checkmk API responds our requests
until curl -f -s -u cmkadmin:abskjfdalkdhjbld http://127.0.0.1:5000/cmk/check_mk/api/1.0/version
do
    echo Wait until Checkmk API is ready...
    sleep 5
done

# Create hosts, discover services, and create automation user
python3 -u /docker-entrypoint.d/post-start/post-configure-checkmk.py
__EOF__
