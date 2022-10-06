import { DataQuery, DataSourceJsonData } from '@grafana/data';

export type ContextHTTPVars = Record<string, string>;

export type Context = Record<string, ContextHTTPVars>;

export type Presentation = 'lines' | 'sum' | 'average' | 'min' | 'max';

export interface CmkQuery extends DataQuery {
  requestSpec: RequestSpec;
}

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

/**
 * These are options configured for each DataSource instance
 */
export type Edition = 'CEE' | 'RAW';

export interface MyDataSourceOptions extends DataSourceJsonData {
  url?: string;
  username?: string;
  edition?: Edition;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  secret?: string;
}

export interface ResponseDataAutocomplete {
  choices: Array<[string, string]>;
}

export interface ResponseData<T> {
  result_code: number;
  result: T;
}

interface NegatableOption {
  value: string;
  negated: boolean;
}

export interface RequestSpec {
  host_name: string;
  host_name_regex: NegatableOption;
  site: string;
  service: string;
  service_regex: NegatableOption;
  host_in_group: NegatableOption;
  host_label: string;
  service_in_group: NegatableOption;
  host_tags?: Record<string, string>;
  aggregation: 'lines' | 'sum' | 'average' | 'min' | 'max';
  graph_type: 'template' | 'metric';
  graph: string;
}

export const defaultRequestSpec: RequestSpec = {
  host_name: '',
  host_name_regex: { value: '', negated: false },
  site: '',
  service: '',
  service_regex: { value: '', negated: false },
  host_in_group: { value: '', negated: false },
  host_label: '',
  service_in_group: { value: '', negated: false },
  aggregation: 'lines',
  graph_type: 'template',
  graph: '',
};

export const defaultQuery: Partial<CmkQuery> = {
  requestSpec: defaultRequestSpec,
};

export function createCmkContext(requestSpec: RequestSpec): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  context['single_infos'] = ['hosts'];
  context['datasource'] = 'services';
  context['presentation'] = requestSpec.aggregation;

  if (requestSpec.site !== '') {
    context['siteopt'] = { site: requestSpec.site };
  }
  if (requestSpec.host_name !== '') {
    context['host'] = { host: requestSpec.host_name };
  }
  if (requestSpec.service !== '') {
    context['service'] = { service: requestSpec.service };
  }
  if (requestSpec.host_label !== '') {
    context['host_labels'] = { host_label: `[{"value":"${requestSpec.host_label}"}]` };
  }

  if (requestSpec.service_in_group.value !== '') {
    const optservicegroup: Record<string, unknown> = { opthost_group: requestSpec.service_in_group };
    if (requestSpec.service_in_group.negated) {
      optservicegroup['neg_optservice_group'] = 'on';
    }
    context['opthostgroup'] = optservicegroup;
  }
  if (requestSpec.host_name_regex.value !== '') {
    const hostregex: Record<string, unknown> = { host_regex: requestSpec.host_name_regex };
    if (requestSpec.host_name_regex.negated) {
      hostregex['neg_host_regex'] = 'on';
    }
    context['hostregex'] = hostregex;
  }
  if (requestSpec.host_in_group.value !== '') {
    const opthostgroup: Record<string, unknown> = { opthost_group: requestSpec.host_in_group };
    if (requestSpec.host_in_group.negated) {
      opthostgroup['neg_opthost_group'] = 'on';
    }
    context['opthostgroup'] = opthostgroup;
  }
  if (requestSpec.service_regex.value !== '') {
    const serviceregex: Record<string, unknown> = { service_regex: requestSpec.service_regex.value };
    if (requestSpec.service_regex.negated) {
      serviceregex['neg_service_regex'] = 'on';
    }
    context['serviceregex'] = serviceregex;
  }

  if (requestSpec.host_tags !== undefined) {
    const tags: Record<string, string> = {};
    Object.entries(requestSpec.host_tags).forEach(([key, value], index) => {
      tags[`host_tag_${index}_grp`] = key;
      tags[`host_tag_${index}_val`] = value;
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
    return [
      'template',
      {
        site: requestSpec.site,
        host_name: requestSpec.host_name,
        service_description: requestSpec.service,
        graph_id: requestSpec.graph,
      },
    ];
  }
  const context = createCmkContext(requestSpec);
  return ['combined', context];
}
