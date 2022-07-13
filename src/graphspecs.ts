import { get } from 'lodash';
import { ContextHTTPVars, Context, MyQuery, Presentation } from './types';
export const buildRequestBody = (data: unknown): string => `request=${JSON.stringify(data)}`;

interface CombinedGraphSpec {
  graph_template: string;
  presentation: Presentation;
  context: Context;
  datasource: string;
  single_infos: string[];
}

interface TemplateGraphSpec {
  graph_id: string;
}

interface SingleInfos {
  site: string | ContextHTTPVars;
  host_name: string | ContextHTTPVars;
  service_description: string | ContextHTTPVars;
}

type GraphSpec = ['template', TemplateGraphSpec] | ['combined', CombinedGraphSpec];

export function graphDefinitionRequest(editionMode: string, query: MyQuery, range: number[]): string {
  return buildRequestBody({
    specification: graphSpecification(editionMode, query),
    data_range: {
      time_range: range,
    },
  });
}

function graphSpecification(editionMode: string, query: MyQuery): GraphSpec {
  if (editionMode === 'RAW') {
    return graphTemplateSpecification(query);
  } else if (editionMode === 'CEE') {
    return combinedGraphSpecification(query);
  }
  throw new Error('UNSUPORTED EDITION');
}

export function extractSingleInfos(context: Context): SingleInfos {
  return {
    site: get(context, 'siteopt.site', ''),
    host_name: get(context, 'host.host', ''),
    service_description: get(context, 'service.service', ''),
  };
}

function graphTemplateSpecification({ params, context }: MyQuery): GraphSpec {
  const graph_name = (params.graphMode === 'metric' ? 'METRIC_' : '') + params.graph_name;
  return [
    'template',
    {
      ...extractSingleInfos(context || {}),
      graph_id: graph_name,
    },
  ];
}

export function combinedDesc(context: Context): Omit<CombinedGraphSpec, 'graph_template' | 'presentation'> {
  return {
    context: context,
    datasource: 'services',
    single_infos: ['host'],
  };
}

function combinedGraphSpecification({ params, context }: MyQuery): GraphSpec {
  const graph_name = (params.graphMode === 'metric' ? 'METRIC_' : '') + params.graph_name;
  if (params.presentation == null) {
    throw new Error('params.presentation has to be not null');
  }
  return [
    'combined',
    { ...combinedDesc(context || {}), graph_template: graph_name, presentation: params.presentation },
  ];
}
