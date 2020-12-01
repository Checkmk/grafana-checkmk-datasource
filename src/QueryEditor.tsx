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
}

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props, QueryData> {
  constructor(props: Props) {
    super(props);
    this.state = { sites: [], hostnames: [] };
  }

  async componentDidMount() {
    const sites = await this.props.datasource.sitesQuery().then(sites => [{ label: 'All Sites', value: '' }, ...sites]);
    const hostnames = await this.props.datasource.hostsQuery(this.props.query);
    this.setState({ sites, hostnames });
  }

  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  onSiteIdChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    const new_query = { ...query, params: { ...query.params, site_id: value } };
    onChange(new_query);
    const state: any = {
      hostnames: await this.props.datasource.hostsQuery(new_query),
    };
    this.setState(state);
  };

  onHostnameChange = ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, hostname: value } });
    onRunQuery();
  };

  onServiceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, service: event.target.value } });
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
        <FormField
          labelWidth={6}
          inputWidth={20}
          value={params.service || ''}
          onChange={this.onServiceChange}
          label="Service"
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
