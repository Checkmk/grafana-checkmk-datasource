import { DataSourcePlugin } from '@grafana/data';

import { DataSource } from './DataSource';
import { CmkQuery, DataSourceOptions } from './types';
import { ConfigEditor } from './ui/ConfigEditor';
import { QueryEditor } from './ui/QueryEditor';
import { VariableQueryEditor } from './ui/VariableQueryEditor';

export const plugin = new DataSourcePlugin<DataSource, CmkQuery, DataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setVariableQueryEditor(VariableQueryEditor)
  .setQueryEditor(QueryEditor);
