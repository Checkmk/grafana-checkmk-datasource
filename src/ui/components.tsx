import React from 'react';
import { SelectableValue } from '@grafana/data';
import {
  AsyncMultiSelect,
  AsyncSelect,
  Button,
  Checkbox,
  HorizontalGroup,
  InlineField,
  InlineFieldRow,
  Input,
  Label,
  Select as GrafanaSelect,
  VerticalGroup,
} from '@grafana/ui';
import { RequestSpec } from '../RequestSpec';

export interface SelectProps<FieldType> {
  label?: string;
  dependantOn?: unknown[];
  setValue: (value: FieldType) => void;
  autocompleter: (value: string) => Promise<Array<SelectableValue<FieldType>>>;
  defaultValue: SelectableValue<FieldType>;
  placeholder?: string;
}

export const Select = <T extends string>(props: SelectProps<T>) => {
  const { defaultValue } = props;
  const [filter, setFilter] = React.useState<SelectableValue<T>>();

  React.useEffect(() => {
    setFilter(defaultValue);
  }, [setFilter, defaultValue]);

  const onChange = (value: SelectableValue<T>) => {
    setFilter(value);
    props.setValue(value.value ?? props.defaultValue.value!);
  };

  const key = { key: props.dependantOn ? JSON.stringify(props.dependantOn.sort()) : undefined };

  return (
    <InlineField labelWidth={14} label={props.label}>
      <AsyncSelect
        inputId={`input_${props.label}`}
        onChange={onChange}
        loadOptions={props.autocompleter}
        defaultOptions
        width={32}
        value={filter}
        placeholder={props.placeholder ?? 'Type to trigger search'}
        {...key}
      />
    </InlineField>
  );
};

export const StringSelect: React.FC<Omit<SelectProps<string>, 'defaultValue'>> = (props) => {
  return <Select defaultValue={{ value: '', label: '' }} {...props} />;
};

export interface FilterProps {
  dependantOn?: unknown[];
  label: string;
  setFilter: (value: { value: string; negated: boolean }) => void;
}

const Filter: React.FC<FilterProps> = (props) => {
  const [filter, setFilter] = React.useState('');
  const [negated, setNegated] = React.useState(false);

  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
    props.setFilter({ value: filter ?? '', negated });
  };

  const onNegateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setNegated(checked);
    props.setFilter({ value: filter, negated: checked });
  };

  return (
    <HorizontalGroup>
      <InlineField
        label={props.label}
        labelWidth={14}
        key={props.dependantOn ? JSON.stringify(props.dependantOn) : undefined}
      >
        <Input width={32} type="text" value={filter} onChange={onValueChange} placeholder="none" />
      </InlineField>
      <Checkbox label="Negate" value={negated} onChange={onNegateChange} />
    </HorizontalGroup>
  );
};

const SingleTag = (props: {
  index: number;
  setTag(value: { group: string; tag: string; operator: string }): void;

  autocompleteTagGroups(group: string, value?: string): Promise<Array<{ value: string; label: string }>>;
  autocompleteTagOptions(group: string): Promise<Array<{ value: string; label: string }>>;
}) => {
  const [state, setState] = React.useState({ group: '', tag: '', operator: 'is' });

  const publishState = (value: { group: string; tag: string; operator: string }) => {
    setState(value);
    props.setTag(value);
  };

  const tagOperators = [
    { value: 'is', label: '=' },
    { value: 'is not', label: '≠' },
  ];

  return (
    <HorizontalGroup>
      <Label>Host tag {props.index}: </Label>
      <StringSelect
        setValue={(val) => publishState({ ...state, group: val })}
        autocompleter={props.autocompleteTagGroups}
      />
      <GrafanaSelect
        width={8}
        options={tagOperators}
        // TODO: pacify typescript
        onChange={(val) => publishState({ ...state, operator: val.value! })}
        value={state.operator}
      />
      <StringSelect
        dependantOn={[state.group]}
        setValue={(val) => publishState({ ...state, operator: val })}
        autocompleter={props.autocompleteTagOptions.bind(undefined, state.group)}
      />
    </HorizontalGroup>
  );
};

const HostTagFilter: React.FC<{
  dependantOn?: unknown[];
  setTags: (value: Array<{ group: string; tag: string; operator: 'is' | 'isnot' }>) => void;
  autocompleteTagGroups(value?: string): Promise<Array<{ value: string; label: string }>>;
  autocompleteTagOptions(group: string): Promise<Array<{ value: string; label: string }>>;
}> = (props) => {
  const { autocompleteTagGroups, autocompleteTagOptions } = props;
  const [tags, setTags] = React.useState([{}, {}, {}] as Array<{
    group: string;
    tag: string;
    operator: 'is' | 'isnot';
  }>);

  const setTagAtIndex = (index: number, value: { group: string; tag: string; operator: 'is' | 'isnot' }) => {
    const copy = tags.slice();
    copy[index] = value;
    props.setTags(copy);
    setTags(copy);
  };

  return (
    <VerticalGroup spacing="sm">
      {[...Array(3)].map((_, index) => (
        <SingleTag
          key={index}
          index={index}
          setTag={setTagAtIndex.bind(undefined, index)}
          autocompleteTagGroups={autocompleteTagGroups}
          autocompleteTagOptions={autocompleteTagOptions}
        />
      ))}
    </VerticalGroup>
  );
};

