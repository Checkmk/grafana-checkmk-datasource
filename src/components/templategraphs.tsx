import isEmpty from 'lodash/defaults';
import React, { PureComponent } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { MyQuery } from 'types';
import { FilterProps, SelectOptions } from './types';

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

async function allServiceMetrics(query: MyQuery, datasource: DataSource) {
  const all_service_metrics = await datasource.metricsOfHostQuery(query);
  const available_services = all_service_metrics
    .filter(([_, serviceInfo]) => isEmpty(serviceInfo['metrics']))
    .sort()
    .map(([service]) => ({
      label: service,
      value: service,
    }));

  return {
    services: available_services,
    allmetrics: all_service_metrics,
  };
}

function prepareSevicesQuery(query: MyQuery, hostname: string) {
  return {
    ...query,
    params: { hostname: hostname, site_id: query.params.site_id, action: 'get_metrics_of_host' },
  };
}

interface GraphOfServiceOptions {
  services: Array<SelectableValue<string>>;
  allmetrics: Array<[string, ServiceInfo]>;
}

export class GraphOfServiceQuery extends PureComponent<FilterProps, GraphOfServiceOptions> {
  constructor(props: FilterProps) {
    super(props);
    this.state = { services: [], allmetrics: [] };
  }

  async componentDidUpdate(prevProps: FilterProps) {
    const { query, datasource } = this.props;
    const currHost = query.params.hostname;
    if (currHost && (!this.state.services.length || prevProps.query.params.hostname !== currHost)) {
      const all_service_metrics = await allServiceMetrics(prepareSevicesQuery(query, currHost), datasource);
      this.setState(all_service_metrics);
    }
  }

  onServiceChange = async ({ value }: SelectableValue<string>) => {
    const { query, onChange } = this.props;
    onChange({ ...query, params: { ...query.params, service: value } });
  };

  render() {
    const { query, onChange, onRunQuery } = this.props;
    return (
      <>
        <InlineField labelWidth={14} label="Service">
          <Select
            width={32}
            options={this.state.services}
            onChange={this.onServiceChange}
            value={query.params.service}
            placeholder="Select service"
          />
        </InlineField>
        {query.graphMode === 'graph' && (
          <GraphSelect datasource={this.props.datasource} onChange={onChange} query={query} onRunQuery={onRunQuery} />
        )}
        {query.graphMode === 'metric' && (
          <MetricSelect onChange={onChange} query={query} onRunQuery={onRunQuery} allmetrics={this.state.allmetrics} />
        )}
      </>
    );
  }
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

export class MetricSelect extends PureComponent<FilterProps, SelectOptions<string>> {
  constructor(props: FilterProps) {
    super(props);
    this.state = { options: [] };
  }

  async componentDidUpdate(prevProps: FilterProps) {
    const { allmetrics, query } = this.props;
    const currService = query.params.service;
    if (
      allmetrics.length &&
      currService &&
      (!this.state.options.length || prevProps.query.params.service !== currService)
    ) {
      this.setState({ options: pickMetrics(allmetrics, query.params.service) });
    }
  }

  onMetricChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, metric: value } });
    onRunQuery();
  };

  render() {
    return (
      <InlineField labelWidth={14} label="Metric">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.onMetricChange}
          value={this.props.query.params.metric}
          placeholder="Select metric"
        />
      </InlineField>
    );
  }
}
export class GraphSelect extends PureComponent<FilterProps, SelectOptions<number>> {
  constructor(props: FilterProps) {
    super(props);
    this.state = { options: [] };
  }

  async componentDidUpdate(prevProps: FilterProps) {
    const { query, datasource } = this.props;
    const currHost = query.params.hostname;
    const currService = query.params.service;
    if (
      currHost &&
      currService &&
      (!this.state.options.length ||
        prevProps.query.params.hostname !== currHost ||
        prevProps.query.params.service !== currService)
    ) {
      const graphs = await datasource.graphsListQuery(query);
      this.setState({ options: graphs });
    }
  }

  onGraphChange = async ({ value }: SelectableValue<number>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, graph_index: value } });
    onRunQuery();
  };

  render() {
    return (
      <InlineField labelWidth={14} label="Graph">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.onGraphChange}
          value={this.props.query.params.graph_index}
          placeholder="Select graph"
        />
      </InlineField>
    );
  }
}
