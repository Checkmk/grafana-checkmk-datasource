import defaults from 'lodash/defaults';

import React, { PureComponent } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

export interface QueryData {
  sites: Array<SelectableValue<string>>;
  hostnames: Array<SelectableValue<string>>;
  services: Array<SelectableValue<string>>;
  graphs: Array<SelectableValue<number>>;
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

export class QueryEditor extends PureComponent<Props, QueryData> {
  constructor(props: Props) {
    super(props);
    this.state = { sites: [], hostnames: [], services: [], graphs: [] };
  }

  async componentDidMount() {
    const { query } = this.props;
    const sites = await this.props.datasource
      .sitesQuery(query)
      .then((sites) => [{ label: 'All Sites', value: '' }, ...sites]);
    const hostnames = await this.props.datasource.hostsQuery(prepareHostsQuery(query, query.params.site_id));
    if (query.params.hostname && query.params.service) {
      this.setState({
        sites: sites,
        hostnames: hostnames,
        services: await this.props.datasource.servicesQuery(prepareSevicesQuery(query, query.params.hostname)),
        graphs: await this.props.datasource.graphsListQuery(query),
      });
    } else {
      this.setState({ sites, hostnames });
    }
  }

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
    const state: any = {
      ...this.state,
      services: await this.props.datasource.servicesQuery(clean_query),
      graphs: [],
    };
    this.setState(state);
  };

  onServiceChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    let new_query = { ...query, params: { ...query.params, service: value } };
    delete new_query.params.graph_index;
    onChange(new_query);
    const state: any = {
      ...this.state,
      graphs: await this.props.datasource.graphsListQuery(new_query),
    };
    this.setState(state);
  };

  onGraphChange = async ({ value }: SelectableValue<number>) => {
    const { onChange, query, onRunQuery } = this.props;
    const new_query = { ...query, params: { ...query.params, graph_index: value } };
    onChange(new_query);
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { params } = query;
    const clear = (value: any) => (value === undefined ? null : value);

    return (
      <div className="gf-form-group">
        <InlineField labelWidth={14} label="Site">
          <Select
            width={32}
            options={this.state.sites}
            onChange={this.onSiteIdChange}
            value={params.site_id}
            placeholder="Select Site"
          />
        </InlineField>
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
        <InlineField labelWidth={14} label="Graph">
          <Select
            width={32}
            options={this.state.graphs}
            onChange={this.onGraphChange}
            value={clear(params.graph_index)}
            placeholder="Select graph"
          />
        </InlineField>
      </div>
    );
  }
}
