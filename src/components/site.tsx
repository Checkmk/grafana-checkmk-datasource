import React, { PureComponent } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';

interface SiteProps {
  datasource: DataSource;
  site_id: string;
  onChange: (stuff: any) => void;
}

interface SiteState {
  sitesList: Array<SelectableValue<string>>;
}

export class SiteQueryField extends PureComponent<SiteProps, SiteState> {
  constructor(props: SiteProps) {
    super(props);
    this.state = { sitesList: [] };
  }

  async componentDidMount() {
    if (!this.state.sitesList.length) {
      const sites = await this.props.datasource.sitesQuery();
      this.setState({ sitesList: [{ label: 'All Sites', value: '' }, ...sites] });
    }
  }

  render() {
    return (
      <InlineField labelWidth={14} label="Site">
        <Select
          width={32}
          options={this.state.sitesList}
          onChange={this.props.onChange}
          value={this.props.site_id}
          placeholder="Select Site"
        />
      </InlineField>
    );
  }
}
