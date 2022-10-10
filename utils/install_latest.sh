#!/bin/bash

set -e
if ! command -v jq > /dev/null || ! command -v grafana-cli > /dev/null; then
  echo "ERROR: This script can not run without jq or grafana-cli binaries."
  exit 1
fi
DOWNLOAD_URL=$(wget -O- -q https://api.github.com/repos/tribe29/grafana-checkmk-datasource/releases/latest | jq -r ".assets[0].browser_download_url")
COMMAND="grafana-cli --pluginUrl ""$DOWNLOAD_URL"" plugins install tribe-29-checkmk-datasource"

# we have to make sure that the grafana-cli command is executed as grafana user
# see https://github.com/grafana/grafana/issues/25367
if [ "$(id -nu)" == "root" ]; then
  # cd is necessary, because grafana-cli will access `$PWD`. if executed as
  # root, `$PWD` may point to `/root` and the grafana user has no permissions
  # to access that.
  sudo -u grafana bash -c "cd; $COMMAND"
  exit 0
fi
if [ "$(id -nu)" == "grafana" ]; then
  $COMMAND
  exit 0
fi
echo "ERROR: This script hast to be executed as root or grafana user"
exit 1
