import { ContextHTTPVars } from '../types';
import { createCmkContext } from '../webapi';
import { RequestSpec } from '../RequestSpec';

export type Context = Record<string, ContextHTTPVars>;

export type Presentation = 'lines' | 'sum' | 'average' | 'min' | 'max';

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
