import { Edition } from './types';
import { RequestSpec } from './RequestSpec';
import { isUndefined } from 'lodash';

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

export function createCmkContext(requestSpec: RequestSpec): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  context['single_infos'] = ['hosts'];
  context['datasource'] = 'services';
  context['presentation'] = requestSpec.aggregation;

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
    context['host_labels'] = { host_label: `[{"value": "${requestSpec.host_labels}"}]` };
  }

  if (!isUndefined(requestSpec.service_in_group) && requestSpec.service_in_group.value !== '') {
    const optservicegroup: Record<string, unknown> = { opthost_group: requestSpec.service_in_group };
    if (requestSpec.service_in_group.negated) {
      optservicegroup['neg_optservice_group'] = 'on';
    }
    context['opthostgroup'] = optservicegroup;
  }
  if (!isUndefined(requestSpec.host_name_regex) && requestSpec.host_name_regex.value !== '') {
    const hostregex: Record<string, unknown> = { host_regex: requestSpec.host_name_regex.value };
    if (requestSpec.host_name_regex.negated) {
      hostregex['neg_host_regex'] = 'on';
    }
    context['hostregex'] = hostregex;
  }
  if (!isUndefined(requestSpec.host_in_group) && requestSpec.host_in_group.value !== '') {
    const opthostgroup: Record<string, unknown> = { opthost_group: requestSpec.host_in_group };
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
      tags[`host_tag_${index}_grp`] = group;
      tags[`host_tag_${index}_val`] = tag;
      tags[`host_tag_${index}_op`] = operator;
    });
    context['host_tags'] = tags;
  }
  if (requestSpec.graph !== '') {
    if (requestSpec.graph_type === 'metric') {
      context['graph_template'] = 'METRIC_' + requestSpec.graph;
    } else {
      context['graph_template'] = requestSpec.graph;
    }
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
      specification.graph_name = requestSpec.graph;
    } else {
      specification.graph_id = requestSpec.graph;
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
  return [
    'combined',
    {
      context: context,
      datasource: 'services',
      single_infos: ['host'],
      graph_template: context['graph_template'],
      presentation: context['presentation'],
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
