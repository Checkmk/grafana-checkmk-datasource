import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineFieldRow, VerticalGroup } from '@grafana/ui';
import React from 'react';

import { DataSource } from '../DataSource';
import { RequestSpec } from '../RequestSpec';
import { CmkQuery, DataSourceOptions, GraphKind, ResponseDataAutocomplete } from '../types';
import { titleCase } from '../utils';
import { updateQuery } from '../webapi';
import { Presentation, createAutocompleteConfig } from './autocomplete';
import {
  CheckMkSelect,
  CheckMkSelectNegatable,
  Filter,
  HostLabelFilter,
  HostTagFilter,
  OnlyActiveChildren,
} from './components';

type Props = QueryEditorProps<DataSource, CmkQuery, DataSourceOptions>;

async function contextAutocomplete(
  datasource: DataSource,
  ident: string,
  partialRequestSpec: Partial<RequestSpec>,
  prefix: string,
  params: Record<string, string | boolean>
) {
  const response = await datasource.autocompleterRequest<ResponseDataAutocomplete>(
    'ajax_vs_autocomplete.py',
    createAutocompleteConfig(partialRequestSpec, ident, prefix, params)
  );
  return response.data.result.choices.map(([value, label]: [string, string]) => ({
    value,
    label,
    isDisabled: value === null,
  }));
}

async function labelAutocomplete(datasource: DataSource, prefix: string) {
  // TODO: would have expected that the site is used as context!
  const response = await datasource.autocompleterRequest<Array<{ value: string }>>('ajax_autocomplete_labels.py', {
    world: 'core',
    search_label: prefix,
  });
  return response.data.result.map((val: { value: string }) => ({ value: val.value, label: val.value }));
}

