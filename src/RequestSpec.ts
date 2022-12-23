export interface NegatableOption {
  value: string;
  negated: boolean;
}

export interface FullRequestSpec {
  // TODO: not 100% sure if this is really useful, to have undefined in the full request spec
  // but i wanted to express that graph_type and aggregation can not be undefined, but all others can.
  // maybe we could also go back to use RequestSpec, and remove the undefined here.

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

export type RequestSpec = Partial<FullRequestSpec>;

export type RequestSpecStringKeys = 'host_name' | 'site' | 'service' | 'graph' | 'graph_type' | 'aggregation';

export type RequestSpecNegatableOptionKeys = 'host_name_regex' | 'service_regex' | 'host_in_group' | 'service_in_group';

export const defaultRequestSpec: RequestSpec = {
  aggregation: 'lines',
  graph_type: 'template',
};
