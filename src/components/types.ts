import { SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { MyQuery } from '../types';

export interface AutoComplete {
  ident: string;
  params: any;
}

export interface EditorProps {
  datasource: DataSource;
  query: MyQuery;
  onChange: (stuff: any) => void;
  onRunQuery: () => void;
  autocompleteConfig?: AutoComplete;
}

export interface AutoCompleteEditorProps extends EditorProps {
  autocompleteConfig: AutoComplete;
  contextPath: string;
}

export interface SelectOptions<T> {
  options: Array<SelectableValue<T>>;
}
