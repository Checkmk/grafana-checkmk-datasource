/*
 * Grafana requires these methods:
 *
 * query(options)           // used by panels to get data
 * testDatasource()         // used by datasource configuration page to make sure the connection is working
 * metricFindQuery(options) // used by query editor to get metric suggestions.
 * annotationQuery(options) // used by dashboards to get annotations (optional)
 */


//TODO: remove hardcoded site and hostname
const SITE = 'cmk';
const HOSTNAME = '192.168.1.11';

//TODO: move utilities
const buildUrlWithParams = (url, params) => url + Object.keys(params)
    .reduce((string, param) => `${string}${string ? '&' : '?'}${param}=${params[param]}`, '');

const buildRequestBody = (data) => `request=${JSON.stringify(data)}`;

const parseMetricResponse = (data) => {
    return Object.keys(data)
        .map((key) => Object.keys(data[key].metrics)
            //TODO: make this map to correct graph_index
            .map((metric, metricIndex) => ({text: data[key].metrics[metric].title, value: `${SITE}:${HOSTNAME}:${key}:${metricIndex}`}))
        )
        .reduce((all, items) => all.concat(items), []);
};

export class GenericDatasource {
    // backendSrv, templateSrv are injected - do not rename
    constructor(instanceSettings, $q, backendSrv, templateSrv) {
        this.type = instanceSettings.type;
        this.name = instanceSettings.name;
        this.q = $q;
        this.backendSrv = backendSrv;
        this.templateSrv = templateSrv;

        this.url = buildUrlWithParams(instanceSettings.jsonData.url, {
            _username: instanceSettings.jsonData.username,
            _secret: instanceSettings.jsonData.secret,
            output_format: 'json'
        });

        this.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    }

    query(options) {
        //TODO: correct multi target handling
        const [site, host_name, service_description, graph_index] = options.targets[0].target.split(':');

        const data = buildRequestBody({
            specification: [
                'template',
                {
                    service_description,
                    site,
                    graph_index: +graph_index,
                    host_name
                }
            ],
            data_range: {
                time_range: [
                    options.range.from.unix(),
                    options.range.to.unix()
                ]
            }
        });

        return this.doRequest({
            url: `${this.url}&action=get_graph`,
            data,
            method: 'POST'
        })
            .then((response) => {
                const datapoints = response.data.result.curves[0].rrddata
                    .map((d, i) => {
                        return [d, (response.data.result.start_time + i * response.data.result.step) * 1000];
                    })
                    .filter((f) => f[0]);

                const res = {
                    target: response.data.result.curves[0].title,
                    datapoints
                };

                response.data = [res];

                return response;
            });
    }

    testDatasource() {
        return this.doRequest({
            url: `${this.url}&action=get_all_hosts`,
            method: 'GET',
        }).then((response) => {
            if(response.status !== 200) {
                return {
                    status: 'error',
                    message: 'Could not connect to provided URL',
                    title: 'Error'
                };
            } else if (!response.data.result) {
                return {
                    status: 'error',
                    message: response.data,
                    title: 'Error'
                };
            } else {
                return {
                    status: 'success',
                    message: 'Data source is working',
                    title: 'Success'
                };
            }
        });
    }

    metricFindQuery(/* query */) {
        const data = {hostname: HOSTNAME};

        return this.doRequest({
            url: `${this.url}&action=get_metrics_of_host`,
            data: buildRequestBody(data),
            method: 'POST',
        })
            .then((response) => {
                return parseMetricResponse(response.data.result);
            });
    }

    doRequest(options) {
        options.headers = this.headers;
        return this.backendSrv.datasourceRequest(options);
    }
}
