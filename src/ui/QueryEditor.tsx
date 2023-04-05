import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineFieldRow, VerticalGroup } from '@grafana/ui';
import React from 'react';

import { DataSource } from '../DataSource';
import { Aggregation, GraphType, RequestSpec } from '../RequestSpec';
import { CmkQuery, DataSourceOptions } from '../types';
import { aggregationToPresentation, updateQuery } from '../utils';
import { CheckMkSelect } from './components';
import { Filters } from './filters';

type Props = QueryEditorProps<DataSource, CmkQuery, DataSourceOptions>;

export const QueryEditor = (props: Props): JSX.Element => {
  const { onChange, onRunQuery, datasource, query } = props;
  updateQuery(query);
  const rs = query.requestSpec || {};
  const [qAggregation, setQAggregation] = React.useState(rs.aggregation || 'off');
  const [qGraphType, setQGraphType] = React.useState(rs.graph_type || 'predefined_graph');
  const [qGraph, setQGraph] = React.useState(rs.graph);
  const filters: Partial<RequestSpec> = {
    // make sure to only include keys filters should change, otherwise they could
    // overwrite other fields!
    site: rs.site,

    host_name: rs.host_name,
    host_name_regex: rs.host_name_regex,
    host_in_group: rs.host_in_group,
    host_labels: rs.host_labels,
    host_tags: rs.host_tags,

    service: rs.service,
    service_regex: rs.service_regex,
    service_in_group: rs.service_in_group,
  };
  const [qFilters, setQFilters] = React.useState(filters);

  const editionMode = datasource.getEdition();

  const requestSpec = {
    ...qFilters,
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

  const aggregationCompleter = async (): Promise<Array<SelectableValue<Aggregation>>> => [
    { value: 'off', label: 'Off' },
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'minimum', label: 'Minimum' },
    { value: 'maximum', label: 'Maximum' },
  ];

  const graphTypeCompleter = async (): Promise<Array<SelectableValue<GraphType>>> => [
    { value: 'predefined_graph', label: 'Predefined graph' },
    { value: 'single_metric', label: 'Single metric' },
  ];

  const graphAutocompleter = React.useCallback(
    (prefix: string) => {
      let ident: string;
      let params = {};
      if (datasource.getEdition() === 'RAW') {
        ident = qGraphType === 'single_metric' ? 'monitored_metrics' : 'available_graphs';
        params = { strict: 'with_source' };
        // 2.1.0 changed { strict: 'with_source' } to:
        // strict: true,
        // show_independent_of_context: false,
        // but the defaults for missing values seem to be in our favour.
      } else {
        ident = 'combined_graphs';
        params = {
          presentation: aggregationToPresentation(qAggregation), // TODO: not 100% sure if this is needed, but 2.0.1 does it that way
          mode: qGraphType === 'single_metric' ? 'metric' : 'template',
          datasource: 'services',
          single_infos: ['host'],
        };
      }
      return datasource.contextAutocomplete(ident, { ...qFilters, graph_type: qGraphType }, prefix, params);
    },
    [datasource, qFilters, qGraphType, qAggregation]
  );

  const graphTypeSelect = (
    <CheckMkSelect<'graph_type'>
      label={'Graph type'}
      value={qGraphType}
      onChange={setQGraphType}
      autocompleter={graphTypeCompleter}
    />
  );
  const graphSelect = (
    <CheckMkSelect
      label={qGraphType === 'predefined_graph' ? 'Predefined graph' : 'Single metric'}
      value={qGraph}
      onChange={setQGraph}
      autocompleter={graphAutocompleter}
    />
  );

  if (editionMode === 'RAW') {
    return (
      <VerticalGroup>
        <Filters
          requestSpec={requestSpec}
          restrictedChildrenChoice={['site', 'host_name', 'service']}
          showRemoveButton={false}
          showAddFilterDropdown={false}
          datasource={datasource}
          onChange={setQFilters}
        />
        {graphTypeSelect}
        {graphSelect}
      </VerticalGroup>
    );
  } else {
    return (
      <VerticalGroup>
        <InlineFieldRow>
          <Filters requestSpec={requestSpec} datasource={datasource} onChange={setQFilters} />
        </InlineFieldRow>

        <CheckMkSelect<'aggregation'>
          label={'Aggregation'}
          value={qAggregation}
          onChange={setQAggregation}
          autocompleter={aggregationCompleter}
        />
        {graphTypeSelect}
        {graphSelect}
      </VerticalGroup>
    );
  }
};
