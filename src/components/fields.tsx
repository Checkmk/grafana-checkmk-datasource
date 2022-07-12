import React from 'react';
import { AsyncSelect, InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { AutoCompleteEditorProps, EditorProps } from './types';
import { get, update as _update, cloneDeep } from 'lodash';
import { DataSource } from '../DataSource';
import { combinedDesc } from 'graphspecs';
import { MyQuery } from 'types';

const update = (x: MyQuery, path: string, func: () => SelectableValue<string> | string | undefined) => {
  const copy = cloneDeep(x);
  _update(copy, path, func);
  return copy;
};

export const vsAutocomplete = (datasource: DataSource, autocompleteConfig: any) => (inputValue: string) =>
  datasource
    .restRequest('ajax_vs_autocomplete.py', {
      ...autocompleteConfig,
      value: inputValue.trim(),
    })
    .then((result) =>
      result?.data.result.choices.map(([value, label]: [string, string]) => ({
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
    let newQuery = update(query, contextPath, () => value.value);
    newQuery = update(newQuery, 'params.selections.' + contextPath, () => value);
    onChange(newQuery);
    onRunQuery();
  };

  let contextKey = JSON.stringify(query.context);

  // This is only to mark refresh on graph type selection as they are independent from context
  if (contextPath === 'params.graph_name') {
    contextKey += get(query, 'params.graphMode');
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

export const GraphType = ({ query, onChange, onRunQuery, contextPath }: AutoCompleteEditorProps) => {
  const graphTypes = [
    { value: 'template', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];
  const onGraphTypeChange = (value: SelectableValue<string>) => {
    onChange(update(query, contextPath, () => value.value));
    onRunQuery();
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
        // 2.1.0 changed this parameter to:
        // strict: true,
        // show_independent_of_context: false,
        // but the defaults for missing values seem to be in our favour.
        context: get(props, 'query.context', {}),
      },
    };
  }

  const label = titleCase(graphMode);
  const autocompleter = vsAutocomplete(props.datasource, completionVS);

  const autocompleter_wrap = (inputValue: string) =>
    autocompleter(inputValue).then((choices) => {
      if (graphMode === 'template') {
        return choices.filter(({ value }: SelectableValue<string>) => value && !value.startsWith('METRIC_'));
      } else {
        return choices;
      }
    });

  return (
    <>
      <GraphType contextPath="params.graphMode" {...props} autocompleter={(_) => new Promise(() => ({}))} />
      <InlineField labelWidth={14} label={label}>
        <AsyncAutocomplete autocompleter={autocompleter_wrap} contextPath={'params.graph_name'} {...props} />
      </InlineField>
    </>
  );
};
