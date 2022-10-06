import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ui/ConfigEditor';
import { QueryEditor } from './ui/QueryEditor';
import { CmkQuery, DataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, CmkQuery, DataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
