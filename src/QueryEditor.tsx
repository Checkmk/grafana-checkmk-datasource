import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { InlineFieldRow, InlineField, Select, Input, MultiSelect } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { SiteQueryField, HostFilter } from './components/site';
import { GraphOfServiceQuery } from './components/templategraphs';
//import { logError } from '@grafana/runtime';

export interface QueryData {
  labels: Array<SelectableValue<string>>;
}

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

interface GraphModeProps {
  query: MyQuery;
  onChange: (value: MyQuery) => void;
}

function GraphModeSelect({ query, onChange }: GraphModeProps) {
  const onModeChange = ({ value }: SelectableValue<string>) => {
    if (value === query.graphMode) {
      return;
    }
    onChange({ refId: query.refId, graphMode: value, params: { site_id: query.params.site_id } });
  };

  const graph_modes = [
    { label: 'Service graph', value: 'graph' },
    { label: 'Single metric', value: 'metric' },
    { label: 'Combined graph', value: 'combined' },
  ];
  return (
    <InlineField labelWidth={14} label="Mode">
      <Select
        width={32}
        options={graph_modes}
        onChange={onModeChange}
        value={query.graphMode}
        placeholder="Select Graph"
      />
    </InlineField>
  );
}

export class QueryEditor extends PureComponent<Props, QueryData> {
  constructor(props: Props) {
    super(props);
    this.state = { labels: [] };
  }

  onQueryhostChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, params: { ...query.params, hostname: event.target.value } });
  };
  onQuerysvcChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, params: { ...query.params, service: event.target.value } });
    const state: any = { ...this.state, graphs: await this.props.datasource.graphsListQuery(query) };
    console.log(state);
    this.setState(state);
  };
  onPresentationChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    if (value === query.params.presentation) {
      return;
    }
    const state: any = { ...this.state, graphs: await this.props.datasource.graphsListQuery(query) };
    console.log(state);
    onChange({ ...query, params: { ...query.params, presentation: value } });
  };
  onCombinedGraphChange = async ({ value }: SelectableValue<number>) => {
    const { onChange, query, onRunQuery } = this.props;
    const new_query = { ...query, params: { ...query.params, graph_name: value } };
    onChange(new_query);
    console.log('comb query', new_query);
    onRunQuery();
  };
  onLabelsChange = async (values: any[]) => {
    const { onChange, query, onRunQuery } = this.props;
    const new_query = { ...query, params: { ...query.params, labels: values.map((v) => v.value) } };
    onChange(new_query);
    onRunQuery();
  };
  getHostLabels = async () => {
    const result = await this.props.datasource.restRequest('ajax_autocomplete_labels.py', {
      world: 'core',
      search_label: '',
    });
    const labels = result.data.result.map(({ value }) => ({ label: value, value: value }));
    return labels;
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { params } = query;
    const clear = (value: any) => (value === undefined ? null : value);
    const combined_presentations = [
      { value: 'lines', label: 'Lines' },
      { value: 'stacked', label: 'Stacked' },
      { value: 'sum', label: 'Sum' },
      { value: 'average', label: 'Average' },
      { value: 'min', label: 'Minimum' },
      { value: 'max', label: 'Maximum' },
    ];

    return (
      <div className="gf-form-group">
        <InlineFieldRow>
          <GraphModeSelect {...this.props} query={query} />
          <SiteQueryField {...this.props} query={query} />
        </InlineFieldRow>

        {(query.graphMode === 'graph' || query.graphMode === 'metric') && (
          <InlineFieldRow>
            <HostFilter {...this.props} query={query} />
            <GraphOfServiceQuery {...this.props} />
          </InlineFieldRow>
        )}
        {query.graphMode === 'combined' && (
          <InlineFieldRow>
            <InlineField label="Hostname regex" labelWidth={14}>
              <Input
                width={32}
                type="text"
                value={params.hostname || ''}
                onChange={this.onQueryhostChange}
                placeholder="none"
              />
            </InlineField>
            <InlineField label="Service description regex" labelWidth={20}>
              <Input
                width={32}
                type="text"
                value={params.service || ''}
                onChange={this.onQuerysvcChange}
                placeholder="none"
              />
            </InlineField>

            <InlineField label="Host labels" labelWidth={14}>
              <MultiSelect
                options={this.state.labels}
                placeholder="all"
                width={32}
                onChange={this.onLabelsChange}
                value={params.labels}
              />
            </InlineField>

            <InlineField label="Aggregation" labelWidth={14}>
              <Select
                width={32}
                options={combined_presentations}
                onChange={this.onPresentationChange}
                value={query.params.presentation}
                placeholder="Aggregation"
              />
            </InlineField>
            <InlineField labelWidth={14} label="Graph">
              <Select
                width={32}
                options={this.state.graphs}
                onChange={this.onCombinedGraphChange}
                value={clear(params.graph_name)}
                placeholder="Select graph"
              />
            </InlineField>
          </InlineFieldRow>
        )}
      </div>
    );
  }
}
