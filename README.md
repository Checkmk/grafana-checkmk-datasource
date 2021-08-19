# Checkmk Grafana Data Source Plugin 

This Data Source allows you to query checkmk metrics. It is a complete rewrite
of the previous connector to match newer grafana versions.

Due to the breaking changes in this plugin, it is at the moment a complete
separate plugin. Later on we will provide with an update setup.

This plugin id is: `tribe-29-grafana-checkmk-datasource`

## Requirements
You require checkmk>=`2.0.0` and Grafana>=7.0

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
- At the moment only a minimal interface is possible. There is only Host regex,
  service regex fields.
- Graph query only re triggers when selecting the graph recipe. That
  inconveniently means after changing aggregation you need to at least
  touch/select a "graph" to trigger the query for time series data.

### Foreseen work under consideration
- Use of host tag, including builtin ones
- Add a filters for labels and hostgroups
- Don't reset/empty fields after a change, if old selections are compatible with
  change. E.g. Changing hostname should not remove Service "CPU load" if new
  host also has that service.
