import React from 'react';
import { AsyncSelect } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { EditorProps } from './types';
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

export const AsyncAutocomplete = ({ datasource, autocompleteConfig, onChange, query, contextPath }: EditorProps) => {
  const getAutocomplete = vsAutocomplete(datasource, autocompleteConfig);
  const onSelection = ({ value }: SelectableValue<string>) => {
    update(query, contextPath, () => value);
    onChange(query);
  };

  const selected = get(query, contextPath, '');
  const val = { value: selected, label: selected };

  return <AsyncSelect onChange={onSelection} loadOptions={getAutocomplete} value={val} width={32} />;
};
