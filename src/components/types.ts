import { DataSource } from '../DataSource';
import { MyQuery, Edition, Presentation, Context } from '../types';
import { SelectableValue } from '@grafana/data';

export interface EditorProps {
  datasource: DataSource;
  edition?: Edition;
  query: MyQuery;
  onChange: (stuff: MyQuery) => void;
  onRunQuery: () => void;
}

export interface AutoCompleteEditorProps extends EditorProps {
  autocompleter: (inputValue: string) => Promise<Array<SelectableValue<string>>>;
  contextPath: string;
}

export interface AutoCompleteConfig {
  ident: string;
  params: {
    strict?: string | boolean;
    mode?: string;
    presentation?: Presentation;
    context?: Context;
    datasource?: string;
    single_infos?: string[];
  };
}
