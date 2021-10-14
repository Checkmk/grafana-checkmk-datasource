import { get, update } from 'lodash';
import React from 'react';
import { AsyncSelect, InlineField, InlineFieldRow } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { HostFilter, ServiceFilter, SiteFilter } from './site';
import { EditorProps } from './types';
import { vsAutocomplete } from './fields';

const titleCase = (str: string) => str[0].toUpperCase() + str.slice(1).toLowerCase();

export const GraphOfServiceQuery = (props: EditorProps) => (
  <InlineFieldRow>
    <SiteFilter {...props} />
    <HostFilter {...props} />
    <ServiceFilter {...props} />
    <MetricSelect {...props} />
  </InlineFieldRow>
);

const MetricSelect = ({ datasource, query, onChange, onRunQuery }: EditorProps) => {
  const metricVS = {
    ident: query.params.graphMode === 'metric' ? 'metric_with_source' : 'available_graphs',
    params: {
      strict: true,
      host: get(query, 'context.host.host', ''),
      service: get(query, 'context.service.service', ''),
    },
  };
  const getAutocomplete = vsAutocomplete(datasource, metricVS);
  const configPath = query.params.graphMode === 'metric' ? 'params.metric' : 'params.graph';
  const label = titleCase(query.params.graphMode || '');

  const onSelection = (value: SelectableValue<string>) => {
    update(query, configPath, () => value);
    onChange(query);
    onRunQuery();
  };

  return (
    <InlineField labelWidth={14} label={label}>
      <AsyncSelect
        onChange={onSelection}
        loadOptions={getAutocomplete}
        value={get(query, configPath, {})}
        width={32}
        placeholder={'Search'}
      />
    </InlineField>
  );
};
