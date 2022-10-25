import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { defaultRequestSpec, RequestSpec } from './RequestSpec';

export type ContextHTTPVars = Record<string, string>;

export interface CmkQuery extends DataQuery {
  requestSpec: RequestSpec;
}

export const defaultQuery: Partial<CmkQuery> = {
  requestSpec: defaultRequestSpec,
};

export type Edition = 'CEE' | 'RAW';

export interface DataSourceOptions extends DataSourceJsonData {
  url?: string;
  username?: string;
  edition?: Edition;
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
