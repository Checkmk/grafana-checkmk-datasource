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
import { debounce, isNull } from 'lodash';
import React, { JSXElementConstructor } from 'react';

import {
  FilterEditorKeys,
  NegatableOption,
  RequestSpec,
  RequestSpecNegatableOptionKeys,
  RequestSpecStringKeys,
  TagValue,
} from '../RequestSpec';

const LABEL_WIDTH = 16;

interface CommonProps<T> {
  label?: string;
  requestSpecKey?: string;
  onChange(value: T): void;
  value: T;
}

interface CheckMkAsyncSelectProps<Key extends keyof RequestSpec> extends CommonProps<RequestSpec[Key]> {
  width?: number;
  requestSpecKey?: Key;
  autocompleter: (prefix: string) => Promise<Array<SelectableValue<NonNullable<RequestSpec[Key]>>>>;
  inputId: string; // make the InlineField magic do its work // TODO: find better solution
}

interface CheckMkGenericAsyncSelectProps<Value> extends CommonProps<Value> {
  width?: number;
  autocompleter: (prefix: string) => Promise<Array<SelectableValue<NonNullable<Value>>>>;
  inputId: string; // make the InlineField magic do its work // TODO: find better solution
}

function findValueInOptions<Value>(lookupOptions: Array<NonNullable<SelectableValue<Value>>>, value: Value) {
  const result = lookupOptions.find((opt) => opt.value === value);
  if (result !== undefined) {
    return result;
  }
  return null;
}

export const CheckMkGenericAsyncSelect = function <Value extends string | (string | undefined)>(
  props: CheckMkGenericAsyncSelectProps<Value>
) {
  const { autocompleter, width, value, onChange, label, inputId } = props;
  const [options, setOptions] = React.useState([] as Array<SelectableValue<Value>>);
  const [counter, setCounter] = React.useState(0);
  const [autocompleteError, setAutocompleteError] = React.useState('');

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
    async (inputValue: string): Promise<Array<SelectableValue<Value>>> => {
      try {
        const data = await autocompleter(inputValue);
        setAutocompleteError('');
        if (value !== null && value !== undefined && inputValue === '' && isNull(findValueInOptions(data, value))) {
          // when we load the query editor with a saved configuration it is
          // possible, that the value saved is not present in the autocompleter
          // values which got queried with an empty string. (the autocompleter
          // only returns the first 100 matching elements).
          // this would mean we would display an error "could not find element 'xxx'"
          // in order to prevent that, we do an additional query, with the
          // value to make sure we receive the value (and label).
          const specificData = await autocompleter(value);
          data.push(...specificData);
        }
        setOptions(data);
        return data;
      } catch (e) {
        const error = e as Error;
        if (error && error.message) {
          setAutocompleteError(error.message);
        }
        throw error;
      }
    },
    [autocompleter, value]
  );

  React.useEffect(() => {
    setOptions([]);
    setCounter((c) => c + 1);
  }, [autocompleter, label]);

  const changed = (newValue: SelectableValue<Value>) => {
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
      value={findValueInOptions(options, value)}
      placeholder={getPlaceholder()}
    />
  );
};
export const CheckMkAsyncSelect = function <Key extends RequestSpecStringKeys>(props: CheckMkAsyncSelectProps<Key>) {
  return CheckMkGenericAsyncSelect<RequestSpec[Key]>(props);
};

interface CheckMkSelectProps<Key extends RequestSpecStringKeys> extends CommonProps<RequestSpec[Key]> {
  autocompleter: (prefix: string) => Promise<Array<SelectableValue<NonNullable<RequestSpec[Key]>>>>;
}

