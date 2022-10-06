import { DataSource } from '../DataSource';
import { CmkQuery, Context, createCmkContext, Edition, Presentation, RequestSpec } from '../types';

export interface EditorProps {
  datasource: DataSource;
  edition?: Edition;
  query: CmkQuery;
  onChange: (stuff: CmkQuery) => void;
  onRunQuery: () => void;
}

export interface AutoCompleteConfig {
  ident: string;
  value?: string;
  params: {
    strict?: string | boolean;
    mode?: string;
    presentation?: Presentation;
    context?: Context;
    datasource?: string;
    single_infos?: string[];
    //TODO: un? once we rewrote all of it
  };
}

export function createAutocompleteConfig(requestSpec: RequestSpec, ident: string, value: string): AutoCompleteConfig {
  const context = createCmkContext(requestSpec) as Context;

  let strict: string | boolean = true;
  switch (ident) {
    case 'site':
      strict = false;
      break;
    case 'monitored_metrics':
    case 'available_graphs':
      strict = 'with_source';
      break;
    default:
      strict = true;
  }

  return {
    ident,
    value,
    params: {
      strict,
      context,
    },
  };
}