const HostLabelFilter: React.FC<{
  dependantOn?: unknown[];
  setLabels: (value: string[]) => void;
  autocomplete: (value: string) => Promise<Array<SelectableValue<string>>>;
}> = (props) => {
  const [labels, setLabels] = React.useState([] as Array<SelectableValue<string>>);

  const onLabelsChange = (items: Array<SelectableValue<string>>) => {
    setLabels(items);
    props.setLabels(items.map((val) => val.value!));
  };

  return (
    <InlineField label="Host labels" labelWidth={14}>
      <AsyncMultiSelect
        width={32}
        defaultOptions
        loadOptions={props.autocomplete}
        onChange={onLabelsChange}
        value={labels}
        placeholder="Type to trigger search"
      />
    </InlineField>
  );
};

export interface FilterEditorProps {
  requestSpec: RequestSpec;

  fieldSetterWrapper<T>(setter: (object: any, value: T) => void): (value: T) => void;

  autocompleterFactory(ident: string): (value?: string) => Promise<Array<{ value: string; label: string }>>;

  labelAutocomplete: (value: string) => Promise<SelectableValue<string>>;
  completeTagChoices: (group: string, value: string) => Promise<SelectableValue<string>>;
}

export const FilterEditor: React.FC<FilterEditorProps> = (props) => {
  const componentSpecs = {
    site: {
      name: 'Site',
      component: Select,
      props: {
        dependantOn: [],
        label: 'Site',
        setValue: props.fieldSetterWrapper((rs, value) => (rs.site = value)),
        autocompleter: props.autocompleterFactory('sites'),
      },
    },
    host: {
      name: 'Host',
      component: Select,
      props: {
        dependantOn: [props.requestSpec.site],
        label: 'Host',
        setValue: props.fieldSetterWrapper((rs, value) => (rs.host = value)),
        autocompleter: props.autocompleterFactory('monitored_hostname'),
      },
    },
    service: {
      name: 'Service',
      component: Select,
      props: {
        dependantOn: [props.requestSpec.site, props.requestSpec.host_name, props.requestSpec.host_name_regex],
        label: 'Service',
        setValue: props.fieldSetterWrapper((rs, value) => (rs.service = value)),
        autocompleter: props.autocompleterFactory('monitored_service_description'),
      },
    },
    host_name_regex: {
      name: 'Host Name Regex',
      component: Filter,
      props: {
        dependantOn: [],
        label: 'Host Regex',
        setFilter: props.fieldSetterWrapper((rs, value) => (rs.host_name_regex = value)),
      },
    },
    service_regex: {
      name: 'Service Regex',
      component: Filter,
      props: {
        dependantOn: [],
        label: 'Service Regex',
        setFilter: props.fieldSetterWrapper((rs, value) => (rs.service_regex = value)),
      },
    },
    host_in_group: {
      name: 'Host in Group',
      component: Filter,
      props: {
        dependantOn: [props.requestSpec.site],
        label: 'Host in Group',
        setFilter: props.fieldSetterWrapper((rs, value) => (rs.host_in_group = value)),
      },
    },
    service_in_group: {
      name: 'Service Group',
      component: Filter,
      props: {
        dependantOn: [props.requestSpec.site, props.requestSpec.host_name, props.requestSpec.host_name_regex],
        label: 'Host in Group',
        setFilter: props.fieldSetterWrapper((rs, value) => (rs.host_in_group = value)),
      },
    },
    host_tags: {
      name: 'Host Tags',
      component: HostTagFilter,
      props: {
        dependantOn: [props.requestSpec.site],
        setTags: props.fieldSetterWrapper((rs, value) => (rs.host_tags = value)),
        autocompleteTagGroups: props.autocompleterFactory('tag_groups'),
        autocompleteTagOptions: props.completeTagChoices,
      },
    },
    host_labels: {
      name: 'Host Labels',
      component: HostLabelFilter,
      props: {
        dependantOn: [props.requestSpec.site],
        setLabels: props.fieldSetterWrapper((rs, value) => (rs.host_labels = value)),
        autocomplete: props.labelAutocomplete,
      },
    },
  } as Record<string, { component: React.FC<unknown>; props: unknown; name: string }>;

  const [activeComponents, setActiveComponents] = React.useState([] as string[]);

  function addComponent(name?: string) {
    if (name === undefined) {
      return;
    }
    const copy = activeComponents.slice();
    copy.push(name);
    setActiveComponents(copy);
  }

  function removeComponent(name: string) {
    const copy = activeComponents.slice();
    delete copy[copy.indexOf(name)];
    setActiveComponents(copy);
  }

  return (
    <InlineFieldRow>
      <InlineField label="Filter" labelWidth={8}>
        <GrafanaSelect
          width={32}
          options={Object.entries(componentSpecs).map(([key, value]) => ({ label: value.name, value: key }))}
          onChange={(selectableValue) => addComponent(selectableValue.value)}
          placeholder="Add Filter"
        />
      </InlineField>
      <VerticalGroup>
        {activeComponents
          //          .sort((x, y) => x.localeCompare(y))
          .map((name) => (
            <HorizontalGroup key={name}>
              <Button icon="minus" variant="secondary" onClick={() => removeComponent(name)} />
              {React.createElement(componentSpecs[name].component, componentSpecs[name].props as undefined)}
            </HorizontalGroup>
          ))}
      </VerticalGroup>
    </InlineFieldRow>
  );
};
