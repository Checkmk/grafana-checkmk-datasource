import { get, update } from 'lodash';
import React from 'react';
import { InlineField, InlineFieldRow } from '@grafana/ui';
import { HostFilter, ServiceFilter, SiteFilter } from './site';
import { EditorProps } from './types';
import { AsyncAutocomplete, vsAutocomplete } from './fields';

const titleCase = (str: string) => str[0].toUpperCase() + str.slice(1).toLowerCase();

export const GraphOfServiceQuery = (props: EditorProps) => {
  update(props, 'query.params.graphMode', () => 'metric');

  return (
    <InlineFieldRow>
      <SiteFilter {...props} />
      <HostFilter {...props} />
      <ServiceFilter {...props} />
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
