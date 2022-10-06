import React from 'react';
import { AsyncSelect, InlineField } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

export interface FilterProps {
  label: string;
  key: string;
  setFilter: (value: string) => void;
  autocompleter: (value: string) => Promise<Array<{ value: string; label: string; isDisabled: boolean }>>;
}

export const Filter = (props: FilterProps) => {
  const [filter, setFilter] = React.useState<SelectableValue<string>>();

  const onChange = (value: SelectableValue<string>) => {
    setFilter(value);
    props.setFilter(value.value ?? '');
  };

  return (
    <InlineField labelWidth={14} label={props.label}>
      <AsyncSelect
        inputId={`input_${props.label}`}
        onChange={onChange}
        loadOptions={props.autocompleter}
        defaultOptions
        cacheOptions
        value={filter}
        width={32}
        placeholder="Type to trigger search"
      />
    </InlineField>
  );
};
