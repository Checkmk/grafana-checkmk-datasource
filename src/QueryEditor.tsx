import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, AsyncSelect } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  onSiteIdChange = ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, siteId: value } });
    onRunQuery();
  };

  onHostnameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, hostname: event.target.value } });
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

  onConstantChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, constant: parseFloat(event.target.value) });
    // executes the query
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { params } = query;

    return (
      <div className="gf-form-group">
        <AsyncSelect
          width={32}
          loadOptions={() =>
            this.props.datasource.sitesQuery().then(sites => [{ label: 'All Sites', value: '' }, ...sites])
          }
          defaultOptions
          onChange={this.onSiteIdChange}
          placeholder="Select Site"
        />
        <br />
        <FormField
          labelWidth={6}
          inputWidth={20}
          value={params.hostname || ''}
          onChange={this.onHostnameChange}
          label="Hostname"
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