export const QueryEditor = (props: Props): JSX.Element => {
  const { onChange, onRunQuery, datasource, query } = props;
  updateQuery(query);
  const rs = query.requestSpec || {};
  const [qAggregation, setQAggregation] = React.useState(rs.aggregation || 'lines');
  const [qGraphType, setQGraphType] = React.useState(rs.graph_type || 'template');
  const [qSite, setQSite] = React.useState(rs.site);
  const [qHost, setQHost] = React.useState({
    host_name: rs.host_name,
    host_name_regex: rs.host_name_regex,
    host_in_group: rs.host_in_group,
    host_labels: rs.host_labels,
    host_tags: rs.host_tags,
  });
  const [qService, setQService] = React.useState({
    service: rs.service,
    service_regex: rs.service_regex,
    service_in_group: rs.service_in_group,
  });
  const [qGraph, setQGraph] = React.useState(rs.graph);

  const editionMode = datasource.getEdition();

  const requestSpec = {
    site: qSite,
    ...qHost,
    ...qService,
    graph_type: qGraphType,
    graph: qGraph,
    aggregation: qAggregation,
  };

  // TODO: not sure if this is a dirty hack or a great solution:
  // https://beta.reactjs.org/apis/react/useState#storing-information-from-previous-renders
  const [prevCount, setPrevCount] = React.useState(JSON.stringify(requestSpec));
  if (prevCount !== JSON.stringify(requestSpec)) {
    setPrevCount(JSON.stringify(requestSpec));
    onChange({ ...query, requestSpec: requestSpec });
    onRunQuery();
  }

  const presentationCompleter = async (): Promise<Array<SelectableValue<Presentation>>> => [
    { value: 'lines', label: 'Lines' },
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
  ];

  const graphTypeCompleter = async (): Promise<Array<SelectableValue<GraphKind>>> => [
    { value: 'template', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];

  const siteAutocompleter = React.useCallback(
    (prefix: string) => {
      // TODO: this is a quick fix until we have decided how to handle site='' in raw edition
      // until then we remove the 'All Sites' element for raw edition:
      const strict = datasource.getEdition() === 'RAW';
      return contextAutocomplete(datasource, 'sites', {}, prefix, { strict: strict });
    },
    [datasource]
  );
  const hostAutocompleter = React.useCallback(
    (prefix: string) =>
      contextAutocomplete(datasource, 'monitored_hostname', { site: qSite }, prefix, { strict: 'with_source' }),
    [datasource, qSite]
  );
  const hostLabelAutocompleter = React.useCallback(
    (prefix: string) => labelAutocomplete(datasource, prefix),
    [datasource]
  );
  const hostGroupAutocompleter = React.useCallback(
    (prefix: string) =>
      contextAutocomplete(datasource, 'allgroups', { site: qSite }, prefix, { group_type: 'host', strict: true }),
    [datasource, qSite]
  );
  const hostTagAutocompleter = React.useCallback(
    (prefix: string, mode: 'groups' | 'choices', context: Record<string, unknown>) => {
      if (mode === 'groups') {
        return contextAutocomplete(datasource, 'tag_groups', { site: qSite, ...context }, prefix, { strict: true });
      } else {
        return (async function () {
          // TODO: would have expected that this is dependent on the site, but does not look like that?
          const response = await datasource.autocompleterRequest<ResponseDataAutocomplete>('ajax_vs_autocomplete.py', {
            ident: 'tag_groups_opt',
            params: { group_id: context.groupId, strict: true },
            value: prefix,
          });
          return response.data.result.choices.map(([value, label]: [string, string]) => ({
            value,
            label,
          }));
        })();
      }
    },
    [datasource, qSite]
  );

  const serviceAutocompleter = React.useCallback(
    (prefix: string) =>
      contextAutocomplete(datasource, 'monitored_service_description', { site: qSite, ...qHost }, prefix, {
        strict: true,
      }),
    [datasource, qSite, qHost]
  );
  const serviceGroupAutocompleter = React.useCallback(
    (prefix: string) =>
      contextAutocomplete(datasource, 'allgroups', { site: qSite, ...qHost }, prefix, {
        group_type: 'service',
        strict: true,
      }),
    [datasource, qSite, qHost]
  );
  const graphAutocompleter = React.useCallback(
    (prefix: string) => {
      let ident: string;
      let params = {};
      if (datasource.getEdition() === 'RAW') {
        ident = qGraphType === 'metric' ? 'monitored_metrics' : 'available_graphs';
        params = { strict: 'with_source' };
        // 2.1.0 changed { strict: 'with_source' } to:
        // strict: true,
        // show_independent_of_context: false,
        // but the defaults for missing values seem to be in our favour.
      } else {
        ident = 'combined_graphs';
        params = {
          presentation: qAggregation, // TODO: not 100% sure if this is needed, but 2.0.1 does it that way
          mode: qGraphType,
          datasource: 'services',
          single_infos: ['host'],
        };
      }
      return contextAutocomplete(
        datasource,
        ident,
        { site: qSite, ...qHost, ...qService, graph_type: qGraphType },
        prefix,
        params
      );
    },
    [datasource, qSite, qHost, qService, qGraphType, qAggregation]
  );

  if (editionMode === 'RAW') {
    return (
      <VerticalGroup>
        <CheckMkSelect label={'Site'} value={qSite} onChange={setQSite} autocompleter={siteAutocompleter} />
        <CheckMkSelect<'host_name'>
          label={'Hostname'}
          value={qHost.host_name}
          onChange={(host) => setQHost({ ...qHost, host_name: host })}
          autocompleter={hostAutocompleter}
        />
        <CheckMkSelect<'service'>
          label={'Service'}
          value={qService.service}
          onChange={(service) => setQService({ ...qService, service: service })}
          autocompleter={serviceAutocompleter}
        />
        <CheckMkSelect<'graph_type'>
          label={'Graph type'}
          value={qGraphType}
          onChange={setQGraphType}
          autocompleter={graphTypeCompleter}
        />
        <CheckMkSelect
          label={titleCase(qGraphType)}
          value={qGraph}
          onChange={setQGraph}
          autocompleter={graphAutocompleter}
        />
      </VerticalGroup>
    );
  } else {
    return (
      <VerticalGroup>
        <InlineFieldRow>
          <OnlyActiveChildren requestSpec={requestSpec}>
            <CheckMkSelect<'site'>
              requestSpecKey={'site'}
              label={'Site'}
              value={qSite}
              // TODO: onChange is used by OnlyActiveChildren with undefined as value
              // this should be reflected by the type system.
              onChange={setQSite}
              autocompleter={siteAutocompleter}
            />
            <CheckMkSelect<'host_name'>
              requestSpecKey={'host_name'}
              label={'Hostname'}
              value={qHost.host_name}
              onChange={(host) => setQHost({ ...qHost, host_name: host })}
              autocompleter={hostAutocompleter}
            />
            <Filter
              requestSpecKey="host_name_regex"
              label="Hostname regex"
              value={qHost.host_name_regex}
              onChange={(host_name_regex) => setQHost({ ...qHost, host_name_regex: host_name_regex })}
            />
            <CheckMkSelectNegatable
              requestSpecKey="host_in_group"
              label="Host in group"
              value={qHost.host_in_group}
              onChange={(host_in_group) => setQHost({ ...qHost, host_in_group: host_in_group })}
              autocompleter={hostGroupAutocompleter}
            />
            <HostLabelFilter
              label="Host labels"
              requestSpecKey="host_labels"
              value={qHost.host_labels}
              onChange={(host_labels: string[]) => setQHost({ ...qHost, host_labels: host_labels })}
              autocompleter={hostLabelAutocompleter}
            />
            <HostTagFilter
              label="Host tags"
              requestSpecKey="host_tags"
              value={qHost.host_tags}
              onChange={(host_tags) => setQHost({ ...qHost, host_tags: host_tags })}
              autocompleter={hostTagAutocompleter}
            />
            <CheckMkSelect<'service'>
              requestSpecKey={'service'}
              label={'Service'}
              value={qService.service}
              onChange={(service) => setQService({ ...qService, service: service })}
              autocompleter={serviceAutocompleter}
            />
            <Filter
              requestSpecKey="service_regex"
              label="Service regex"
              value={qService.service_regex}
              onChange={(service_regex) => setQService({ ...qService, service_regex: service_regex })}
            />
            <CheckMkSelectNegatable
              requestSpecKey="service_in_group"
              label="Service in group"
              value={qService.service_in_group}
              onChange={(service_in_group) => setQService({ ...qService, service_in_group: service_in_group })}
              autocompleter={serviceGroupAutocompleter}
            />
          </OnlyActiveChildren>
        </InlineFieldRow>

        <CheckMkSelect<'aggregation'>
          label={'Aggregation'}
          value={qAggregation}
          onChange={setQAggregation}
          autocompleter={presentationCompleter}
        />
        <CheckMkSelect<'graph_type'>
          // TODO: duplicate with RAW edition!
          label={'Graph type'}
          value={qGraphType}
          onChange={setQGraphType}
          autocompleter={graphTypeCompleter}
        />
        <CheckMkSelect
          label={titleCase(qGraphType)}
          value={qGraph}
          onChange={setQGraph}
          autocompleter={graphAutocompleter}
        />
      </VerticalGroup>
    );
  }
};
