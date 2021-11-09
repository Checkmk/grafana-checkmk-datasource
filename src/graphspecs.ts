import { get } from 'lodash';
import { Context, MyQuery } from './types';
export const buildRequestBody = (data: any) => `request=${JSON.stringify(data)}`;

type GraphSpec = [string, any];

export function graphDefinitionRequest(query: MyQuery, range: number[]): string {
  return buildRequestBody({
    specification: graphSpecification(query),
    data_range: {
      time_range: range,
    },
  });
}

function graphSpecification(query: MyQuery): GraphSpec {
  if (query.params.graphMode === 'template') {
    return graphTemplateSpecification(query);
  } else if (query.params.graphMode === 'metric') {
    return singleMetricGraphSpecification(query);
  } else if (query.params.graphMode === 'combined') {
    return combinedGraphSpecification(query);
  }
  throw new Error('Unknown graph mode');
}

export function extractSingleInfos(context: Context) {
  return {
    site: get(context, 'siteopt.site', ''),
    host_name: get(context, 'host.host', ''),
    service_description: get(context, 'service.service', ''),
  };
}

function graphTemplateSpecification({ params, context }: MyQuery): GraphSpec {
  return [
    'template',
    {
      ...extractSingleInfos(context || {}),
      graph_id: params.graph,
    },
  ];
}

function singleMetricGraphSpecification({ params, context }: MyQuery): GraphSpec {
  return [
    'single_timeseries',
    {
      ...extractSingleInfos(context || {}),
      metric: params.metric,
    },
  ];
}

export function combinedDesc(context: Context) {
  return {
    context: context,
    datasource: 'services',
    single_infos: ['host'],
  };
}

function combinedGraphSpecification({ params, context }: MyQuery): GraphSpec {
  let graph_name = params.graph_name;
  if (params.mode === 'metric') {
    graph_name = 'METRIC_' + graph_name;
  }
  return [
    'combined',
    { ...combinedDesc(context || {}), graph_template: graph_name, presentation: params.presentation },
  ];
}
