import { DataSourcePlugin } from '@grafana/data';

import { DataSource } from './DataSource';
import { CmkQuery, DataSourceOptions } from './types';
import { ConfigEditor } from './ui/ConfigEditor';
import { QueryEditor } from './ui/QueryEditor';

export const plugin = new DataSourcePlugin<DataSource, CmkQuery, DataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
