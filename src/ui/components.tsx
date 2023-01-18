import { SelectableValue } from '@grafana/data';
import {
  AsyncMultiSelect,
  AsyncSelect,
  Button,
  Checkbox,
  Select as GrafanaSelect,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  Input,
  Label,
  VerticalGroup,
} from '@grafana/ui';
import { debounce } from 'lodash';
import React from 'react';

import {
  FullRequestSpec,
  NegatableOption,
  RequestSpec,
  RequestSpecNegatableOptionKeys,
  RequestSpecStringKeys,
  TagValue,
} from '../RequestSpec';

interface CheckMkAsyncSelectProps<T> {
  label?: string;
  requestSpecKey?: T;
  width?: number;
  autocompleter: (prefix: string) => Promise<Array<SelectableValue<NonNullable<T>>>>;
  onChange: (value: T) => void;
  value: T;
  inputId: string; // make the InlineField magic do its work // TODO: find better solution
}

export const CheckMkAsyncSelect = function <T>(props: CheckMkAsyncSelectProps<T>) {
  const { autocompleter, width, value, onChange, label, inputId } = props;
  const [options, setOptions] = React.useState([] as Array<SelectableValue<T>>);
  const [counter, setCounter] = React.useState(0);
  const [autocompleteError, setAutocompleteError] = React.useState('');

  function findValueInOptions() {
    const result = options.find((opt) => opt.value === value);
    if (result) {
      return result;
    }
    return null;
  }

  function getPlaceholder() {
    if (autocompleteError !== '') {
      return autocompleteError;
    }
    if (value !== undefined) {
      // if findValueInOptions returns non null, the return value here is
      // irrelevant, because the displayed option is shown, no need to
      // add a more complicated logic here.
      return `Could not find '${value}'`;
    }
    return 'Type to trigger search';
  }

  const loadOptions = React.useCallback(
    (inputValue: string): Promise<Array<SelectableValue<T>>> => {
      return autocompleter(inputValue).then(
        (data) => {
          setAutocompleteError('');
          setOptions(data);
          return data;
        },
        (error) => {
          if (error && error.message) {
            setAutocompleteError(error.message);
          }
          throw error;
        }
      );
    },
    [autocompleter]
  );

  React.useEffect(() => {
    setOptions([]);
    setCounter((c) => c + 1);
  }, [autocompleter, label]);

  const changed = (newValue: SelectableValue<T>) => {
    if (newValue.value === undefined) {
      throw new Error('Please report this error!');
    }
    onChange(newValue.value);
  };

  return (
    <AsyncSelect
      inputId={inputId}
      onChange={changed}
      defaultOptions={true}
      // there seems to be no official way to re-trigger the async select field
      // but there are many hacks: https://github.com/JedWatson/react-select/issues/1581
      key={`${Math.max(1, counter)}`} // ignore the first update
      loadOptions={loadOptions}
      width={width || 32}
      value={findValueInOptions()}
      placeholder={getPlaceholder()}
    />
  );
};

interface CheckMkSelectProps<Key extends RequestSpecStringKeys> {
  label?: string;
  requestSpecKey?: Key;
  autocompleter: (prefix: string) => Promise<Array<SelectableValue<NonNullable<FullRequestSpec[Key]>>>>;
  onChange: (value: FullRequestSpec[Key]) => void;
  value: FullRequestSpec[Key];
}

export const CheckMkSelect = <Key extends RequestSpecStringKeys>(props: CheckMkSelectProps<Key>) => {
  const { autocompleter, value, onChange, label } = props;

  return (
    <InlineField labelWidth={14} label={props.label}>
      <CheckMkAsyncSelect
        inputId={`input_${props.label}`}
        label={label}
        autocompleter={autocompleter}
        onChange={onChange}
        value={value}
      />
    </InlineField>
  );
};

// TODO: this and the component is mostly c&p from Filter
// perhps the negated part can be moved into its own component?
interface CheckMkSelectNegatableProps<Key extends RequestSpecNegatableOptionKeys> {
  label: string;
  requestSpecKey: Key;
  onChange: (value: FullRequestSpec[Key]) => void;
  value: RequestSpec[Key];
  autocompleter: (prefix: string) => Promise<Array<SelectableValue<string>>>;
}

