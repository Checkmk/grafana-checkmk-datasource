import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

const { FormField } = LegacyForms;

export interface QueryData {
  sites: Array<SelectableValue<string>>;
  hostnames: Array<SelectableValue<string>>;
  services: Array<SelectableValue<string>>;
  graphs: Array<SelectableValue<number>>;
}

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props, QueryData> {
  constructor(props: Props) {
    super(props);
    this.state = { sites: [], hostnames: [], services: [], graphs: [] };
  }

  async componentDidMount() {
    const sites = await this.props.datasource
      .sitesQuery()
      .then((sites) => [{ label: 'All Sites', value: '' }, ...sites]);
    const hostnames = await this.props.datasource.hostsQuery('');
    const { query } = this.props;
    if (query.params.hostname && query.params.service) {
      this.setState({
        sites: sites,
        hostnames: hostnames,
        services: await this.props.datasource.servicesQuery({...query,
          params: { hostname: query.params.hostname, site_id: query.params.site_id || '' },
        }),
        graphs: await this.props.datasource.graphsListQuery(query),
      });
    } else {
      this.setState({ sites, hostnames });
    }
  }

  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  onSiteIdChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, params: { ...query.params, site_id: value } });
    const state: any = {
      hostnames: await this.props.datasource.hostsQuery(value || ''),
    };
    this.setState(state);
  };

  onHostnameChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    const new_query = { ...query, params: { site_id: query.params.site_id || '', hostname: value } };
    onChange(new_query);
    const state: any = {
      services: await this.props.datasource.servicesQuery(new_query),
    };
    this.setState(state);
  };

  onServiceChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    const new_query = { ...query, params: { ...query.params, service: value } };
    onChange(new_query);
    const state: any = {
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

  onMetricChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, metric: event.target.value } });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { params } = query;

    return (
      <div className="gf-form-group">
        <Select
          width={32}
          options={this.state.sites}
          onChange={this.onSiteIdChange}
          value={params.site_id}
          placeholder="Select Site"
        />
        <br />
        <Select
          width={32}
          options={this.state.hostnames}
          onChange={this.onHostnameChange}
          value={params.hostname}
          placeholder="Select Host"
        />
        <br />
        <Select
          width={32}
          options={this.state.services}
          onChange={this.onServiceChange}
          value={params.service}
          placeholder="Select service"
        />
        <br />
        <Select
          width={32}
          options={this.state.graphs}
          onChange={this.onGraphChange}
          value={params.graph_index}
          placeholder="Select graph"
        />
        <br />
        <FormField
          labelWidth={6}
          inputWidth={20}
          value={params.metric || ''}
          onChange={this.onMetricChange}
          label="Metric"
        />
      </div>
    );
  }
}
