# Changelog

[//]: # 'The ci will use the first section starting with `##` as release notes.'

## 3.0.0-beta.1

When using Checkmk < 2.2.0 you will have to choose the correct version in the
data source settings.

- Add support for REST API endpoints of Checkmk 2.2.0
- Many UI-improvements
- Graphs in Grafana now show the same colors as in Checkmk

## 2.0.3

- Provide better error message on wrong authentication.

## 2.0.2

- Removed `/dist` folder from git repository. That means that it's no longer
  possible to install this Grafana plugin by `git clone`. If you use `git pull`
  to update the plugin, you will have to change your deployment strategy of
  this plugin. Please refer to the [official documentation][1]
- FIX: After changing a "Hostname Regex", the graph was not automatically
  updated, but Grafanas "Refresh dashboard" button on the upper right had
  to be clicked. Now the graph should update automatically. In order to
  limit the load on the checkmk server, the update is delayed by 500ms for
  text fields.
  This also affects: Hostname regex, Service Regex, Host is in Group,
  Service is in Group

[1]: https://docs.checkmk.com/2.1.0/en/grafana.html

## 2.0.1

- README.md already states that at least Grafana 8.0.0 is required, now the
  plugin also reflects that version requirement.
- add missing logo file to dist folder

## 2.0.0

Checkmk's Grafana connector underwent a complete rewrite. This plugin release
accompanies checkmk 2.1, yet for testing purposes it will work with checkmk
2.0.0p20

An update script is available to migrate the configuration from the previous
connector to this new one. However, there are some backwards incompatible
changes and not all features are conserved.

We provide a Python script `utils/converter.py` in our [github project][github] which updates the Grafana
SQLite database from the old connector setup to the new one. In that process it
will go over all the dashboards and create a new version of them with the
updated connector. **PLEASE BACKUP THIS FILE BEFORE UPDATING.**

1. Install and configure this new connector. Take note of the name you give it
   and take note of which name you gave the old connector. In this example we
   call them "Latest cmk connector" and "checkmk".
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

[github]: https://github.com/tribe29/grafana-checkmk-datasource/

## 2.0.0b3

- Update dependencies
- Fix data source test on raw edition

## 2.0.0b2

- Update dependencies
- Filter METRIC\_ graph templates on CEE

## 2.0.0b1

- Complete rewrite from scratch
