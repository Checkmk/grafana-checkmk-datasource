import React, { PureComponent } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { MyQuery } from 'types';
import { FilterProps, SelectOptions } from './types';

interface GraphOfServiceOptions {
  services: Array<SelectableValue<string>>;
  allmetrics: Array<[string, any]>;
  metrics: Array<SelectableValue<string>>;
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

function prepareSevicesQuery(query: MyQuery, hostname: string) {
  return {
    ...query,
    params: { hostname: hostname, site_id: query.params.site_id, action: 'get_metrics_of_host' },
  };
}

export class GraphOfServiceQuery extends PureComponent<FilterProps, GraphOfServiceOptions> {
  constructor(props: FilterProps) {
    super(props);
    this.state = { services: [], allmetrics: [], metrics: [] };
  }

  async componentDidUpdate(prevProps: FilterProps) {
    const { query, datasource } = this.props;
    const currHost = query.params.hostname;
    if (!this.state.services.length || prevProps.query.params.hostname !== currHost) {
      const all_service_metrics = await allServiceMetrics(prepareSevicesQuery(query, currHost), datasource);
      this.setState(all_service_metrics);
    }
  }

  onServiceChange = async ({ value }: SelectableValue<string>) => {
    const { query, onChange } = this.props;
    onChange({ ...query, params: { ...query.params, service: value } });
  };

  render() {
    return (
      <>
        <InlineField labelWidth={14} label="Service">
          <Select
            width={32}
            options={this.state.services}
            onChange={this.onServiceChange}
            value={this.props.query.params.service}
            placeholder="Select service"
          />
        </InlineField>
        <GraphSelect
          datasource={this.props.datasource}
          onChange={this.props.onChange}
          query={this.props.query}
          onRunQuery={this.props.onRunQuery}
        />
      </>
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
      !this.state.options.length ||
      prevProps.query.params.hostname !== currHost ||
      prevProps.query.params.service !== currService
    ) {
      const graphs = await datasource.graphsListQuery(query);
      this.setState({ options: graphs });
    }
  }

  onGraphChange = async ({ value }: SelectableValue<number>) => {
    const { onChange, query, onRunQuery } = this.props;
    const new_query = { ...query, params: { ...query.params, graph_index: value } };
    onChange(new_query);
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
