import React, { ChangeEvent, PureComponent } from 'react';
import { InlineField, Select, MultiSelect, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { prepareHostsQuery } from '../DataSource';
import { EditorProps, SelectOptions } from './types';
import { MyQuery } from '../types';
import { get, update } from 'lodash';

export class SiteFilter extends PureComponent<EditorProps, SelectOptions<string>> {
  constructor(props: EditorProps) {
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
    update(query, 'context.siteopt.site', () => value);
    onChange(query);
  };

  render() {
    const site = get(this.props, 'query.context.siteopt.site', '');
    return (
      <InlineField labelWidth={14} label="Site">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.onSiteIdChange}
          value={site}
          placeholder="Select Site"
        />
      </InlineField>
    );
  }
}

export class HostFilter extends PureComponent<EditorProps, SelectOptions<string>> {
  constructor(props: EditorProps) {
    super(props);
    this.state = { options: [] };
  }
  async fillOptions(query: MyQuery) {
    const site_id = query.params.site_id;
    this.setState({ options: await this.props.datasource.hostsQuery(prepareHostsQuery(query, site_id)) });
  }

  async componentDidMount() {
    if (!this.state.options.length) {
      this.fillOptions(this.props.query);
    }
  }

  async componentDidUpdate(prevProps: EditorProps) {
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

export const HostRegExFilter = (props: EditorProps) => {
  const onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    onChange({ ...query, context: { ...query.context, hostregex: { host_regex: event.target.value } } });
  };
  const hostRegEx = get(props, 'query.context.hostregex', {});
  return (
    <InlineField label="Hostname regex" labelWidth={14}>
      <Input width={32} type="text" value={hostRegEx.host_regex || ''} onChange={onHostChange} placeholder="none" />
    </InlineField>
  );
};

export const ServiceRegExFilter = (props: EditorProps) => {
  const onServiceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    onChange({ ...query, context: { ...query.context, serviceregex: { service_regex: event.target.value } } });
  };
  const serviceRegEx = get(props, 'query.context.serviceregex', {});
  return (
    <InlineField label="Service regex" labelWidth={14}>
      <Input
        width={32}
        type="text"
        value={serviceRegEx.service_regex || ''}
        onChange={onServiceChange}
        placeholder="none"
      />
    </InlineField>
  );
};

export class HostLabelsFilter extends PureComponent<EditorProps, SelectOptions<string>> {
  constructor(props: EditorProps) {
    super(props);
    this.state = { options: [] };
  }
  async getHostLabels() {
    const result = await this.props.datasource.restRequest('ajax_autocomplete_labels.py', {
      world: 'core',
      search_label: '',
    });
    this.setState({
      options: result.data.result.map(({ value }: { value: string }) => ({ label: value, value: value })),
    });
  }

  async componentDidMount() {
    if (!this.state.options.length) {
      this.getHostLabels();
    }
  }

  onLabelsChange = async (values: any[]) => {
    const { onChange, query, onRunQuery } = this.props;
    const new_query = {
      ...query,
      context: {
        ...query.context,
        host_labels: { host_label: JSON.stringify(values.map((l) => ({ value: l.value }))) },
      },
    };
    onChange(new_query);
    onRunQuery();
  };

  render() {
    const hostLabelFilter = get(this, 'props.query.context.host_labels', {});
    const labels = JSON.parse(hostLabelFilter.host_label || '[]');
    return (
      <InlineField label="Host labels" labelWidth={14}>
        <MultiSelect
          options={this.state.options}
          placeholder="all"
          width={32}
          onChange={this.onLabelsChange}
          value={labels}
        />
      </InlineField>
    );
  }
}
