import React, { PureComponent } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { DataSource, prepareHostsQuery } from '../DataSource';
import { MyQuery } from 'types';

interface FilterProps {
  datasource: DataSource;
  query: MyQuery;
  onChange: (stuff: any) => void;
}

interface SelectOptions {
  options: Array<SelectableValue<string>>;
}

export class SiteQueryField extends PureComponent<FilterProps, SelectOptions> {
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

export class HostFilter extends PureComponent<FilterProps, SelectOptions> {
  constructor(props: FilterProps) {
    super(props);
    this.state = { options: [] };
  }

  async componentDidMount() {
    if (!this.state.options.length) {
      const { query } = this.props;
      const hostnames = await this.props.datasource.hostsQuery(prepareHostsQuery(query, query.params.site_id));
      this.setState({ options: hostnames });
    }
  }

  render() {
    return (
      <InlineField labelWidth={14} label="Hostname">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.props.onChange}
          value={this.props.query.params.hostname}
          placeholder="Select Host"
        />
      </InlineField>
    );
  }
}
