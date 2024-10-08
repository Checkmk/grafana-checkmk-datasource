import { SelectableValue } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import {
  AsyncMultiSelect,
  AsyncSelect,
  Button,
  Checkbox,
  Select as GrafanaSelect,
  InlineField,
  InlineFieldRow,
  Input,
  Label,
  Stack,
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
  showVariables?: false; // most of the dropdowns should show the variables,
  // but there are some exceptions we have to set manually.
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
  const { showVariables, autocompleter, width, value, onChange, label, inputId } = props;
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
        if (showVariables !== false) {
          for (const variable of getTemplateSrv().getVariables()) {
            data.splice(0, 0, {
              value: `$${variable.id}` as Value,
              label: `$${variable.id}`,
              isGrafanaVariable: true,
            });
          }
        }
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
    // in order to show the current value in formatOptionLabel callback, we
    // would need to trigger this function whenever the value of getVariables()
    // changes, which seems to be impossible?
    [autocompleter, value, showVariables]
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

  const formatOptionLabel = React.useCallback((option: SelectableValue<Value>) => {
    if (option.isGrafanaVariable !== true) {
      return option.label;
    }
    return (
      <span>
        {option.label}&nbsp;
        <i>(Variable)</i>
      </span>
    );
  }, []);

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
      formatOptionLabel={formatOptionLabel}
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
        inputId={`input_${props.label?.replace(/ /g, '_')}`}
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
    <Stack>
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
    </Stack>
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
    <Stack>
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
    </Stack>
  );
};

interface GenericFieldProps<Key extends RequestSpecStringKeys> extends CommonProps<RequestSpec[Key]> {
  requestSpecKey: Key;
  children?: React.ReactNode;
  width?: number;
  tooltip?: string;
  dataTestId?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}
export const GenericField = <T extends RequestSpecStringKeys>(props: GenericFieldProps<T>) => {
  const {
    label,
    width = 32,
    onChange,
    value,
    requestSpecKey,
    children = null,
    tooltip,
    placeholder = 'none',
    prefix,
    suffix,
  } = props;
  const { dataTestId = `${requestSpecKey}-filter-input` } = props;

  const [textValue, setTextValue] = React.useState(value !== undefined ? value : '');

  const debouncedOnChange = React.useMemo(
    () =>
      debounce((newValue) => {
        onChange(newValue);
      }, 1000),
    [onChange]
  );

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(event.target.value); // update text input
    debouncedOnChange(event.target.value); // only the last debounce call comes through
  };

  return (
    <Stack>
      <InlineField label={label} labelWidth={LABEL_WIDTH} tooltip={tooltip}>
        <>
          <Input
            width={width}
            type="text"
            value={textValue}
            onChange={onValueChange}
            placeholder={placeholder}
            data-test-id={dataTestId}
            prefix={prefix}
            suffix={suffix}
          />
          {children}
        </>
      </InlineField>
    </Stack>
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
      { value: 'isnot', label: '≠' },
    ]);
  const tagAutocompleter = React.useCallback(
    (prefix: string) => autocompleter(prefix, 'choices', { groupId: groupId || '' }),
    [autocompleter, groupId]
  );

  return (
    <Stack>
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
        onChange={(val: 'is' | 'isnot') => onChange({ ...value, operator: val ?? 'is' })}
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
    </Stack>
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
    <Stack direction="column" gap={1}>
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
    </Stack>
  );
};

interface HostLabelProps extends CommonProps<RequestSpec['host_labels']> {
  inputId: string;
  autocompleter: (value: string) => Promise<Array<SelectableValue<string>>>;
}

export const HostLabelFilter: React.FC<HostLabelProps> = (props) => {
  const { value, autocompleter, label, onChange, inputId } = props;

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
        inputId={inputId}
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

export interface OnlyActiveChildrenProps {
  children: ChildComponent[];
  requestSpec: Partial<RequestSpec>;
  restrictedChildrenChoice?: Array<keyof RequestSpec>;
  showRemoveButton?: boolean;
  showAddFilterDropdown?: boolean;
}

export const OnlyActiveChildren = (props: OnlyActiveChildrenProps): React.JSX.Element => {
  function isAllowedChild(child: keyof RequestSpec) {
    if (props.restrictedChildrenChoice === undefined) {
      return true;
    }
    return props.restrictedChildrenChoice.indexOf(child) !== -1;
  }

  const allComponents: Partial<Record<keyof RequestSpec, string>> = {};
  const initialActiveComponents = [];
  for (const child of props.children) {
    const requestSpecKey = child.props.requestSpecKey;
    const requestSpecValue = props.requestSpec[requestSpecKey];
    allComponents[requestSpecKey] = getLabel(child);
    if ((requestSpecValue !== undefined && requestSpecValue !== '') || props.showAddFilterDropdown === false) {
      if (isAllowedChild(requestSpecKey)) {
        initialActiveComponents.push(requestSpecKey);
      }
    }
  }

  const [activeComponents, setActiveComponents] = React.useState(initialActiveComponents);

  function availableComponentsOptions() {
    const result = [];
    for (const [componentKey, componentLabel] of Object.entries(allComponents)) {
      if (activeComponents.includes(componentKey)) {
        continue;
      }
      if (isAllowedChild(componentKey as keyof RequestSpec)) {
        result.push({ value: componentKey, label: componentLabel });
      }
    }
    return result;
  }

  function getLabel(elem: ChildComponent) {
    return elem.props['label'];
  }

  function getKey(elem: ChildComponent) {
    return elem.props['requestSpecKey'];
  }

  return (
    <Stack direction="column">
      <InlineFieldRow>
        {(props.showAddFilterDropdown === undefined || props.showAddFilterDropdown === true) && (
          <InlineField label="Filter" labelWidth={8}>
            <GrafanaSelect
              width={32}
              options={availableComponentsOptions()}
              // We know that the `value` prop will always be defined since `availableComponentsOptions` returns
              // an array of type `{value: string; label: string}`.
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              onChange={(value) => setActiveComponents((c) => [...c, value.value!])}
              value={{ label: 'Add Filter' }}
              inputId="input_add_filter"
            />
          </InlineField>
        )}
      </InlineFieldRow>
      <InlineFieldRow>
        <Stack direction="column">
          {props.children
            .filter((elem: ChildComponent) => {
              if (!React.isValidElement(elem)) {
                return false;
              }
              return activeComponents.includes(getKey(elem));
            })
            .map((elem: ChildComponent) => {
              if (props.showRemoveButton === undefined || props.showRemoveButton === true) {
                return (
                  <Stack key={getKey(elem)}>
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
                          result.splice(result.indexOf(elem.props.requestSpecKey), 1);
                          elem.props.onChange(undefined);
                          return result;
                        })
                      }
                    />
                    {elem}
                  </Stack>
                );
              } else {
                return elem;
              }
            })}
        </Stack>
      </InlineFieldRow>
    </Stack>
  );
};
