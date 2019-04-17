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

#### Metric
After you set a service, you will be able to select a metric from the automatically generated list. A metric might contain more than one series.