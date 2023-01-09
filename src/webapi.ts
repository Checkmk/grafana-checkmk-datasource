import { isUndefined } from 'lodash';

import { NegatableOption, RequestSpec, TagValue } from './RequestSpec';
import { CmkQuery, Context, Edition, Params } from './types';

export interface WebAPiGetGraphResult {
  start_time: number;
  end_time: number;
  step: number;
  curves: Array<{
    title: string;
    rrddata: Array<{
      i: number;
      d: Record<string, unknown>;
    }>;
  }>;
}

export interface WebApiResponse<Result> {
  result_code: number;
  result: Result;
  severity: string | undefined;
}

export function updateQuery(query: CmkQuery): void {
  // convert legacy query (context/params) to new requestSpec interface
  if (query.context !== undefined && query.params !== undefined) {
    // we need to replace the object in place, in order to remove the context
    // and params properties, otherwise both requestSpec and context/params are defined.
    query.requestSpec = requestSpecFromLegacy(query.context, query.params);
    delete query.context;
    delete query.params;
  }
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

export function requestSpecFromLegacy(context: Context, params: Params): RequestSpec {
  const rs: RequestSpec = {};
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

  rs.graph_type = params.graphMode;
  if (rs.graph_type === 'metric') {
    rs.graph = params.graph_name;
  } else {
    rs.graph = params.graph_name; // TODO: make this happen!
  }
  rs.aggregation = params.presentation;
  return rs;
}

export function createCmkContext(requestSpec: RequestSpec): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  if (!isUndefined(requestSpec.site)) {
    context['siteopt'] = { site: requestSpec.site };
  }
  if (!isUndefined(requestSpec.host_name)) {
    context['host'] = { host: requestSpec.host_name };
  }
  if (!isUndefined(requestSpec.service)) {
    context['service'] = { service: requestSpec.service };
  }
  if (!isUndefined(requestSpec.host_labels) && requestSpec.host_labels.length !== 0) {
    context['host_labels'] = {
      host_label: JSON.stringify(
        requestSpec.host_labels.map((v: string) => {
          return {
            value: v,
          };
        })
      ),
    };
  }

  if (!isUndefined(requestSpec.service_in_group) && requestSpec.service_in_group.value !== '') {
    // TODO: code is 90% c&p and already contained some c&p bugs, we should try to use functions here!
    const optservicegroup: Record<string, unknown> = { optservice_group: requestSpec.service_in_group.value };
    if (requestSpec.service_in_group.negated) {
      optservicegroup['neg_optservice_group'] = 'on';
    }
    context['optservicegroup'] = optservicegroup;
  }
  if (!isUndefined(requestSpec.host_name_regex) && requestSpec.host_name_regex.value !== '') {
    const hostregex: Record<string, unknown> = { host_regex: requestSpec.host_name_regex.value };
    if (requestSpec.host_name_regex.negated) {
      hostregex['neg_host_regex'] = 'on';
    }
    context['hostregex'] = hostregex;
  }
  if (!isUndefined(requestSpec.host_in_group) && requestSpec.host_in_group.value !== '') {
    const opthostgroup: Record<string, unknown> = { opthost_group: requestSpec.host_in_group.value };
    if (requestSpec.host_in_group.negated) {
      opthostgroup['neg_opthost_group'] = 'on';
    }
    context['opthostgroup'] = opthostgroup;
  }
  if (!isUndefined(requestSpec.service_regex) && requestSpec.service_regex.value !== '') {
    const serviceregex: Record<string, unknown> = { service_regex: requestSpec.service_regex.value };
    if (requestSpec.service_regex.negated) {
      serviceregex['neg_service_regex'] = 'on';
    }
    context['serviceregex'] = serviceregex;
  }

  if (!isUndefined(requestSpec.host_tags) && requestSpec.host_tags.length > 0) {
    const tags: Record<string, string | undefined> = {};
    requestSpec.host_tags.forEach(({ group, tag, operator }, index) => {
      if (tag === undefined && group === undefined && operator === undefined) {
        return;
      }
      tags[`host_tag_${index}_grp`] = group;
      tags[`host_tag_${index}_val`] = tag;
      tags[`host_tag_${index}_op`] = operator;
    });
    context['host_tags'] = tags;
  }

  return context;
}

export function createWebApiRequestSpecification(
  requestSpec: RequestSpec,
  edition: Edition
): [string, Record<string, unknown>] {
  if (edition === 'RAW') {
    const specification: Record<string, unknown> = {};
    if (requestSpec.graph_type === 'metric') {
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
    if (requestSpec.graph_type === 'metric') {
      graph_template = 'METRIC_' + requestSpec.graph;
    } else {
      graph_template = requestSpec.graph;
    }
  }
  return [
    'combined',
    {
      context: context,
      datasource: 'services',
      single_infos: ['host'],
      graph_template: graph_template,
      presentation: requestSpec.aggregation,
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