export const CheckMkSelectNegatable = <T extends RequestSpecNegatableOptionKeys>(
  props: CheckMkSelectNegatableProps<T>
) => {
  const { onChange, label, autocompleter } = props;

  const value: NegatableOption =
    props.value === undefined
      ? {
          value: undefined,
          negated: false,
        }
      : { ...props.value };

  const onValueChange = (newValue: string | undefined) => {
    if (newValue === undefined) {
      throw 'this is an internal error, please report';
    }
    value.value = newValue;
    onChange(value);
  };

  const onNegateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    value.negated = event.target.checked;
    onChange(value);
  };

  return (
    <HorizontalGroup>
      <InlineField label={label} labelWidth={14}>
        <CheckMkAsyncSelect<string | undefined>
          inputId={`input_${props.label}`}
          label={label}
          autocompleter={autocompleter}
          onChange={onValueChange}
          value={value.value}
        />
      </InlineField>
      <Checkbox label="Negate" value={value.negated} onChange={onNegateChange} />
    </HorizontalGroup>
  );
};

interface FilterProps<Key extends RequestSpecNegatableOptionKeys> {
  label: string;
  requestSpecKey: Key;
  onChange: (value: FullRequestSpec[Key]) => void;
  value: RequestSpec[Key];
}

export const Filter = <T extends RequestSpecNegatableOptionKeys>(props: FilterProps<T>) => {
  const { onChange, label } = props;

  const value: NegatableOption =
    props.value === undefined
      ? {
          value: '',
          negated: false,
        }
      : { ...props.value };
  const [textValue, setTextValue] = React.useState(value !== undefined ? value.value : '');

  const debouncedOnChange = React.useMemo(
    () =>
      debounce((newValue) => {
        onChange(newValue);
      }, 1000),
    [onChange]
  );

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(event.target.value); // update text input
    value.value = event.target.value; // update value of this closure
    debouncedOnChange(value); // only the last debounce call comes through
  };

  const onNegateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    value.negated = event.target.checked;
    onChange(value);
  };

  return (
    <HorizontalGroup>
      <InlineField label={label} labelWidth={14}>
        <Input width={32} type="text" value={textValue} onChange={onValueChange} placeholder="none" />
      </InlineField>
      <Checkbox label="Negate" value={value.negated} onChange={onNegateChange} />
    </HorizontalGroup>
  );
};

const SingleTag = (props: {
  index: number;
  onChange: (newValue: TagValue) => void;
  value: TagValue | undefined;
  autocompleter: (
    // TODO: define type for this, perhaps remove context and name it directly groupId?
    prefix: string,
    mode: 'groups' | 'choices',
    context: Record<string, unknown>
  ) => Promise<Array<SelectableValue<string>>>;
}) => {
  const { onChange, autocompleter } = props;
  const value: TagValue = props.value === undefined ? { operator: 'is' } : props.value;
  const groupId = value.group;

  const groupAutocompleter = React.useCallback(
    (prefix: string) => autocompleter(prefix, 'groups', {}),
    [autocompleter]
  );
  const operatorAutocompleter = (prefix: string) =>
    Promise.resolve([
      { value: 'is', label: '=' },
      { value: 'is not', label: '≠' },
    ]);
  const tagAutocompleter = React.useCallback(
    (prefix: string) => autocompleter(prefix, 'choices', { groupId: groupId || '' }),
    [autocompleter, groupId]
  );

  return (
    <HorizontalGroup>
      <Label>Host tag {props.index}: </Label>
      <CheckMkAsyncSelect
        onChange={(val) => {
          onChange({ ...value, group: val ?? '' });
        }}
        value={value.group}
        inputId={'group'}
        autocompleter={groupAutocompleter}
      />
      <CheckMkAsyncSelect
        width={8}
        onChange={(val) => onChange({ ...value, operator: val ?? 'is' })}
        value={value.operator}
        autocompleter={operatorAutocompleter}
        inputId={'operator'}
      />
      <CheckMkAsyncSelect
        onChange={(val) => onChange({ ...value, tag: val ?? '' })}
        value={value.tag}
        inputId={'tag'}
        autocompleter={tagAutocompleter}
      />
    </HorizontalGroup>
  );
};

