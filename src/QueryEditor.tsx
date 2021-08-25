import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { InlineFieldRow, InlineField, Select, Input, MultiSelect } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
//import { logError } from '@grafana/runtime';

export interface QueryData {
  sites: Array<SelectableValue<string>>;
  hostnames: Array<SelectableValue<string>>;
  services: Array<SelectableValue<string>>;
  allmetrics: Array<[string, any]>;
  metrics: Array<SelectableValue<string>>;
  graphs: Array<SelectableValue<number>>;
  labels: Array<SelectableValue<string>>;
}

interface MetricInfo {
  name: string;
  title: string;
}
interface Metrics {
  [key: string]: MetricInfo;
}
interface ServiceInfo {
  metrics: Metrics;
  check_command: string;
}

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

function prepareHostsQuery(query: MyQuery, site: string) {
  return {
    ...query,
    params: { site_id: site, action: 'get_host_names' },
  };
}

function prepareSevicesQuery(query: MyQuery, hostname: string) {
  return {
    ...query,
    params: { hostname: hostname, site_id: query.params.site_id, action: 'get_metrics_of_host' },
  };
}

async function allServiceMetrics(query: MyQuery, datasource: DataSource) {
  const all_service_metrics = await datasource.metricsOfHostQuery(query);
  const available_services = all_service_metrics.sort().map(([service]) => ({
    label: service,
    value: service,
  }));

  return {
    services: available_services,
    allmetrics: all_service_metrics,
  };
}

function pickMetrics(all_service_metrics: Array<[string, ServiceInfo]>, service: string) {
  const current_metrics = all_service_metrics.find(([svc, _]) => svc === service);

  return current_metrics
    ? Object.values(current_metrics[1].metrics).map(({ name, title }) => ({
        label: title,
        value: name,
      }))
    : [];
}

export class QueryEditor extends PureComponent<Props, QueryData> {
  constructor(props: Props) {
    super(props);
    this.state = { sites: [], hostnames: [], services: [], graphs: [], metrics: [], allmetrics: [], labels: [] };
  }

  async componentDidMount() {
    const { query } = this.props;
    const sites = await this.props.datasource
      .sitesQuery(query)
      .then((sites) => [{ label: 'All Sites', value: '' }, ...sites]);
    const hostnames = await this.props.datasource.hostsQuery(prepareHostsQuery(query, query.params.site_id));
    if (query.graphMode === 'combined') {
      this.setState({ sites, labels: await this.getHostLabels() });
    } else if (query.params.hostname && query.params.service) {
      const all_service_metrics = await allServiceMetrics(
        prepareSevicesQuery(query, query.params.hostname),
        this.props.datasource
      );

      const config = {
        ...all_service_metrics,
        sites: sites,
        hostnames: hostnames,
      };
      if (query.graphMode === 'graph') {
        this.setState({ ...config, graphs: await this.props.datasource.graphsListQuery(query) });
      } else if (query.graphMode === 'metric') {
        const select_metrics = pickMetrics(all_service_metrics.allmetrics, query.params.service);
        this.setState({ ...config, metrics: select_metrics });
      }
    } else {
      this.setState({ sites, hostnames });
    }
  }

  onModeChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    if (value === query.graphMode) {
      return;
    }
    onChange({ refId: query.refId, graphMode: value, params: { site_id: query.params.site_id } });
  };

  onSiteIdChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    const clean_query = prepareHostsQuery(query, value || '');
    onChange(clean_query);
    const state: any = {
      sites: this.state.sites,
      hostnames: await this.props.datasource.hostsQuery(clean_query),
      services: [],
      graphs: [],
    };
    this.setState(state);
  };

  onHostnameChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    const clean_query = prepareSevicesQuery(query, value || '');
    onChange(clean_query);

    const all_service_metrics = await allServiceMetrics(clean_query, this.props.datasource);
    const state: any = {
      ...this.state,
      ...all_service_metrics,
      graphs: [],
    };
    this.setState(state);
  };

  onServiceChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    let new_query = { ...query, params: { ...query.params, service: value } };
    delete new_query.params.graph_index;
    onChange(new_query);
    let state = {};
    if (query.graphMode === 'graph') {
      state = {
        ...this.state,
        graphs: await this.props.datasource.graphsListQuery(new_query),
      };
    } else {
      const select_metrics = pickMetrics(this.state.allmetrics, new_query.params.service);
      state = {
        ...this.state,
        metrics: select_metrics,
      };
    }
    this.setState(state);
  };

  onGraphChange = async ({ value }: SelectableValue<number>) => {
    const { onChange, query, onRunQuery } = this.props;
    const new_query = { ...query, params: { ...query.params, graph_index: value } };
    onChange(new_query);
    onRunQuery();
  };

  onMetricChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    const new_query = { ...query, params: { ...query.params, metric: value } };
    onChange(new_query);
    onRunQuery();
  };

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
    const graph_modes = [
      { label: 'Service graph', value: 'graph' },
      { label: 'Single metric', value: 'metric' },
      { label: 'Combined graph', value: 'combined' },
    ];
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
          <InlineField labelWidth={14} label="Mode">
            <Select
              width={32}
              options={graph_modes}
              onChange={this.onModeChange}
              value={query.graphMode}
              placeholder="Select Graph"
            />
          </InlineField>
          <InlineField labelWidth={14} label="Site">
            <Select
              width={32}
              options={this.state.sites}
              onChange={this.onSiteIdChange}
              value={params.site_id}
              placeholder="Select Site"
            />
          </InlineField>
        </InlineFieldRow>

        {(query.graphMode === 'graph' || query.graphMode === 'metric') && (
          <InlineFieldRow>
            <InlineField labelWidth={14} label="Host">
              <Select
                width={32}
                options={this.state.hostnames}
                onChange={this.onHostnameChange}
                value={clear(params.hostname)}
                placeholder="Select Host"
              />
            </InlineField>
            <InlineField labelWidth={14} label="Service">
              <Select
                width={32}
                options={this.state.services}
                onChange={this.onServiceChange}
                value={clear(params.service)}
                placeholder="Select service"
              />
            </InlineField>
            {query.graphMode === 'graph' && (
              <InlineField labelWidth={14} label="Graph">
                <Select
                  width={32}
                  options={this.state.graphs}
                  onChange={this.onGraphChange}
                  value={clear(params.graph_index)}
                  placeholder="Select graph"
                />
              </InlineField>
            )}
            {query.graphMode === 'metric' && (
              <InlineField labelWidth={14} label="Metric">
                <Select
                  width={32}
                  options={this.state.metrics}
                  onChange={this.onMetricChange}
                  value={clear(params.metric)}
                  placeholder="Select Metric"
                />
              </InlineField>
            )}
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
