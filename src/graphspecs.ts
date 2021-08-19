import { MyQuery } from './types';
export const buildRequestBody = (data: any) => `request=${JSON.stringify(data)}`;

export function graphSpecification(query: MyQuery, range: number[]) {
  if (query.graphMode === 'graph') {
    return graphTemplateSpecification(query.params, range);
  } else if (query.graphMode === 'metric') {
    return singleMetricGraphSpecification(query.params, range);
  } else if (query.graphMode === 'combined') {
    return combinedGraphSpecification(query.params, range);
  }
  throw new Error('Unknown graph mode');
}

function graphTemplateSpecification(params: any, range: number[]) {
  return buildRequestBody({
    specification: [
      'template',
      {
        site: params.site_id || '',
        host_name: params.hostname,
        service_description: params.service,
        graph_index: params.graph_index,
      },
    ],
    data_range: {
      time_range: range,
    },
  });
}

function singleMetricGraphSpecification(params: any, range: number[]) {
  return buildRequestBody({
    specification: [
      'single_timeseries',
      {
        site: params.site_id || '',
        host: params.hostname,
        service: params.service,
        metric: params.metric,
      },
    ],
    data_range: {
      time_range: range,
    },
  });
}

function combinedGraphSpecification(params: any, range: number[]) {
  return buildRequestBody({
    specification: [
      'combined',
      {
        context: {
          siteopt: { site: params.site_id },
          hostregex: { host_regex: params.hostname },
          serviceregex: { service_regex: params.service },
        },
        datasource: 'services',
        presentation: params.presentation,
        graph_template: params.graph_name,
        single_infos: ['host'],
      },
    ],
    data_range: {
      time_range: range,
    },
  });
}
