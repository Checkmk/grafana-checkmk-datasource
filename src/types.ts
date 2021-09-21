import { DataQuery, DataSourceJsonData } from '@grafana/data';

interface ContextHTTPVars {
  [key: string]: string;
}
export interface Context {
  [key: string]: ContextHTTPVars;
}
export interface MyQuery extends DataQuery {
  queryText?: string;
  graphMode?: string;
  params?: any;
  context?: Context;
  data?: any;
}

export const defaultQuery: Partial<MyQuery> = {
  graphMode: 'graph',
  params: {},
  context: {},
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url?: string;
  username?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  secret?: string;
}
