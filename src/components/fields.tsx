import React, { useState } from 'react';
import { AsyncSelect } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { EditorProps } from './types';
import { get, update } from 'lodash';

export const AsyncAutocomplete = ({ datasource, autocompleteConfig, onChange, query, contextPath }: EditorProps) => {
  //const [value, setValue] = useState<SelectableValue<string>>();
  const getAutocomplete = (inputValue: string) =>
    datasource
      .restRequest('ajax_vs_autocomplete.py', {
        ...autocompleteConfig,
        value: inputValue,
      })
      .then((result) =>
        result.data.result.choices.map(([value, label]: [string, string]) => ({
          value,
          label,
          isDisabled: value === null,
        }))
      );

  const onSelection = (value: SelectableValue<string>) => {
    //setValue(value);
    update(query, contextPath, () => value.value);
    onChange(query);
  };

  const selected = get(query, contextPath, '');
  const val = { value: selected, label: selected };
  console.log(this);

  return (
    <AsyncSelect
      defaultOptions
    cacheOptions={false}
      onChange={onSelection}
      loadOptions={getAutocomplete}
      prefix="HIO"
      width={32}
      placeholder="type to trigger search"
    />
  );
};
