import { GraphType, NegatableOption, RequestSpec, TagValue } from './RequestSpec';
import { Context, Edition, Params } from './types';
import { aggregationToPresentation, createCmkContext, presentationToAggregation } from './utils';

export interface WebApiCurve {
  title: string;
  rrddata: Array<{
    i: number;
    d: Record<string, unknown>;
  }>;
}
export interface WebAPiGetGraphResult {
  start_time: number;
  end_time: number;
  step: number;
  curves: WebApiCurve[];
}

export interface WebApiResponse<Result> {
  result_code: number;
  result: Result;
  severity: string | undefined;
}

function transform_negated(
  context_property: Record<string, string | undefined> | undefined,
  key_name: string
): NegatableOption | undefined {
  if (context_property === undefined) {
    return undefined;
  }
  return {
    value: context_property[key_name] || '',
    negated: context_property[`neg_${key_name}`] === 'on',
  };
}

function graphModeToGraphType(graph_mode: 'template' | 'metric'): GraphType {
  if (graph_mode === 'template') {
    return 'predefined_graph';
  }
  if (graph_mode === 'metric') {
    return 'single_metric';
  }
  throw Error(`graph_mode ${graph_mode} is not known`);
}

export function requestSpecFromLegacy(context: Context, params: Params): Partial<RequestSpec> {
  const rs: Partial<RequestSpec> = {};
  if (context.host !== undefined) {
    rs.host_name = context.host.host;
  }

  if (context.siteopt !== undefined) {
    rs.site = context.siteopt.site;
  }

  rs.host_name_regex = transform_negated(context.hostregex, 'host_regex');

  if (context.service !== undefined) {
    rs.service = context.service.service;
  }

  rs.service_regex = transform_negated(context.serviceregex, 'service_regex');

  rs.host_in_group = transform_negated(context.opthostgroup, 'opthost_group');
  rs.service_in_group = transform_negated(context.optservicegroup, 'optservice_group');

  if (context.host_labels !== undefined) {
    const host_labels = JSON.parse(context.host_labels.host_label);
    rs.host_labels = host_labels.map((v: { value: string }) => v['value']);
  }

  if (context.host_tags !== undefined) {
    const result: [TagValue, TagValue, TagValue] = [{}, {}, {}];
    const numbers: Array<0 | 1 | 2> = [0, 1, 2];
    for (const i of numbers) {
      const group = context.host_tags[`host_tag_${i}_grp`];
      const operator = context.host_tags[`host_tag_${i}_op`];
      const tag = context.host_tags[`host_tag_${i}_val`];
      if (group !== undefined && operator !== undefined && tag !== undefined) {
        result[i] = { group, operator, tag };
      }
    }
    rs.host_tags = result;
  }

  rs.graph_type = graphModeToGraphType(params.graphMode);
  if (rs.graph_type === 'single_metric') {
    rs.graph = params.graph_name;
  } else {
    rs.graph = params.graph_name; // TODO: make this happen!
  }
  rs.aggregation = presentationToAggregation(params.presentation);
  return rs;
}

export function createWebApiRequestSpecification(
  requestSpec: Partial<RequestSpec>,
  edition: Edition
): [string, Record<string, unknown>] {
  if (edition === 'RAW') {
    const specification: Record<string, unknown> = {};
    if (requestSpec.graph_type === 'single_metric') {
      specification.graph_id = 'METRIC_' + requestSpec.graph;
    } else {
      specification.graph_name = requestSpec.graph;
    }
    return [
      'template',
      {
        site: requestSpec.site,
        host_name: requestSpec.host_name,
        service_description: requestSpec.service,
        ...specification,
      },
    ];
  }
  const context = createCmkContext(requestSpec);
  let graph_template: string | undefined = undefined;
  if (requestSpec.graph && requestSpec.graph !== '') {
    if (requestSpec.graph_type === 'single_metric') {
      graph_template = 'METRIC_' + requestSpec.graph;
    } else {
      graph_template = requestSpec.graph;
    }
  }

  if (requestSpec.aggregation === undefined) {
    throw new Error('web api: aggregation not defined!');
  }

  return [
    'combined',
    {
      context: context,
      datasource: 'services',
      single_infos: ['host'],
      graph_template: graph_template,
      presentation: aggregationToPresentation(requestSpec.aggregation),
    },
  ];
}

export const buildUrlWithParams = (url: string, params: Record<string, string>): string =>
  url + '?' + new URLSearchParams(params).toString();
export const buildRequestBody = (data: unknown): string => `request=${JSON.stringify(data)}`;

export function createWebApiRequestBody(context: [string, Record<string, unknown>], timeRange: number[]) {
  return {
    specification: context,
    data_range: { time_range: timeRange },
  };
}
