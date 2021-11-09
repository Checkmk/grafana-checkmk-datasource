import { get, update } from 'lodash';
import React from 'react';
import { InlineField, InlineFieldRow } from '@grafana/ui';
import { HostFilter, ServiceFilter, SiteFilter } from './site';
import { EditorProps } from './types';
import { AsyncAutocomplete, vsAutocomplete, GraphType, titleCase } from './fields';

export const GraphOfServiceQuery = (props: EditorProps) => {
  update(props, 'query.params.graphMode', (x) => (x === 'combined' ? 'metric' : x));

  return (
    <InlineFieldRow>
      <SiteFilter {...props} />
      <HostFilter {...props} />
      <ServiceFilter {...props} />
      <GraphType contextPath="params.graphMode" {...props} autocompleter={(_) => new Promise(() => ({}))} />
      <MetricSelect {...props} />
    </InlineFieldRow>
  );
};

const MetricSelect = (props: EditorProps) => {
  const metricVS = {
    ident: props.query.params.graphMode === 'metric' ? 'metric_with_source' : 'available_graphs',
    params: {
      strict: true,
      context: get(props, 'query.context', {}),
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
