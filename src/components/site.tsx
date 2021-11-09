import React, { ChangeEvent } from 'react';
import { InlineField, Input, AsyncMultiSelect } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { EditorProps } from './types';
import { AsyncAutocomplete, vsAutocomplete } from './fields';
import { get, update } from 'lodash';

export const SiteFilter = (props: EditorProps) => {
  const getSites = (inputValue: string) =>
    props.datasource
      .doRequest({ refId: 'siteQuery', params: { action: 'get_user_sites' }, context: {} })
      .then((response) =>
        response.data.result
          .filter(([_, text]: [string, string]) => text.toLowerCase().includes(inputValue.toLowerCase()))
          .map(([value, text]: [string, string]) => ({ label: text, value: value }))
      )
      .then((sites) => [{ label: 'All Sites', value: '' }, ...sites]);

  return (
    <InlineField labelWidth={14} label="Site">
      <AsyncAutocomplete autocompleter={getSites} contextPath="context.siteopt.site" {...props} />
    </InlineField>
  );
};

export const HostFilter = (props: EditorProps) => {
  const hostVS = {
    ident: 'monitored_hostname',
    params: { strict: true, context: props.query.context },
  };
  return (
    <InlineField labelWidth={14} label="Hostname">
      <AsyncAutocomplete
        autocompleter={vsAutocomplete(props.datasource, hostVS)}
        contextPath="context.host.host"
        {...props}
      />
    </InlineField>
  );
};

export const HostRegExFilter = (props: EditorProps) => {
  const onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    update(query, 'context.hostregex.host_regex', () => event.target.value);
    onChange(query);
  };
  const hostRegEx = get(props, 'query.context.hostregex', {});
  return (
    <InlineField label="Hostname regex" labelWidth={14}>
      <Input width={32} type="text" value={hostRegEx.host_regex || ''} onChange={onHostChange} placeholder="none" />
    </InlineField>
  );
};

export const ServiceFilter = (props: EditorProps) => {
  const serviceVS = {
    ident: 'monitored_service_description',
    params: { strict: true, host: get(props, 'query.context.host.host', ''), context: props.query.context },
  };

  return (
    <InlineField labelWidth={14} label="Service">
      <AsyncAutocomplete
        autocompleter={vsAutocomplete(props.datasource, serviceVS)}
        contextPath="context.service.service"
        {...props}
      />
    </InlineField>
  );
};

export const ServiceRegExFilter = (props: EditorProps) => {
  const onServiceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    update(query, 'context.serviceregex.service_regex', () => event.target.value);
    onChange(query);
  };
  const serviceRegEx = get(props, 'query.context.serviceregex.service_regex', '');
  return (
    <InlineField label="Service regex" labelWidth={14}>
      <Input width={32} type="text" value={serviceRegEx} onChange={onServiceChange} placeholder="none" />
    </InlineField>
  );
};

export const HostLabelsFilter = ({ datasource, onChange, query, onRunQuery }: EditorProps) => {
  const valueListToSelect = (labels: Array<SelectableValue<string>>) =>
    labels.map(({ value }) => ({ label: value, value: value }));

  const getHostLabels = (inputValue: string) => {
    const search = inputValue.trim().toLowerCase();
    return datasource
      .restRequest('ajax_autocomplete_labels.py', {
        world: 'core',
        search_label: search,
      })
      .then((result) =>
        result.data.result.filter(({ value }: { value: string }) => value.toLowerCase().includes(search))
      )
      .then(valueListToSelect);
  };

  const onLabelsChange = (values: any[]) => {
    update(query, 'context.host_labels.host_label', () => JSON.stringify(values.map((l) => ({ value: l.value }))));
    onChange(query);
    onRunQuery();
  };

  const hostLabelFilter = get(query, 'context.host_labels.host_label', '[]');
  const labels = valueListToSelect(JSON.parse(hostLabelFilter));
  return (
    <InlineField label="Host labels" labelWidth={14}>
      <AsyncMultiSelect
        width={32}
        defaultOptions
        loadOptions={getHostLabels}
        onChange={onLabelsChange}
        value={labels}
        placeholder="Type to trigger search"
      />
    </InlineField>
  );
};
