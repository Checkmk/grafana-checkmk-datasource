# Checkmk's Grafana Data Source Plugin

![CI](https://github.com/tribe29/grafana-checkmk-datasource/actions/workflows/node.js.yml/badge.svg)

This data-source plugin is a complete rewrite from the previous connector. It has
undergone a new architectural design and is not backwards compatible to the
previous version. We nevertheless provide an upgrade procedure to assist you on
the transition. 

This project has entered the Beta testing phase.

## Requirements

- Checkmk >= 2.0.0p20
- Grafana >= 8.0

This plugin release accompanies the Checkmk 2.1 release. You can use it already
with Checkmk 2.0.0p20 for testing purposes, however bug-fixes, changes and
updates  will mainly take place on Checkmk 2.1 to not compromise the stability
of Checkmk 2.0.

## Getting started
### Installation

Download the released version of this repository or clone it. Released versions
include the built artifacts, for non-releases you need to build the plugin
yourself as explained further on this guide.

This plugin's id is: `tribe-29-checkmk-datasource`
For development it is easiest to create a symlink inside your Grafana plugins
path(`/var/lib/grafana/plugins`) to this repository. Or if using docker mount
this repository as a volume.

This plugin is not signed, thus you need to allow it on the `grafana.ini` file under
`allow_loading_unsigned_plugins=tribe-29-checkmk-datasource`

Beware that starting Grafana>=8.2 the systemd start script changed permissions
and you need to make sure this plugin is readable under those conditions. [Issue
#52](https://github.com/tribe29/grafana-checkmk-datasource/issues/52#issuecomment-1026917446)
includes troubleshooting information.


### Plugin configuration
URL
: URL of the Checkmk Server used.
: Example: http://checkmk.server/site/

Edition
: Your checkmk edition
: The connector will validate against the checkmk server your selection.

Username
: User for API calls.
: Don't use `automation`, because that user has also admin configuration rights.
  Use a dedicated user that has only monitoring permissions.

Secret
: Secret for the API User.
: This key is not transmitted from the Grafana UI, only the back-end has access
  to it. This is a security improvement over the previous plugin.

Save & Test will check if the User authenticates and the data source is
reachable.

## Current state

- CEE configuration is now a filter based selection of graph templates of single metric.
- RAW configuration offers Service graphs and some single metrics.

- Dropped "Label Format" option. Prefer Grafana overrides.
- Annotations are not available.

### Combined graphs

- Construct combined graphs using traditional Checkmk filters. Currently available:
  - Site filter
  - Host exact match
  - Host regex
  - Service exact match
  - Service Regex
  - Host labels multi select
  - Host groups
  - Service groups
  - Host Tags

### Minor annoyances

- When selecting a Filter. The focus jumps to the next Filter dropdown menu
  instead of the more intuitive focus on the selected filter itself.
- Composed single metrics are not available anymore. E.g. from the Filesystem
  service "Free space" is a composed metric being the difference between "Total
  Size" and "Used Space".

## Updating from the previous connector

We provide a Python script `utils/converter.py` which updates the Grafana
SQLite database from the old connector setup to the new one. In that process it
will go over all the dashboards and create a new version of them with the
updated connector. PLEASE BACKUP THIS FILE BEFORE UPDATING.

1. Install and configure this new connector. Take note of the name you give it
   and take note of which name you gave the old connector. In this example we call them "Latest cmk connector" and "checkmk".
2. Stop your Grafana instance and backup the file `grafana.db`
3. Use the `converter.py` script, it has a `-h` option to remind you of the
   usage. To update from the previous datasource "checkmk" into this new
   connector "Latest cmk connector" on the `grafana.db` file, execute:

```BASH
python3  converter.py -o "checkmk" -n "Latest cmk connector" -db grafana.db
```

If any of the two datasources is your default datasource, omit that option on
the command.

This script will go over all your dashboards, it might take some time because it
also queries information from your checkmk site, and that communication takes
time.

4. After the update completes start your Grafana server again.

### Building the plugin

1. Install dependencies

```BASH
yarn install
```

2. Build plugin in development mode or run in watch mode

```BASH
yarn dev
```

or

```BASH
yarn watch
```

3. Build plugin in production mode

```BASH
yarn build
```

