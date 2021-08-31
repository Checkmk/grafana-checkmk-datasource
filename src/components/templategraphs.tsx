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
  async fillState(query: MyQuery) {
    const { datasource } = this.props;
    const hostname = query.params.hostname;
    if (hostname && !this.state.services.length) {
      const all_service_metrics = await allServiceMetrics(prepareSevicesQuery(query, hostname), datasource);
      this.setState(all_service_metrics);
    }
  }

  async componentDidMount() {
    this.fillState(this.props.query);
  }

  async componentDidUpdate(prevProps: FilterProps) {
    const { query } = this.props;
    const hostname = query.params.hostname;
    if (prevProps.query.params.hostname !== hostname) {
      this.fillState(query);
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

  async fillOptions(query: MyQuery) {
    const { allmetrics } = this.props;
    const service = query.params.service;
    if (allmetrics.length && service && !this.state.options.length) {
      this.setState({ options: pickMetrics(allmetrics, query.params.service) });
    }
  }

  async componentDidMount() {
    this.fillOptions(this.props.query);
  }

  async componentDidUpdate(prevProps: FilterProps) {
    if (prevProps.query.params.service !== this.props.query.params.service) {
      this.fillOptions(this.props.query);
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

  async fillOptions(query: MyQuery) {
    const { hostname, service } = this.props.query.params;
    if (hostname && service && !this.state.options.length) {
      this.setState({ options: await this.props.datasource.graphsListQuery(query) });
    }
  }

  async componentDidMount() {
    this.fillOptions(this.props.query);
  }

  async componentDidUpdate({ query: { params: prevParams } }: FilterProps) {
    const { hostname, service } = this.props.query.params;
    if (prevParams.hostname !== hostname || prevParams.service !== service) {
      this.fillOptions(this.props.query);
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