export const HostTagFilter: React.FC<{
  label: string;
  requestSpecKey: string;
  onChange: (newValue: [TagValue, TagValue, TagValue]) => void;
  value: [TagValue, TagValue, TagValue] | undefined;
  autocompleter: (
    prefix: string,
    mode: 'groups' | 'choices',
    context: Record<string, unknown>
  ) => Promise<Array<SelectableValue<string>>>;
  //dependantOn: unknown[];
}> = (props) => {
  const { value, autocompleter, onChange } = props;

  return (
    <VerticalGroup spacing="sm">
      {[...Array(3)].map((_, index) => (
        <SingleTag
          key={index}
          index={index}
          onChange={(tag: TagValue) => {
            const newValue: [TagValue, TagValue, TagValue] = Object.assign([], value);
            newValue[index] = tag;
            onChange(newValue);
          }}
          autocompleter={autocompleter}
          value={value !== undefined ? value[index] : undefined}
        />
      ))}
    </VerticalGroup>
  );
};

export const HostLabelFilter: React.FC<{
  label: string;
  requestSpecKey: string;
  onChange: (newValue: string[]) => void;
  value: string[] | undefined;
  autocompleter: (value: string) => Promise<Array<SelectableValue<string>>>;
}> = (props) => {
  const { value, autocompleter, label, onChange } = props;

  const onLabelsChange = (items: Array<SelectableValue<string>>) => {
    const result: string[] = [];
    for (const element of items) {
      if (element.value === undefined) {
        continue;
      }
      result.push(element.value);
    }
    onChange(result);
  };

  const toMultiSelectValue = (value: string[] | undefined) => {
    const result: Array<SelectableValue<string>> = [];
    for (const element of value || []) {
      result.push({ value: element, label: element });
    }
    return result;
  };

  return (
    <InlineField label={label} labelWidth={14}>
      <AsyncMultiSelect
        width={32}
        defaultOptions
        loadOptions={autocompleter}
        onChange={onLabelsChange}
        value={toMultiSelectValue(value)}
        placeholder="Type to trigger search"
      />
    </InlineField>
  );
};

export const OnlyActiveChildren = (props: { children: JSX.Element[]; requestSpec: RequestSpec }): JSX.Element => {
  const allComponents: string[] = [];
  const initialActiveComponents = [];
  for (const child of props.children) {
    allComponents.push(child.props.label);
    // TODO: would be cool to have a better typing here
    const requestSpecKey: keyof RequestSpec = child.props.requestSpecKey;
    const requestSpecValue = props.requestSpec[requestSpecKey];
    if (requestSpecValue !== undefined && requestSpecValue !== '') {
      initialActiveComponents.push(child.props.label);
    }
  }

  const [activeComponents, setActiveComponents] = React.useState(initialActiveComponents);

  function availableComponentsOptions() {
    const result = [];
    for (const component of allComponents) {
      if (activeComponents.includes(component)) {
        continue;
      }
      result.push({ value: component, label: component });
    }
    return result;
  }

  // TODO: better typing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getLabel(elem: any) {
    return elem.props['label'];
  }

  return (
    <InlineFieldRow>
      <InlineField label="Filter" labelWidth={8}>
        <GrafanaSelect
          width={32}
          options={availableComponentsOptions()}
          onChange={(value) => setActiveComponents((c) => [...c, value.value])}
          value={{ label: 'Add Filter' }}
        />
      </InlineField>
      <VerticalGroup>
        {React.Children.toArray(props.children)
          // TODO: this is a legacy API: https://beta.reactjs.org/apis/react/Children
          .filter((elem) => {
            if (!React.isValidElement(elem)) {
              return false;
            }
            return activeComponents.includes(getLabel(elem));
          })
          .map((elem) => (
            <HorizontalGroup key={getLabel(elem)}>
              <Button
                icon="minus"
                variant="secondary"
                onClick={() =>
                  setActiveComponents((c) => {
                    if (!React.isValidElement(elem)) {
                      return c;
                    }
                    const result = [...c];
                    result.splice(result.indexOf(elem.props.label), 1);
                    elem.props.onChange(undefined);
                    return result;
                  })
                }
              />
              {elem}
            </HorizontalGroup>
          ))}
      </VerticalGroup>
    </InlineFieldRow>
  );
};