export const CheckMkSelect = <Key extends RequestSpecStringKeys>(props: CheckMkSelectProps<Key>) => {
  const { autocompleter, value, onChange, label } = props;

  return (
    <InlineField labelWidth={LABEL_WIDTH} label={props.label}>
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
  onChange: (value: RequestSpec[Key]) => void;
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
      <InlineField label={label} labelWidth={LABEL_WIDTH}>
        <CheckMkAsyncSelect
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

interface FilterProps<Key extends RequestSpecNegatableOptionKeys> extends CommonProps<RequestSpec[Key]> {
  requestSpecKey: Key;
}

export const Filter = <T extends RequestSpecNegatableOptionKeys>(props: FilterProps<T>) => {
  const { onChange, label, requestSpecKey } = props;

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
      <InlineField label={label} labelWidth={LABEL_WIDTH}>
        <Input
          width={32}
          type="text"
          value={textValue}
          onChange={onValueChange}
          placeholder="none"
          data-test-id={`${requestSpecKey}-filter-input`}
        />
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
      <CheckMkGenericAsyncSelect<string | undefined>
        onChange={(val) => {
          onChange({ ...value, group: val ?? '' });
        }}
        value={value.group}
        inputId={'group'}
        autocompleter={groupAutocompleter}
      />
      <CheckMkGenericAsyncSelect<string | undefined>
        width={8}
        onChange={(val) => onChange({ ...value, operator: val ?? 'is' })}
        value={value.operator}
        autocompleter={operatorAutocompleter}
        inputId={'operator'}
      />
      <CheckMkGenericAsyncSelect<string | undefined>
        onChange={(val) => onChange({ ...value, tag: val ?? '' })}
        value={value.tag}
        inputId={'tag'}
        autocompleter={tagAutocompleter}
      />
    </HorizontalGroup>
  );
};

interface HostTagFilterProps extends CommonProps<RequestSpec['host_tags']> {
  autocompleter: (
    prefix: string,
    mode: 'groups' | 'choices',
    context: Record<string, unknown>
  ) => Promise<Array<SelectableValue<string>>>;
}

export const HostTagFilter: React.FC<HostTagFilterProps> = (props) => {
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

interface HostLabelProps extends CommonProps<RequestSpec['host_labels']> {
  autocompleter: (value: string) => Promise<Array<SelectableValue<string>>>;
}

export const HostLabelFilter: React.FC<HostLabelProps> = (props) => {
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
    <InlineField label={label} labelWidth={LABEL_WIDTH}>
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

interface TopLevelComponentProps<Key extends keyof RequestSpec> {
  label: string;
  requestSpecKey: Key;
  onChange(value: RequestSpec[Key]): void;
}

type ChildComponent = React.ReactElement<TopLevelComponentProps<FilterEditorKeys>, JSXElementConstructor<unknown>>;

export const OnlyActiveChildren = (props: { children: ChildComponent[]; requestSpec: RequestSpec }): JSX.Element => {
  const allComponents: string[] = [];
  const initialActiveComponents = [];
  for (const child of props.children) {
    allComponents.push(child.props.label);
    const requestSpecKey = child.props.requestSpecKey;
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

  function getLabel(elem: ChildComponent) {
    return elem.props['label'];
  }

  return (
    <InlineFieldRow>
      <InlineField label="Filter" labelWidth={8}>
        <GrafanaSelect
          width={32}
          options={availableComponentsOptions()}
          // We know that the `value` prop will always be defined since `availableComponentsOptions` returns
          // an array of type `{value: string; label: string}`.
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          onChange={(value) => setActiveComponents((c) => [...c, value.value!])}
          value={{ label: 'Add Filter' }}
          data-testid="addFilter"
        />
      </InlineField>
      <VerticalGroup>
        {props.children
          .filter((elem: ChildComponent) => {
            if (!React.isValidElement(elem)) {
              return false;
            }
            return activeComponents.includes(getLabel(elem));
          })
          .map((elem: ChildComponent) => (
            <HorizontalGroup key={getLabel(elem)}>
              <Button
                icon="minus"
                data-test-id={'cmk-oac-minus-button-' + getLabel(elem)}
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
