import { get, update } from 'lodash';
import React  from 'react';
import { AsyncSelect, InlineField, InlineFieldRow } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { HostFilter, ServiceFilter, SiteFilter } from './site';
import { EditorProps } from './types';
import { vsAutocomplete } from './fields';

export const GraphOfServiceQuery = (props: EditorProps) => (
  <InlineFieldRow>
    <SiteFilter {...props} />
    <HostFilter {...props} />
    <ServiceFilter {...props} />
    {props.query.graphMode === 'graph' && <GraphSelect {...props} />}
    {props.query.graphMode === 'metric' && <MetricSelect {...props} />}
  </InlineFieldRow>
);

const MetricSelect = ({ datasource, query, onChange, onRunQuery }: EditorProps) => {
  const metricVS = {
    ident: 'metric_with_source',
    params: {
      strict: true,
      host: get(query, 'context.host.host', ''),
      service: get(query, 'context.service.service', ''),
    },
  };
  const getAutocomplete = vsAutocomplete(datasource, metricVS);

  const onSelection = (value: SelectableValue<string>) => {
    update(query, 'params.metric', () => value);
    onChange(query);
    onRunQuery();
  };

  const selected = get(query, 'params.metric', {});
  return (
    <InlineField labelWidth={14} label="Metric">
      <AsyncSelect
        onChange={onSelection}
        loadOptions={getAutocomplete}
        value={selected}
        width={32}
        placeholder="Search metric"
      />
    </InlineField>
  );
};

const GraphSelect = ({ datasource, query, onChange, onRunQuery }: EditorProps) => {
  const metricVS = {
    ident: 'available_graphs',
    params: {
      strict: true,
      host: get(query, 'context.host.host', ''),
      service: get(query, 'context.service.service', ''),
    },
  };
  const getAutocomplete = vsAutocomplete(datasource, metricVS);

  const onGraphChange = (value: SelectableValue<number>) => {
    update(query, 'params.graph', () => value);
    onChange(query);
    onRunQuery();
  };

  const selected = get(query, 'params.graph', {});
  return (
    <InlineField labelWidth={14} label="Graph">
      <AsyncSelect
        width={32}
        loadOptions={getAutocomplete}
        onChange={onGraphChange}
        value={selected}
        placeholder="Search graph"
      />
    </InlineField>
  );
};
