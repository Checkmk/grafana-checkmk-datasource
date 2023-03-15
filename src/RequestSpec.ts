export interface NegatableOption {
  value?: string;
  negated: boolean;
}

export interface RequestSpec {
  // TODO: we need to rename graph_type, as the graph_type differentiates between graph and metric.
  // TODO: we also need to rename graph, as this could contain a metric name.
  // my suggestion: entity_type and entity then it should be clear that they influence each other.
  graph_type: GraphType;

  aggregation: Aggregation;

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

export type GraphType = 'single_metric' | 'predefined_graph';

export type Aggregation = 'off' | 'sum' | 'average' | 'minimum' | 'maximum';

export type PickByValue<T, V> = Pick<T, { [K in keyof T]: T[K] extends V ? K : never }[keyof T]>;

export type RequestSpecStringKeys = keyof PickByValue<RequestSpec, string | undefined>;

export type RequestSpecNegatableOptionKeys = keyof PickByValue<RequestSpec, NegatableOption | undefined>;

export const defaultRequestSpec: Partial<RequestSpec> = {
  aggregation: 'off',
  graph_type: 'predefined_graph',
};
export type FilterEditorKeys = Exclude<keyof RequestSpec, 'graph_type' | 'aggregation' | 'graph'>;
