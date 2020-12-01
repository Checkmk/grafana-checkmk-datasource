import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, Select, AsyncSelect } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

const { FormField } = LegacyForms;

export interface QueryData {
  sites: Array<SelectableValue<string>>;
}

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props, QueryData> {
  constructor(props: Props) {
    super(props);
    this.state = { sites: [{ label: 'All Sites', value: '' }] };
  }

  async componentDidMount() {
    const sites = await this.props.datasource.sitesQuery().then(sites => [{ label: 'All Sites', value: '' }, ...sites]);
    this.setState({ sites: sites });
  }

  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  onSiteIdChange = ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, siteId: value } });
    onRunQuery();
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
    console.log(this);
    const { params } = query;

    return (
      <div className="gf-form-group">
        <Select
          width={32}
          options={this.state.sites}
          onChange={this.onSiteIdChange}
          value={params.siteId}
          placeholder="Select Site"
        />
        <br />
        <AsyncSelect
          width={32}
          loadOptions={() => this.props.datasource.hostsQuery(query)}
          defaultOptions
          onChange={this.onHostnameChange}
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
