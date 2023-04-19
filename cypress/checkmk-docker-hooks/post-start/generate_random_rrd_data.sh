#!/usr/bin/env bash

su - cmk -c "/usr/bin/env bash" << __EOF__
python3 -m pip install watchdog
export GRRD_FORK=1
python3 -u /docker-entrypoint.d/post-start/generate_random_rrd_data.py
__EOF__
