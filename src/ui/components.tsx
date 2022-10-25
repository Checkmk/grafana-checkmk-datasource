import React from 'react';
import { SelectableValue } from '@grafana/data';
import { AsyncSelect, InlineField } from '@grafana/ui';

export interface FilterProps<FieldType> {
  label: string;
  dependantOn?: unknown[];
  setFilter: (value: FieldType) => void;
  autocompleter: (value: string) => Promise<Array<SelectableValue<FieldType>>>;
  default: FieldType;
}

export const Filter = <T extends string>(props: FilterProps<T>) => {
  const [filter, setFilter] = React.useState<SelectableValue<T>>();

  const onChange = (value: SelectableValue<T>) => {
    setFilter(value);
    props.setFilter(value.value ?? props.default);
  };

  const key = { key: props.dependantOn ? JSON.stringify(props.dependantOn.sort()) : undefined };

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
        {...key}
      />
    </InlineField>
  );
};

export const StringFilter = (props: Omit<FilterProps<string>, 'default'>) => {
  return <Filter default="" {...props} />;
};
