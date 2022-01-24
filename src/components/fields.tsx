import React from 'react';
import { AsyncSelect, InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { AutoCompleteEditorProps, EditorProps } from './types';
import { get, update } from 'lodash';
import { DataSource } from '../DataSource';
import { combinedDesc } from 'graphspecs';

export const vsAutocomplete = (datasource: DataSource, autocompleteConfig: any) => (inputValue: string) =>
  datasource
    .restRequest('ajax_vs_autocomplete.py', {
      ...autocompleteConfig,
      value: inputValue.trim(),
    })
    .then((result) =>
      result.data.result.choices.map(([value, label]: [string, string]) => ({
        value,
        label,
        isDisabled: value === null,
      }))
    );

export const AsyncAutocomplete = ({
  autocompleter,
  onChange,
  onRunQuery,
  query,
  contextPath,
}: AutoCompleteEditorProps) => {
  const onSelection = (value: SelectableValue<string>) => {
    update(query, contextPath, () => value.value);
    update(query, 'params.selections.' + contextPath, () => value);
    onChange(query);
    onRunQuery();
  };

  let contextKey = JSON.stringify(query.context);

  // This is only to mark refresh on graph type selection as they are independent from context
  if (contextPath === 'params.metric' || contextPath === 'params.graph') {
    contextKey += contextPath;
  }
  return (
    <AsyncSelect
      onChange={onSelection}
      loadOptions={autocompleter}
      defaultOptions
      key={contextKey}
      value={get(query, 'params.selections.' + contextPath, {})}
      width={32}
    />
  );
};

export const titleCase = (str: string) => str[0].toUpperCase() + str.slice(1).toLowerCase();

export const GraphType = ({ query, onChange, contextPath }: AutoCompleteEditorProps) => {
  const graphTypes = [
    { value: 'template', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];
  const onGraphTypeChange = (value: SelectableValue<string>) => {
    update(query, contextPath, () => value.value);
    onChange(query);
  };

  return (
    <InlineField label="Graph type" labelWidth={14}>
      <Select
        width={32}
        options={graphTypes}
        onChange={onGraphTypeChange}
        value={get(query, contextPath, 'template')}
      />
    </InlineField>
  );
};

export const GraphSelect = (props: EditorProps) => {
  const graphMode = get(props, 'query.params.graphMode', 'template');
  let completionVS = {};
  if (props.edition === 'CEE') {
    completionVS = {
      ident: 'combined_graphs',
      params: {
        ...combinedDesc(props.query.context),
        presentation: props.query.params.presentation,
        mode: graphMode,
      },
    };
  } else if (props.edition === 'RAW') {
    completionVS = {
      ident: props.query.params.graphMode === 'metric' ? 'monitored_metrics' : 'available_graphs',
      params: {
        strict: 'withSource',
        context: get(props, 'query.context', {}),
      },
    };
  }

  const label = titleCase(graphMode);
  const autocompleter = vsAutocomplete(props.datasource, completionVS);

  return (
    <>
      <GraphType contextPath="params.graphMode" {...props} autocompleter={(_) => new Promise(() => ({}))} />
      <InlineField labelWidth={14} label={label}>
        <AsyncAutocomplete autocompleter={autocompleter} contextPath={'params.graph_name'} {...props} />
      </InlineField>
    </>
  );
};
