import React from 'react';
import { AsyncSelect } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { AutoCompleteEditorProps } from './types';
import { get, update } from 'lodash';
import { DataSource } from '../DataSource';

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
    update(query, 'params.selections' + contextPath, () => value);
    onChange(query);
    onRunQuery();
  };

  const contextKey = JSON.stringify(query.context);

  return (
    <AsyncSelect
      onChange={onSelection}
      loadOptions={autocompleter}
      defaultOptions
      key={contextKey}
      value={get(query, 'params.selections' + contextPath, {})}
      width={32}
    />
  );
};
