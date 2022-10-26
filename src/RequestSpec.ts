import { GraphKind } from './types';

interface NegatableOption {
  value: string;
  negated: boolean;
}

export interface RequestSpec {
  host_name: string;
  host_name_regex: NegatableOption;
  site: string;
  service: string;
  service_regex: NegatableOption;
  host_in_group: NegatableOption;
  host_labels: string[];
  service_in_group: NegatableOption;
  host_tags: Array<{ group: string; tag: string; operator: 'is' | 'isnot' }>;
  aggregation: 'lines' | 'sum' | 'average' | 'min' | 'max';
  graph_type: GraphKind;
  graph: string;
}

export const defaultRequestSpec: RequestSpec = {
  host_name: '',
  host_name_regex: { value: '', negated: false },
  site: '',
  service: '',
  service_regex: { value: '', negated: false },
  host_in_group: { value: '', negated: false },
  host_labels: [],
  service_in_group: { value: '', negated: false },
  host_tags: [],
  aggregation: 'lines',
  graph_type: 'template',
  graph: '',
};
