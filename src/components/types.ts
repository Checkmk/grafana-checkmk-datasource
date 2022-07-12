import { DataSource } from '../DataSource';
import { MyQuery, Edition } from '../types';
import { SelectableValue } from '@grafana/data';

export interface EditorProps {
  datasource: DataSource;
  edition?: Edition;
  query: MyQuery;
  onChange: (stuff: any) => void;
  onRunQuery: () => void;
}

export interface AutoCompleteEditorProps extends EditorProps {
  autocompleter: (inputValue: string) => Promise<SelectableValue<string>[]>;
  contextPath: string;
}
