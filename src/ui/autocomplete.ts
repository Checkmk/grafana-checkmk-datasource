import { RequestSpec } from '../RequestSpec';
import { ContextHTTPVars } from '../types';
import { createCmkContext } from '../webapi';

type Context = Record<string, ContextHTTPVars>;

export type Presentation = 'lines' | 'sum' | 'average' | 'min' | 'max';

interface AutoCompleteConfig {
  ident: string;
  value?: string;
  // TODO: The content of "params" changes depending on "ident".
  // TODO: Something like a tagged union would be ideal here
  params: {
    group_id?: string;
    strict?: string | boolean;
    mode?: string;
    presentation?: Presentation;
    context?: Context;
    datasource?: string;
    single_infos?: string[];
  };
}

export function createAutocompleteConfig(
  requestSpec: RequestSpec,
  ident: string,
  value: string,
  params: Record<string, string | boolean>
): AutoCompleteConfig {
  const context = createCmkContext(requestSpec) as Context;

  return {
    ident,
    value,
    params: {
      ...params,
      context,
    },
  };
}
