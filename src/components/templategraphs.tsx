import { get, update } from 'lodash';
import React from 'react';
import { InlineField, InlineFieldRow, Select } from '@grafana/ui';
import { HostFilter, ServiceFilter, SiteFilter } from './site';
import { EditorProps } from './types';
import { AsyncAutocomplete, vsAutocomplete } from './fields';
import { SelectableValue } from '@grafana/data';

const titleCase = (str: string) => str[0].toUpperCase() + str.slice(1).toLowerCase();
const GraphType = ({ query, onChange }: EditorProps) => {
  const graphTypes = [
    { value: 'graph', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];
  const onGraphTypeChange = (value: SelectableValue<string>) => {
    update(query, 'params.graphMode', () => value.value);
    onChange(query);
  };

  return (
    <InlineField label="Graph type" labelWidth={14}>
      <Select width={32} options={graphTypes} onChange={onGraphTypeChange} value={get(query, 'params.graphMode', '')} />
    </InlineField>
  );
};

export const GraphOfServiceQuery = (props: EditorProps) => {
  update(props, 'query.params.graphMode', (x) => (x === 'combined' ? 'metric' : x));

  return (
    <InlineFieldRow>
      <SiteFilter {...props} />
      <HostFilter {...props} />
      <ServiceFilter {...props} />
      <GraphType {...props} />
      <MetricSelect {...props} />
    </InlineFieldRow>
  );
};

const MetricSelect = (props: EditorProps) => {
  const metricVS = {
    ident: props.query.params.graphMode === 'metric' ? 'metric_with_source' : 'available_graphs',
    params: {
      strict: true,
      host: get(props.query, 'context.host.host', ''),
      service: get(props.query, 'context.service.service', ''),
    },
  };
  const configPath = props.query.params.graphMode === 'metric' ? 'params.metric' : 'params.graph';
  const label = titleCase(props.query.params.graphMode || '');

  return (
    <InlineField labelWidth={14} label={label}>
      <AsyncAutocomplete
        autocompleter={vsAutocomplete(props.datasource, metricVS)}
        contextPath={configPath}
        {...props}
      />
    </InlineField>
  );
};
