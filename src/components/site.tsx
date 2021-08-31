import React, { PureComponent } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { prepareHostsQuery } from '../DataSource';
import { FilterProps, SelectOptions } from './types';
import { MyQuery } from '../types';

export class SiteQueryField extends PureComponent<FilterProps, SelectOptions<string>> {
  constructor(props: FilterProps) {
    super(props);
    this.state = { options: [] };
  }

  async componentDidMount() {
    if (!this.state.options.length) {
      const sites = await this.props.datasource.sitesQuery();
      this.setState({ options: [{ label: 'All Sites', value: '' }, ...sites] });
    }
  }

  onSiteIdChange = ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({
      ...query,
      params: { ...query.params, site_id: value },
    });
  };

  render() {
    return (
      <InlineField labelWidth={14} label="Site">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.onSiteIdChange}
          value={this.props.query.params.site_id}
          placeholder="Select Site"
        />
      </InlineField>
    );
  }
}

export class HostFilter extends PureComponent<FilterProps, SelectOptions<string>> {
  constructor(props: FilterProps) {
    super(props);
    this.state = { options: [] };
  }
  async fillOptions(query: MyQuery) {
    const site_id = query.params.site_id;
    if (!this.state.options.length) {
      this.setState({ options: await this.props.datasource.hostsQuery(prepareHostsQuery(query, site_id)) });
    }
  }

  async componentDidMount() {
    this.fillOptions(this.props.query);
  }

  async componentDidUpdate(prevProps: FilterProps) {
    const site_id = this.props.query.params.site_id;
    if (prevProps.query.params.site_id !== site_id) {
      this.fillOptions(this.props.query);
    }
  }

  onHostChange = ({ value }: SelectableValue<string>) => {
    const { query, onChange } = this.props;
    onChange({ ...query, params: { ...query.params, hostname: value } });
  };

  render() {
    return (
      <InlineField labelWidth={14} label="Hostname">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.onHostChange}
          value={this.props.query.params.hostname}
          placeholder="Select Host"
        />
      </InlineField>
    );
  }
}
