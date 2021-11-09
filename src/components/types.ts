import { DataSource } from '../DataSource';
import { MyQuery, Edition } from '../types';

export interface AutoComplete {
  ident: string;
  params: any;
}

export interface EditorProps {
  datasource: DataSource;
  edition?: Edition;
  query: MyQuery;
  onChange: (stuff: any) => void;
  onRunQuery: () => void;
}

export interface AutoCompleteEditorProps extends EditorProps {
  autocompleter: (inputValue: string) => Promise<any>;
  contextPath: string;
}
