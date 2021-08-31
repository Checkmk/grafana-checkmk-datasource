import { SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { MyQuery } from '../types';

export interface EditorProps {
  datasource: DataSource;
  query: MyQuery;
  onChange: (stuff: any) => void;
  onRunQuery: () => void;
}

export interface SelectOptions<T> {
  options: Array<SelectableValue<T>>;
}
