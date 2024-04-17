# Changelog

[//]: # 'The ci will use the first section starting with `##` as release notes.'

## 3.3.0
- Support for new autocomplete endpoints
- Rebranding of Checkmk commercial products 


## 3.2.2
- Support for Checkmk Managed Edition
- Align defaults for datasource settings
**If you use checkmk raw edition and a provisioned datasource or created
the datasource with an very old version of this plugin** you have to take
manual action. See commit message [b6aa9b](https://github.com/Checkmk/grafana-checkmk-datasource/commit/b6aa99bff9dc4ab522d0b4eecd826dd694fcd606 "b6aa9b")
- Clarify error message on 404 on REST-API request

## 3.2.1

- Dropped support for Grafana prior 9.5.15

## 3.2.0

- Dropped support for Grafana prior 9.0.0
- At custom label field:
    - Filter values can be used as variables
- Bugfix: Remove decimals from time periods as Checkmk does not support sub-second accuracy
- Datasource configuration:
    - Mention feature degratadtion for older versions of Checkmk
    - Display an error message on edition mismatch
    - Update non-RAW editions name

## 3.1.1

- update dependencies

## 3.1.0

- added support for query variables
- better error message for missing mandatory fields

## 3.0.1

- We now build and ship a signed version of this plugin:
    - The signed plugin "Checkmk data source for Checkmk Cloud Edition" will
      only talk to the Cloud Edition of checkmk
    - the plugin id is `checkmk-cloud-datasource`, so dashboards created with
      the unsigned data source (id=`tribe-29-checkmk-datasource`) needs to be
      recreated. We will try to provide a script to automatically transfer
      existing dashboards in the near future.
    - The unsigned plugin (id=`tribe-29-checkmk-datasource`) will continue to
      work and will still be maintained.
- Adapted the build process of the plugin to use `@grafana/create-plugin`
- "tribe29 GmbH" is now "Checkmk GmbH"

## 3.0.0

### Highlights

- Add support for REST API endpoints of Checkmk 2.2.0
- Many UI improvements:
    - Clearer layout for both the RAW and CEE Query Editor
    - RAW filters are now displayed vertically aligned
    - The filter type of existing filters can no longer be changed, they have
      to be removed, and another filter can be added.
    - Errors in the Query Editor Fields are more prominently featured in the
      inputs themselves
- Graphs in Grafana now show the same color as in Checkmk

### (Breaking) Changes

* When using Checkmk < 2.2.0 you will have to choose the correct version in the
  data source settings, as this defaults to ">= 2.2"
* Graph Types have been renamed, existing configuration is not affect by this.
    * "Template" Graphs are now called "Predefined Graphs"
    * "Metric" Graphs are now called "Single Metric"


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

[github]: https://github.com/checkmk/grafana-checkmk-datasource/

## 2.0.0b3

- Update dependencies
- Fix data source test on raw edition

## 2.0.0b2

- Update dependencies
- Filter METRIC\_ graph templates on CEE

## 2.0.0b1

- Complete rewrite from scratch
