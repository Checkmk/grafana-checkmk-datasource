import { MyQuery } from './types';
export const buildRequestBody = (data: any) => `request=${JSON.stringify(data)}`;

export function graphSpecification(query: MyQuery, range: number[]) {
  if (query.graphMode === 'graph') {
    return graphTemplateSpecification(query, range);
  } else if (query.graphMode === 'metric') {
    return singleMetricGraphSpecification(query, range);
  } else if (query.graphMode === 'combined') {
    return combinedGraphSpecification(query, range);
  }
  throw new Error('Unknown graph mode');
}

function graphTemplateSpecification(query: MyQuery, range: number[]) {
  const { params } = query;
  return buildRequestBody({
    specification: [
      'template',
      {
        site: params.site_id,
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

function singleMetricGraphSpecification(query: MyQuery, range: number[]) {
  const { params } = query;
  return buildRequestBody({
    specification: [
      'single_timeseries',
      {
        site: params.site_id,
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

function combinedGraphSpecification(query: MyQuery, range: number[]) {
  const { context, params } = query;
  return buildRequestBody({
    specification: [
      'combined',
      {
        context: context || {},
        datasource: 'services',
        presentation: params.presentation,
        graph_template: params.graph_name,
      },
    ],
    data_range: {
      time_range: range,
    },
  });
}
