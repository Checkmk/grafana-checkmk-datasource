# Check_MK Datasource
This is a Grafana datasource for Check_MK metrics.

## Requirements
TODO: Check_MK Version requirements

## Plugin Configuration
#### URL:
URL of the Check_MK Server used.\
Example: http://checkmk.server/site/

#### Username:
User to be used for API calls. In most cases this will be 'automation'.

#### Secret:
Secret for the API User. Save & Test will check if the User can be authenticated.

## Query Configuration

#### Site
This will default to 'cmk', but can be overwritten by simply entering any site.

#### Host
After you set a site, you will be able to select a host from the automatically generated list.

#### Service
After you set a host, you will be able to select a service from the automatically generated list.

#### Mode
After you set a service, you can select to either use predefined graphs or query a specific metric.

#### Metric
In metric mode, only one series will be displayed.

###Graph
In graph mode more more than one series might be displayed, depending on the selected graph


## Plugin Development
This section is only relevant if you intend to modify this plugin.

#### Dependencies
In order to build this plugin you need npm and yarn installed on your machine.

#### Building
First install dependencies:
```
yarn install
```
Then execute a build:
```
npm run build
```
On building, the code will be automatically be linted, transpiled and moved to `dist/`.

You can directly link the `dist/` folder into a running grafana installation, as the plugin will be evaluated at grafana runtime.

For more grafana specific information please refer to https://grafana.com/docs/plugins/developing/datasources/
