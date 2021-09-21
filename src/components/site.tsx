import React, { ChangeEvent, PureComponent } from 'react';
import { InlineField, Input, AsyncSelect, AsyncMultiSelect } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { EditorProps, SelectOptions } from './types';
import { AsyncAutocomplete } from './fields';
import { get, update } from 'lodash';

export const SiteFilter = ({ datasource, query, onChange }: EditorProps) => {
  const getSites = () => datasource.sitesQuery().then((sites) => [{ label: 'All Sites', value: '' }, ...sites]);

  const onSiteIdChange = (value: SelectableValue<string>) => {
    update(query, 'context.siteopt.site', () => value.value);
    update(query, 'params.selections.siteopt', () => value);
    onChange(query);
  };

  return (
    <InlineField labelWidth={14} label="Site">
      <AsyncSelect
        width={32}
        defaultOptions
        cacheOptions
        loadOptions={getSites}
        value={get(query, 'params.selections.siteopt', {})}
        onChange={onSiteIdChange}
        placeholder="Select Site"
      />
    </InlineField>
  );
};

export const HostFilter = (props: EditorProps) => {
  const hostVS = {
    ident: 'monitored_hostname',
    params: { strict: true },
    contextPath: 'context.host.host',
  };
  return (
    <InlineField labelWidth={14} label="Hostname">
      <AsyncAutocomplete autocompleteConfig={hostVS} {...props} />
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
    params: { strict: true, host: get(props, 'query.context.host.host', '') },
    contextPath: 'context.service.service',
  };

  return (
    <InlineField labelWidth={14} label="Service">
      <AsyncAutocomplete autocompleteConfig={serviceVS} {...props} />
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
  const getHostLabels = (inputValue: string) => {
    return datasource
      .restRequest('ajax_autocomplete_labels.py', {
        world: 'core',
        search_label: inputValue.trim(),
      })
      .then((result) => valueListToSelect(result.data.result));
  };

  const valueListToSelect = (labels) => labels.map(({ value }: { value: string }) => ({ label: value, value: value }));

  const onLabelsChange = (values: any[]) => {
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

  const hostLabelFilter = get(query, 'context.host_labels', {});
  const labels = valueListToSelect(JSON.parse(hostLabelFilter.host_label || '[]'));
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
