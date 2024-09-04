import { RequestSpec } from '../../src/RequestSpec';
import { Context, Params } from '../../src/types';
import { createCmkContext } from '../../src/utils';
import { requestSpecFromLegacy } from '../../src/webapi';
import { expect } from '@jest/globals';

// representation of the query in grafana plugin
const rs: RequestSpec = {
  aggregation: 'off',
  graph_type: 'single_metric',
  graph: 'ut_metric_id',

  site: 'ut_site',

  host_name: 'ut_hostname',
  host_name_regex: { value: 'ut_host_regex', negated: false },
  host_in_group: { value: 'Drucker', negated: true },
  host_labels: ['cmk/site:cmk210d'],
  host_tags: [{ group: 'criticality', operator: 'is', tag: 'prod' }, {}, {}],

  service: 'Check_MK',
  service_regex: { value: 'ut_service_regex', negated: false },
  service_in_group: { value: 'APT_Updates', negated: true },
};

// filter query that is sent to checkmk for graph and autocompleters
const context: Context = {
  host: { host: 'ut_hostname' },
  siteopt: { site: 'ut_site' },
  hostregex: { host_regex: 'ut_host_regex' },
  service: { service: 'Check_MK' },
  serviceregex: { service_regex: 'ut_service_regex' },
  host_labels: {
    host_labels_1_bool: 'and',
    host_labels_1_vs_1_bool: 'and',
    host_labels_1_vs_1_vs: 'cmk/site:cmk210d',
    host_labels_1_vs_count: '1',
    host_labels_count: '1',
  },
  opthostgroup: { opthost_group: 'Drucker', neg_opthost_group: 'on' },
  optservicegroup: { optservice_group: 'APT_Updates', neg_optservice_group: 'on' },
  host_tags: { host_tag_0_grp: 'criticality', host_tag_0_op: 'is', host_tag_0_val: 'prod' },
};

// filter query as it was persisted with version < 3.0.0
const legacy_context: Context = {
  ...context,
  host_labels: { host_label: '[{"value":"cmk/site:cmk210d"}]' },
};

const params: Params = {
  presentation: 'lines',
  graphMode: 'metric',
  graph_name: 'ut_metric_id',
  selections: {},
};

const rs_graph: Partial<RequestSpec> = {
  aggregation: 'off',
  graph_type: 'predefined_graph',
  graph: 'cmk_cpu_time_by_phase',

  site: 'cmk210dr',
  host_name: 'localhost',
  service: 'Check_MK',

  service_in_group: undefined,
  service_regex: undefined,
  host_name_regex: undefined,
  host_in_group: undefined,
};

// no differences between legacy_context and context for graphs, yet.
const context_graph: Context = {
  host: { host: 'localhost' },
  service: { service: 'Check_MK' },
  siteopt: { site: 'cmk210dr' },
};

const params_graph: Params = {
  presentation: 'lines',
  graphMode: 'template',
  graph_name: 'cmk_cpu_time_by_phase',
  selections: {},
};

describe('requestspec transformation', () => {
  it('requestspec -> context', () => {
    expect(createCmkContext(rs)).toStrictEqual(context);
    expect(createCmkContext(rs, '2.1.0')).toStrictEqual(legacy_context);
  });
  it('legacyQuery -> requestspec', () => {
    expect(requestSpecFromLegacy(legacy_context, params)).toStrictEqual(rs);
  });
  it('legacyQuery -> requestspec (simple graph)', () => {
    expect(requestSpecFromLegacy(context_graph, params_graph)).toStrictEqual(rs_graph);
  });
  it('requestspec -> context (simple graph)', () => {
    expect(createCmkContext(rs_graph)).toStrictEqual(context_graph);
  });
});
