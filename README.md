# Checkmk Datasource
This is a Grafana datasource for Checkmk metrics.

## Requirements
Minimal Checkmk Version of the Checkmk Enterprise Edition or Checkmk Managed Services Edition is `1.6.0p2`. 
Minimal Checkmk Version of the Checkmk Raw Edition is `2.0.0`. 

## Plugin Configuration
#### URL:
URL of the Checkmk Server used.\
Example: http://checkmk.server/site/

#### Username:
User to be used for API calls. In most cases this will be 'automation'.

#### Secret:
Secret for the API User. Save & Test will check if the User can be authenticated.

## Query Configuration

#### Mode
You can switch between modes for querying predefined graphs, single metrics or a combined graph where you can filter hosts and services by using a Regex.

#### Site
This will default to 'all sites', but can be overwritten by simply entering any site.

#### Label Format
The default label format '$title' can be changed to any static title or use the following placeholders: '$title', '$site', '$host', '$service'

#### Host Filter
You will be able to select a host from the automatically generated list. When using 'combined graph' mode you can also enter a regex to be applied.

#### Service Filter
You will be able to select a service from the automatically generated list. When using 'combined graph' mode you have to enter a regex as services between hosts can be different.

#### Tag Filter ('combined graph' only)
When using 'combined graph' mode you can also filter by Tags.

#### Metric ('single metric' only)
Only one series will be displayed.

#### Graph ('predefined graph' only)
One series might be displayed, depending on the selected graph

#### Aggregation ('combined graph' only)
You can choose between different aggregation types to combine the results of the chosen filters.


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
yarn run build
```
On building, the code will be automatically be linted, transpiled and moved to `dist/`.

### Development Setup
The following guideline can be used to setup a Checkmk & Grafana development environment.
It used docker to run Checkmk and grafana.

#### Setup Checkmk
Using image `checkmk/check-mk-enterprise:1.6.0p2`:\
`docker run -d -p 8080:50000 checkmk/check-mk-enterprise:1.6.0p2`\
Make sure to note the password for `cmkadmin`.

Next open the Checkmk GUI and login with the `cmkadmin` user.\
Add a host and discover some services, in order to be able to request some data later.\
You will also need to get the automation user credentials under `WATO > Users > automation`.

#### Setup Grafana
First checkout the grafana datasource repository to some local folder.\
Using image `grafana/grafana`:\
`docker run -d -p 3000:3000 -v /local/path/to/grafana-checkmk-datasource/dist:/var/lib/grafana/plugins/checkmk-datasource grafana/grafana`\
This will directly link the `dist/` folder into grafana, and a simple rebuild will update the plugin, as it is evaluated at grafana runtime.

Login to Grafana with `admin:admin` at `http://localhost:3000/`\
Configure the Checkmk datasource by using `http://localhost:8080/cmk/` as URL, and the automation user for authentication.

Add a Dashboard and configure your first graph using Checkmk as datasource.



For more grafana specific information please refer to https://grafana.com/docs/plugins/developing/datasources/
