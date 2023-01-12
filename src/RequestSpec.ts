export interface NegatableOption {
  value?: string;
  negated: boolean;
}

export interface RequestSpec {
  // TODO: we need to rename graph_type, as the graph_type differentiates between graph and metric.
  // TODO: we also need to rename graph, as this could contain a metric name.
  // my suggestion: entity_type and entity then it should be clear that they influence each other.
  graph_type: string;

  aggregation: string;

  site: string | undefined;

  host_name: string | undefined;
  host_name_regex: NegatableOption | undefined;
  host_in_group: NegatableOption | undefined;
  host_labels: string[] | undefined;
  host_tags: [TagValue, TagValue, TagValue] | undefined;

  service: string | undefined;
  service_regex: NegatableOption | undefined;
  service_in_group: NegatableOption | undefined;

  graph: string | undefined;
}

export interface TagValue {
  group?: string;
  tag?: string;
  operator?: string;
}

// TODO: is unused.
export type Aggregation = 'lines' | 'sum' | 'average' | 'min' | 'max';

export type RequestSpecStringKeys = 'host_name' | 'site' | 'service' | 'graph' | 'graph_type' | 'aggregation';

export type RequestSpecNegatableOptionKeys = 'host_name_regex' | 'service_regex' | 'host_in_group' | 'service_in_group';

export const defaultRequestSpec: Partial<RequestSpec> = {
  aggregation: 'lines',
  graph_type: 'template',
};
export type FilterEditorKeys =
  | 'site'
  | 'host_name'
  | 'host_name_regex'
  | 'host_in_group'
  | 'host_labels'
  | 'host_tags'
  | 'service'
  | 'service_regex'
  | 'service_in_group';
