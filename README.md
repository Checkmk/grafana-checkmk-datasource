# Checkmk Grafana Data Source Plugin

![CI](https://github.com/tribe29/grafana-checkmk-datasource/actions/workflows/node.js.yml/badge.svg)

This Data Source allows you to query checkmk metrics. It is a complete rewrite
of the previous connector to match newer grafana versions. This plugin is on
the alpha testing stage.

Due to the breaking changes in this plugin, it is a complete separate plugin. We
provide an update utility, although not all features from the previous connector
are available. Those are some single metrics and annotations.

This plugin id is: `tribe-29-grafana-checkmk-datasource`

## Requirements

You require checkmk nightly build from the master branch and 7.0<=Grafana<8.2

Since Grafana 8.2, plugins loaded diffently and the connector fails to load.
Please help us with your setup on Issue #52 for us to debug further. We know
that Grafana 8.3.4 on a docker container has worked for us, yet we don't yet
know why.

## Getting started

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

### Installing

For development it is easiest to create a symlink inside your grafana plugins
path(`/var/lib/grafana/plugins`) to this repository. Or if using docker mount
this repository as a volume.

This plugin is not yet signed, thus you need to allow it on the `grafana.ini` file under
`allow_loading_unsigned_plugins=tribe-29-grafana-checkmk-datasource`

Grafana will read the `dist` folder, this repository does not include the
builds. You need to follow previous section to prepare your own builds.

### Plugin configuration

#### URL:

URL of the Checkmk Server used.\
Example: http://checkmk.server/site/

#### Username:

User for API calls. Don't use `automation`, because that user has also
admin configuration rights. Use a dedicated user that can only monitor.

#### API Key:

Secret for the API User. This key is not transmitted from the grafana UI, only
the backend has access to it. This is a security improvement to the previous
plugin.

Save & Test will check if the User authenticates and the data source is
reachable.

## Current state

- Service graph works on RAW & CEE
- Single metric for the moment now works only on CEE
- Combined graphs remains CEE only
- Dropped "Label Format" option. Prefer Grafana overrrides.
- Annotations are not usable yet

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

We provide a Python script `utils/converter.py` which will update the Grafana
Sqlite database from the old connector setup to the new one. In that process it
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
the command. This script will go over all your dashboards, it might take some
time because it also queries information from your checkmk site, and that
communication takes time.

4. After the update completes start your Grafana server again.
