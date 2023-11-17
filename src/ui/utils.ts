import { RequestSpec } from '../RequestSpec';

export const labelForRequestSpecKey = (key: keyof RequestSpec, rq: Partial<RequestSpec>): string => {
  const table: Record<keyof RequestSpec, string> = {
    site: 'Site',
    host_name: 'Hostname',
    host_name_regex: 'Hostname regex',
    host_in_group: 'Host in group',
    host_labels: 'Host labels',
    host_tags: 'Host tags',
    service: 'Service',
    service_regex: 'Service regex',
    service_in_group: 'Service in group',
    aggregation: 'Aggregation',
    graph_type: 'Graph type',
    graph: rq.graph_type === 'predefined_graph' ? 'Predefined graph' : 'Single metric',
    label: 'Custom label',
  };
  return table[key];
};
