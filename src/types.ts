import { DataQuery, DataSourceJsonData } from '@grafana/data';

interface ContextHTTPVars {
  [key: string]: string;
}
export interface Context {
  [key: string]: ContextHTTPVars;
}

export type Presentation = 'lines' | 'sum' | 'average' | 'min' | 'max';

export interface QueryParams {
  graphMode?: 'metric' | 'template';
  presentation?: Presentation;
  graph_name?: string;
  action?: 'get_graph' | 'get_combined_graph_identifications';
}

export interface MyQuery extends DataQuery {
  params: QueryParams;
  context: Context;
  data?: string;
}

export const defaultQuery: Partial<MyQuery> = {
  params: {
    graphMode: 'template',
    presentation: 'lines',
  },
  context: {},
};

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
  choices: [string, string][];
}

export type ResponseDataAutocompleteLabel = {
  value: string;
}[];

export interface ResponseDataCurves {
  filter: unknown;
  start_time: number;
  step: number;
  curves: {
    title: string;
    rrddata: {
      i: number;
      d: Record<string, unknown>;
    }[];
  }[];
}

export interface ResponseData<T> {
  result_code: number;
  result: T;
}
