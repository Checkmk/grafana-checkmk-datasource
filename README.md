# Check_MK Datasource
This is a Grafana datasource for Check_MK metrics.

## Requirements
Minimal Check_MK Version is `1.5.0p16`. The Grafana datsource requires the Checkmk Enterprise Edition or Checkmk Managed Services Edition.

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

#### Graph
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

### Development Setup
The following guideline can be used to setup a Check_MK & Grafana development environment.
It used docker to run Check_MK and grafana.

#### Setup Check_MK
Using image `checkmk/check-mk-enterprise:1.5.0p16`:\
`docker run -d -p 8080:50000 checkmk/check-mk-enterprise:1.5.0p16`\
Make sure to note the password for `cmkadmin`.

Next open the Check_MK GUI and login with the `cmkadmin` user.\
Add a host and discover some services, in order to be able to request some data later.\
You will also need to get the automation user credentials under `WATO > Users > automation`.

#### Setup Grafana
First checkout the grafana datasource repository to some local folder.\
Using image `grafana/grafana`:\
`docker run -d -p 3000:3000 -v /local/path/to/grafana-checkmk-datasource/dist:/var/lib/grafana/plugins/checkmk-datasource grafana/grafana`\
This will directly link the `dist/` folder into grafana, and a simple rebuild will update the plugin, as it is evaluated at grafana runtime.

Login to Grafana with `admin:admin` at `http://localhost:3000/`\
Configure the Check_MK datasource by using `http://localhost:8080/cmk/` as URL, and the automation user for authentication.

Add a Dashboard and configure your first graph using Check_MK as datasource.



For more grafana specific information please refer to https://grafana.com/docs/plugins/developing/datasources/
