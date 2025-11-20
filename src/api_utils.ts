import { GraphType, NegatableOption, RequestSpec, TagValue } from './RequestSpec';
import { Context, Params } from './types';
import { presentationToAggregation } from './utils';

function transform_negated(
  context_property: Record<string, string | undefined> | undefined,
  key_name: string
): NegatableOption | undefined {
  if (context_property === undefined) {
    return undefined;
  }
  return {
    value: context_property[key_name] || '',
    negated: context_property[`neg_${key_name}`] === 'on',
  };
}

function graphModeToGraphType(graph_mode: 'template' | 'metric'): GraphType {
  if (graph_mode === 'template') {
    return 'predefined_graph';
  }
  if (graph_mode === 'metric') {
    return 'single_metric';
  }
  throw Error(`graph_mode ${graph_mode} is not known`);
}

export function requestSpecFromLegacy(context: Context, params: Params): Partial<RequestSpec> {
  const rs: Partial<RequestSpec> = {};
  if (context.host !== undefined) {
    rs.host_name = context.host.host;
  }

  if (context.siteopt !== undefined) {
    rs.site = context.siteopt.site;
  }

  rs.host_name_regex = transform_negated(context.hostregex, 'host_regex');

  if (context.service !== undefined) {
    rs.service = context.service.service;
  }

  rs.service_regex = transform_negated(context.serviceregex, 'service_regex');

  rs.host_in_group = transform_negated(context.opthostgroup, 'opthost_group');
  rs.service_in_group = transform_negated(context.optservicegroup, 'optservice_group');

  if (context.host_labels !== undefined) {
    const host_labels = JSON.parse(context.host_labels.host_label);
    rs.host_labels = host_labels.map((v: { value: string }) => v['value']);
  }

  if (context.host_tags !== undefined) {
    const result: [TagValue, TagValue, TagValue] = [{}, {}, {}];
    const numbers: Array<0 | 1 | 2> = [0, 1, 2];
    for (const i of numbers) {
      const group = context.host_tags[`host_tag_${i}_grp`];
      const operator = context.host_tags[`host_tag_${i}_op`];
      const tag = context.host_tags[`host_tag_${i}_val`];
      if (group !== undefined && operator !== undefined && tag !== undefined) {
        result[i] = { group, operator, tag };
      }
    }
    rs.host_tags = result;
  }

  rs.graph_type = graphModeToGraphType(params.graphMode);
  rs.graph = params.graph_name;
  rs.aggregation = presentationToAggregation(params.presentation);
  return rs;
}
