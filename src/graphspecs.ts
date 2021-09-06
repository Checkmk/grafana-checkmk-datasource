import { get } from 'lodash';
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
  const { params, context } = query;
  return buildRequestBody({
    specification: [
      'template',
      {
        site: get(context, 'siteopt.site', ''),
        host_name: get(context, 'host.host', ''),
        service_description: get(context, 'service.service', ''),
        graph_index: params.graph_index,
      },
    ],
    data_range: {
      time_range: range,
    },
  });
}

function singleMetricGraphSpecification(query: MyQuery, range: number[]) {
  const { params, context } = query;
  return buildRequestBody({
    specification: [
      'single_timeseries',
      {
        site: get(context, 'siteopt.site', ''),
        host: get(context, 'host.host', ''),
        service: get(context, 'service.service', ''),
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
