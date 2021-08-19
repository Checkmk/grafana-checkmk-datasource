import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryText?: string;
  graphMode?: string;
  params?: any;
  data?: any;
}

export const defaultQuery: Partial<MyQuery> = {
  graphMode: 'graph',
  params: {},
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
