interface NegatableOption {
  value: string;
  negated: boolean;
}

interface FullRequestSpec {
  host_name: string;
  host_name_regex: NegatableOption;
  site: string;
  service: string;
  service_regex: NegatableOption;
  host_in_group: NegatableOption;
  host_labels: string[];
  service_in_group: NegatableOption;
  host_tags: [TagValue, TagValue, TagValue];
  aggregation: string;
  graph_type: string;
  graph: string;
}

export interface TagValue {
  group?: string;
  tag?: string;
  operator?: string;
}

export type Aggregation = 'lines' | 'sum' | 'average' | 'min' | 'max';

export type RequestSpec = Partial<FullRequestSpec>;

export type RequestSpecStringKeys = 'host_name' | 'site' | 'service' | 'graph' | 'graph_type' | 'aggregation';

export type RequestSpecNegatableOptionKeys = 'host_name_regex' | 'service_regex' | 'host_in_group' | 'service_in_group';

export const defaultRequestSpec: RequestSpec = {
  aggregation: 'lines',
  graph_type: 'template',
};
