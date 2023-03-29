import { ContextHTTPVars } from '../types';

type Context = Record<string, ContextHTTPVars>;

export type Presentation = 'lines' | 'sum' | 'average' | 'min' | 'max';

export interface AutoCompleteParams {
  group_id: string;
  strict: string | boolean;
  mode: string;
  presentation: Presentation;
  context: Context;
  datasource: string;
  single_infos: string[];
  world: string;
  group_type: string;
}
