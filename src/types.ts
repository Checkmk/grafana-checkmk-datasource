import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

import { RequestSpec, defaultRequestSpec } from './RequestSpec';

export type ContextHTTPVars = Record<string, string>;

// TODO: should be moved to webapi types
type Negative = undefined | 'on' | '';

// TODO: should be moved to webapi types
export interface Context {
  host?: {
    host: string;
  };
  siteopt?: {
    site: string;
  };
  hostregex?: { host_regex: string; neg_host_regex?: Negative };
  service?: { service: string };
  serviceregex?: { neg_service_regex?: Negative; service_regex: string };
  host_labels?: Record<string, string>;
  opthostgroup?: { opthost_group: string; neg_opthost_group?: Negative };
  optservicegroup?: { optservice_group: string; neg_optservice_group?: Negative };
  host_tags?: {
    host_tag_0_grp?: string;
    host_tag_0_op?: 'is' | 'isnot';
    host_tag_0_val?: string;
    host_tag_1_grp?: string;
    host_tag_1_op?: 'is' | 'isnot';
    host_tag_1_val?: string;
    host_tag_2_grp?: string;
    host_tag_2_op?: 'is' | 'isnot';
    host_tag_2_val?: string;
  };
}

// TODO: should be moved to webapi types
export interface Params {
  graphMode: 'metric' | 'template';
  graph_name: string;
  presentation: 'lines' | 'sum' | 'average' | 'min' | 'max';
  selections: unknown;
}

export interface CmkQuery extends DataQuery {
  requestSpec: Partial<RequestSpec>;
  /**
   * @deprecated legacy interface context should not be used, use requestSpec
   */
  context?: Context;
  /**
   * @deprecated legacy interface params should not be used, use requestSpec
   */
  params?: Params;
}

export const defaultQuery: Partial<CmkQuery> = {
  requestSpec: defaultRequestSpec,
};

export type Edition = 'CEE' | 'RAW';
export type Backend = 'web' | 'rest';

export interface DataSourceOptions extends DataSourceJsonData {
  url?: string;
  username?: string;
  edition?: Edition;
  backend?: Backend;
  enableSecureSocksProxy?: boolean;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface SecureJsonData {
  secret?: string;
}

export interface ResponseDataAutocomplete {
  choices: Array<[string, string]>;
}

export enum LabelVariableNames {
  ORIGINAL = '$label',
  SITE = '$filter_site',
  HOSTNAME = '$filter_host_name',
  HOST_IN_GROUP = '$filter_host_in_group',
  SERVICE = '$filter_service',
  SERVICE_IN_GROUP = '$filter_service_in_group',
}
