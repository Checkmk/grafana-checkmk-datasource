import { GraphType, RequestSpec } from '../../src/RequestSpec';
import { Context, Params } from '../../src/types';
import { replaceVariables, toLiveStatusQuery } from '../../src/utils';

jest.mock('@grafana/runtime', () => ({
  ...(jest.requireActual('@grafana/runtime') as unknown as object),
  getTemplateSrv: () => ({
    replace: jest.fn().mockImplementation((s: string) => s.replace('$var', 'replaced')),
  }),
}));

describe('utils.replaceVariables', () => {
  it('string', () => {
    expect(replaceVariables({ host_name: '$var' })).toStrictEqual({ host_name: 'replaced' });
  });
  it('site', () => {
    expect(replaceVariables({ site: '$var' })).toStrictEqual({ site: 'replaced' });
  });
  it('graph_type', () => {
    expect(replaceVariables({ graph_type: '$var' as GraphType })).toStrictEqual({ graph_type: 'replaced' });
  });
  it('negatbale', () => {
    expect(replaceVariables({ host_name_regex: { value: '.*$var.*', negated: false } })).toStrictEqual({
      host_name_regex: { value: '.*replaced.*', negated: false },
    });
  });
  it('host_labels', () => {
    expect(replaceVariables({ host_labels: ['$var', 'smth'] })).toStrictEqual({ host_labels: ['replaced', 'smth'] });
  });
  it('host_tags', () => {
    expect(
      replaceVariables({
        host_tags: [
          { tag: '$var', group: 'gruppe', operator: 'is' },
          { tag: 'tag', group: '$var', operator: 'is' },
          { tag: 'tag', group: 'gruppe', operator: 'is' },
        ],
      })
    ).toStrictEqual({
      host_tags: [
        { tag: 'replaced', group: 'gruppe', operator: 'is' },
        { tag: 'tag', group: 'replaced', operator: 'is' },
        { tag: 'tag', group: 'gruppe', operator: 'is' },
      ],
    });
  });
});

describe('utils.toLiveStatusQuery', () => {
  it('host', () => {
    expect(
      toLiveStatusQuery(
        {
          site: 'ut_site',
          host_name: 'ut_hostname',
          host_name_regex: { value: 'ut_host_regex', negated: false },
          host_in_group: { value: 'Drucker', negated: false },
          host_labels: ['cmk/site:cmk210d'],
          host_tags: [{ group: 'criticality', operator: 'is', tag: 'prod' }, {}, {}],
          service: 'Check_MK',
          service_regex: { value: 'ut_service_regex', negated: false },
          service_in_group: { value: 'APT_Updates', negated: false },
        },
        'host'
      )
    ).toStrictEqual({
      query: {
        expr: [
          {
            left: 'hosts.name',
            op: '=',
            right: 'ut_hostname',
          },
          {
            left: 'hosts.name',
            op: '~~',
            right: 'ut_host_regex',
          },
          {
            left: 'hosts.groups',
            op: '>=',
            right: 'Drucker',
          },
          {
            left: 'hosts.labels',
            op: '=',
            right: "'cmk/site' 'cmk210d'",
          },
          {
            left: 'hosts.tags',
            op: '=',
            right: "'criticality' 'prod'",
          },
        ],
        op: 'and',
      },
      sites: ['ut_site'],
    });
  });

  it('host negated', () => {
    expect(
      toLiveStatusQuery(
        {
          host_name_regex: { value: 'ut_host_regex', negated: true },
          host_in_group: { value: 'Drucker', negated: true },
          service_regex: { value: 'ut_service_regex', negated: true },
          service_in_group: { value: 'APT_Updates', negated: true },
        },
        'host'
      )
    ).toStrictEqual({
      query: {
        expr: [
          {
            left: 'hosts.name',
            op: '!~~',
            right: 'ut_host_regex',
          },
          {
            left: 'hosts.groups',
            op: '!>=',
            right: 'Drucker',
          },
        ],
        op: 'and',
      },
      sites: [],
    });
  });

  it('service', () => {
    expect(
      toLiveStatusQuery(
        {
          site: 'ut_site',
          host_name: 'ut_hostname',
          host_name_regex: { value: 'ut_host_regex', negated: false },
          host_in_group: { value: 'Drucker', negated: false },
          host_labels: ['cmk/site:cmk210d'],
          host_tags: [{ group: 'criticality', operator: 'is', tag: 'prod' }, {}, {}],
          service: 'Check_MK',
          service_regex: { value: 'ut_service_regex', negated: false },
          service_in_group: { value: 'APT_Updates', negated: false },
        },
        'service'
      )
    ).toStrictEqual({
      query: {
        expr: [
          {
            left: 'services.host_name',
            op: '=',
            right: 'ut_hostname',
          },
          {
            left: 'services.host_name',
            op: '~~',
            right: 'ut_host_regex',
          },
          {
            left: 'services.host_groups',
            op: '>=',
            right: 'Drucker',
          },
          {
            left: 'services.host_labels',
            op: '=',
            right: "'cmk/site' 'cmk210d'",
          },
          {
            left: 'services.host_tags',
            op: '=',
            right: "'criticality' 'prod'",
          },
          {
            left: 'services.description',
            op: '=',
            right: 'Check_MK',
          },
          {
            left: 'services.description',
            op: '~~',
            right: 'ut_service_regex',
          },
          {
            left: 'services.groups',
            op: '>=',
            right: 'APT_Updates',
          },
        ],
        op: 'and',
      },
      sites: ['ut_site'],
    });
  });

  it('service negated', () => {
    expect(
      toLiveStatusQuery(
        {
          service_regex: { value: 'ut_service_regex', negated: true },
          service_in_group: { value: 'APT_Updates', negated: true },
        },
        'service'
      )
    ).toStrictEqual({
      query: {
        expr: [
          {
            left: 'services.description',
            op: '!~~',
            right: 'ut_service_regex',
          },
          {
            left: 'services.groups',
            op: '!>=',
            right: 'APT_Updates',
          },
        ],
        op: 'and',
      },
      sites: [],
    });
  });
});
