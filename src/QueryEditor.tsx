import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent, useState } from 'react';
import { LegacyForms, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

const SiteSelect = (options: any) => {
  const [value, setValue] = useState<SelectableValue<string>>();

  return (
    <Select
      options={options}
      value={value}
      onChange={v => {
        setValue(v);
      }}
    />
  );
};

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  onSiteIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, site_id: event.target.value } });
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
    const options = this.props.datasource.sitesQuery().then(op => SiteSelect(op));

    return (
      <div className="gf-form-group">
        {options}
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
        {/* <FormField
            labelWidth={8}
            value={queryText || ''}
            onChange={this.onQueryTextChange}
            label="Query Text"
            tooltip="Not used yet"
            /> */}
      </div>
    );
  }
}
