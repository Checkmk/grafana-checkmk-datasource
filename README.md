# Checkmk Grafana Data Source Plugin 

![CI](https://github.com/tribe29/grafana-checkmk-datasource/actions/workflows/node.js.yml/badge.svg)


This Data Source allows you to query checkmk metrics. It is a complete rewrite
of the previous connector to match newer grafana versions.

Due to the breaking changes in this plugin, it is at the moment a complete
separate plugin. Later on we will provide with an update setup.

This plugin is still on the prototyping stage. Things will break or change
without any notice. Specially your configured panel can break as the internal
data-structure that stores them is still changing.

This plugin id is: `tribe-29-grafana-checkmk-datasource`

## Requirements
You require checkmk>=`2.0.0-2021.09.22`(but it was most tested on master) and Grafana>=7.0

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
path(`/val/lib/grafana/plugins`) to this repository. Or if using docker mount
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

## Current state of development

- Service graph works on RAW & CEE
- Single metric for the moment now works only on CEE
- Combined graphs remains CEE only
- Dropped "Label Format" option. Prefer Grafana overrrides.
- [ ] Annotations are not usable yet
### Combined graphs
- Construct combined graphs using traditional Checkmk filters. Currently available:
  - Site filter
  - Host exact match
  - Host regex
  - Service exact match
  - Service Regex
  - Host labels multi select
#### Minor annoyances
- Due to limitations of the Grafana UI Select components. Host, Service, Metric
  & Graph dropdowns do not trigger a search when opening the dropdown. You must
  type something to trigger the search. Pressing the arrow keys would not
  trigger. Either write your text or press the space bar to trigge an
  unconstrained search.
- Graph query only re triggers when selecting the graph recipe. That
  inconveniently means after changing aggregation you need to at least
  touch/select a "graph" to trigger the query for time series data.
- Changing any filters does not trigger a query. That can be changed in the
  future. For know please press the refresh icon on the top right of the graph
  to retrigger the query with all your changes applied.
- When selecting a Filter. The focus jumps to the next Filter dropdown menu
  instead of the more intuitive focus on the selected filter itself.

### Foreseen work under consideration
- Use of host tag, including builtin ones
- Add a filters for labels and hostgroups
- Don't reset/empty fields after a change, if old selections are compatible with
  change. E.g. Changing hostname should not remove Service "CPU load" if new
  host also has that service.
