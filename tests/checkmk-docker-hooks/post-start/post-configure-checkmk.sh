#!/usr/bin/env bash
# This script runs when the site is running

su - cmk -c "/usr/bin/env bash" << __EOF__

# Watch for new rrd files and fill them with random data
python3 -m pip install watchdog
export GRRD_FORK=1
python3 -u /docker-entrypoint.d/post-start/generate_random_rrd_data.py

# Create hosts, discover services, and create automation user
python3 -u /docker-entrypoint.d/post-start/post-configure-checkmk.py
__EOF__
