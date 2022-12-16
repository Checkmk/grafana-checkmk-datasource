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
import {
  dependsOnHost,
  dependsOnNothing,
  dependsOnSite,
  RequestSpec,
  RequestSpecNegatableOptionKeys,
  RequestSpecStringKeys,
  TagValue,
} from '../RequestSpec';
import { cloneDeep, get, isUndefined } from 'lodash';
import { titleCase } from '../utils';

async function asSelectableValue<T extends RequestSpecStringKeys>(
  loadOptions: (value: string) => Promise<Array<SelectableValue<string>>>,
  value: string
): Promise<SelectableValue<string> | undefined> {
  const options = await loadOptions('');
  return options.find((elem) => elem.value === value);
}

function findOption<T>(value: T, options: Array<SelectableValue<T>>): SelectableValue<T> | undefined {
  return options.filter((elem) => Object.is(value, elem.value))[0];
}

function updateOnDepChangeOnly<T extends { dependantOn: unknown[] }>(component: React.FunctionComponent<T>) {
  // TODO: unlog
  return React.memo(component, (prevProps, nextProps) => {
    return JSON.stringify(prevProps.dependantOn) === JSON.stringify(nextProps.dependantOn);
  });
}

export interface SelectProps<Key extends RequestSpecStringKeys> {
  label?: string;
  autocompleter: (value: string) => Promise<Array<SelectableValue<NonNullable<RequestSpec[Key]>>>>;
  requestSpec: RequestSpec;
  requestSpecKey: Key;
  update: (rq: RequestSpec, key: Key, value: RequestSpec[Key]) => void;
  dependantOn: unknown[];
}

export const CheckMkSelect = updateOnDepChangeOnly(<Key extends RequestSpecStringKeys>(props: SelectProps<Key>) => {
  const { autocompleter, requestSpec, requestSpecKey, dependantOn } = props;
  const [options, setOptions] = React.useState([] as Array<SelectableValue<RequestSpec[Key]>>);
  const [currentValue, setCurrentValue] = React.useState<SelectableValue<RequestSpec[Key]> | undefined>();
  const value = get(requestSpec, requestSpecKey);

  React.useEffect(() => {
    setCurrentValue(findOption(value, options));
  }, [setCurrentValue, value, options]);

  React.useEffect(() => {
    async function inner() {
      setOptions(await autocompleter(''));
    }

    inner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependantOn]);

  const onChange = (value: SelectableValue<RequestSpec[Key]>) => {
    props.update(props.requestSpec, props.requestSpecKey, value.value);
  };

  return (
    <InlineField labelWidth={14} label={props.label}>
      <GrafanaSelect
        inputId={`input_${props.label}`}
        onChange={onChange}
        options={options}
        width={32}
        value={currentValue}
        placeholder={'Type to trigger search'}
      />
    </InlineField>
  );
});

export interface FilterProps<T extends RequestSpecNegatableOptionKeys> {
  label: string;
  requestSpec: RequestSpec;
  requestSpecKey: T;
  update: (rq: RequestSpec, key: keyof RequestSpec, value: unknown) => void;
}

const Filter = <T extends RequestSpecNegatableOptionKeys>(props: FilterProps<T>) => {
  const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.update(props.requestSpec, props.requestSpecKey, {
      value: event.target.value,
      negated: props.requestSpec[props.requestSpecKey]?.negated ?? false,
    });
  };

  const onNegateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    props.update(props.requestSpec, props.requestSpecKey, {
      negated: checked,
      value: props.requestSpec[props.requestSpecKey]?.value ?? '',
    });
  };

  return (
    <HorizontalGroup>
      <InlineField label={props.label} labelWidth={14}>
        <Input
          width={32}
          type="text"
          value={props.requestSpec[props.requestSpecKey]?.value}
          onChange={onValueChange}
          placeholder="none"
        />
      </InlineField>
      <Checkbox label="Negate" value={props.requestSpec[props.requestSpecKey]?.negated} onChange={onNegateChange} />
    </HorizontalGroup>
  );
};

const SingleTag = (props: {
  index: number;
  setTag(value: TagValue): void;
  autocompleteTagGroups(value?: string): Promise<Array<SelectableValue<string>>>;
  autocompleteTagOptions(group?: string, value?: string): Promise<Array<SelectableValue<string>>>;
  initialState?: TagValue;
}) => {
  const { autocompleteTagGroups, autocompleteTagOptions } = props;
  const [state, setState] = React.useState(props.initialState);
  const [group, setGroup] = React.useState<SelectableValue<string> | undefined>();
  const [operator, setOperator] = React.useState('is');
  const [tag, setTag] = React.useState<SelectableValue<string> | undefined>();
  const cachedAutocompleteTagOptions = React.useCallback(autocompleteTagOptions, [autocompleteTagOptions]);
  const cachedAutocompleteTagGroups = React.useCallback(autocompleteTagGroups, [autocompleteTagGroups]);

  React.useEffect(() => {
    async function inner() {
      setGroup(await asSelectableValue(cachedAutocompleteTagGroups, props.initialState?.group ?? ''));
      if (props.initialState?.operator) {
        setOperator(props.initialState.operator);
      }
      if (props.initialState?.group) {
        setTag(
          await asSelectableValue(
            cachedAutocompleteTagOptions.bind(undefined, props.initialState.group),
            props.initialState?.tag ?? ''
          )
        );
      }
    }

    inner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publishState = (value: TagValue) => {
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
      <AsyncSelect
        onChange={(val) => publishState({ ...state, group: val.value ?? '' })}
        loadOptions={cachedAutocompleteTagGroups}
        value={group}
      />
      <GrafanaSelect
        width={8}
        options={tagOperators}
        onChange={(val) => publishState({ ...state, operator: val.value ?? 'is' })}
        value={operator}
      />
      <AsyncSelect
        key={JSON.stringify(state?.group)}
        onChange={(val) => publishState({ ...state, tag: val.value ?? '' })}
        loadOptions={cachedAutocompleteTagOptions.bind(undefined, state?.group)}
        value={tag}
      />
    </HorizontalGroup>
  );
};

const HostTagFilter: React.FC<{
  requestSpec: RequestSpec;
  update: (rq: RequestSpec, key: 'host_tags', value: TagValue[]) => void;
  autocompleteTagGroups(value?: string): Promise<Array<SelectableValue<string>>>;
  autocompleteTagOptions(group: string, value: string): Promise<Array<SelectableValue<string>>>;
  dependantOn: unknown[];
}> = (props) => {
  const { autocompleteTagGroups, autocompleteTagOptions } = props;
  const [tags, setTags] = React.useState(
    props.requestSpec.host_tags || ([{}, {}, {}] as [TagValue, TagValue, TagValue])
  );

  const setTagAtIndex = (index: number, value: TagValue) => {
    const copy = cloneDeep(tags);
    copy[index] = value;
    setTags(copy);
    props.update(
      props.requestSpec,
      'host_tags',
      tags.filter((tag) => !Object.is(tag, {}))
    );
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
          initialState={tags[index]}
        />
      ))}
    </VerticalGroup>
  );
};

const HostLabelFilter: React.FC<{
  requestSpec: RequestSpec;
  update: (rq: RequestSpec, labels: 'host_labels', value: string[]) => void;
  autocomplete: (value: string) => Promise<Array<SelectableValue<string>>>;
  dependantOn: unknown[];
}> = (props) => {
  const { autocomplete } = props;
  const [labels, setLabels] = React.useState([] as Array<SelectableValue<string>>);

  // TODO: are label values == label labels?

  const onLabelsChange = (items: Array<SelectableValue<string>>) => {
    setLabels(items);
    props.update(
      props.requestSpec,
      'host_labels',
      labels.map((val) => val.value).filter((val) => !isUndefined(val)) as string[]
    );
  };

  return (
    <InlineField label="Host labels" labelWidth={14}>
      <AsyncMultiSelect
        width={32}
        defaultOptions
        loadOptions={autocomplete}
        onChange={onLabelsChange}
        value={labels}
        placeholder="Type to trigger search"
      />
    </InlineField>
  );
};

const OnlyActiveChildren = (props: {
  children: JSX.Element[];
  update: (rq: RequestSpec, key: string, value: unknown) => void;
  removeComponent: (name: string) => void;
  activeComponents: string[];
  requestSpec: RequestSpec;
}): JSX.Element => {
  function cleanup(name: string) {
    props.removeComponent(name);
    props.update(props.requestSpec, name, undefined);
  }

  function getName(elem: any) {
    return elem.props['data-name'];
  }

  return (
    <VerticalGroup>
      {React.Children.toArray(props.children)
        .filter((elem) => props.activeComponents.includes(getName(elem)))
        .map((elem) => (
          <HorizontalGroup key={getName(elem)}>
            <Button icon="minus" variant="secondary" onClick={() => cleanup(getName(elem))} />
            {elem}
          </HorizontalGroup>
        ))}
    </VerticalGroup>
  );
};

export interface FilterEditorProps {
  requestSpec: RequestSpec;
  update: (rq: RequestSpec, key: string, value: unknown) => void;
  autocompleterFactory: (ident: string) => (value?: string) => Promise<Array<{ value: string; label: string }>>;
  labelAutocomplete: (value: string) => Promise<Array<SelectableValue<string>>>;
  completeTagChoices: (group: string, value: string) => Promise<Array<SelectableValue<string>>>;
}

export const FilterEditor: React.FC<FilterEditorProps> = (props) => {
  const allComponentNames: string[] = [
    'site',
    'host_name',
    'service',
    'host_name_regex',
    'service_regex',
    'host_labels',
    'host_tags',
    'service_in_group',
    'host_in_group',
  ];

  function allSetProperties(): string[] {
    return Object.entries(props.requestSpec)
      .filter(([key, _]) => typeof get(props.requestSpec, key) !== 'undefined')
      .filter(([key, _]) => allComponentNames.includes(key))
      .map((entry) => entry[0]);
  }

  const [activeComponents, setActiveComponents] = React.useState(allSetProperties() as string[]);

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
    copy.splice(copy.indexOf(name), 1);
    setActiveComponents(copy);
  }

  function labelCase(val: string) {
    return titleCase(val.replace(/_/g, ' '));
  }

  return (
    <InlineFieldRow>
      <InlineField label="Filter" labelWidth={8}>
        <GrafanaSelect
          width={32}
          options={allComponentNames
            .filter((val) => !activeComponents.includes(val))
            .map((val) => ({
              label: labelCase(val),
              value: val,
            }))}
          onChange={(selectableValue) => addComponent(selectableValue.value)}
          value={{ label: 'Add Filter' }}
        />
      </InlineField>
      <OnlyActiveChildren
        activeComponents={activeComponents}
        requestSpec={props.requestSpec}
        update={props.update}
        removeComponent={removeComponent}
      >
        <CheckMkSelect
          data-name="site"
          label="Site"
          autocompleter={props.autocompleterFactory('sites')}
          requestSpec={props.requestSpec}
          requestSpecKey={'site'}
          update={props.update}
          dependantOn={dependsOnNothing()}
        />
        <CheckMkSelect
          data-name="host_name"
          label="Host"
          autocompleter={props.autocompleterFactory('monitored_hostname')}
          requestSpec={props.requestSpec}
          requestSpecKey={'host_name'}
          update={props.update}
          dependantOn={dependsOnSite(props.requestSpec)}
        />
        <CheckMkSelect
          data-name="service"
          label="Service"
          autocompleter={props.autocompleterFactory('monitored_service_description')}
          requestSpec={props.requestSpec}
          requestSpecKey={'service'}
          update={props.update}
          dependantOn={dependsOnHost(props.requestSpec)}
        />
        <Filter
          data-name="host_name_regex"
          label="Host Regex"
          requestSpec={props.requestSpec}
          requestSpecKey="host_name_regex"
          update={props.update}
        />
        <Filter
          data-name="service_regex"
          label="Service Regex"
          requestSpec={props.requestSpec}
          requestSpecKey="service_regex"
          update={props.update}
        />
        <Filter
          data-name="host_in_group"
          label="Host in Group"
          requestSpec={props.requestSpec}
          requestSpecKey="host_in_group"
          update={props.update}
        />
        <Filter
          data-name="service_in_group"
          label="Service in Group"
          requestSpec={props.requestSpec}
          requestSpecKey="service_in_group"
          update={props.update}
        />
        <HostTagFilter
          data-name="host_tags"
          requestSpec={props.requestSpec}
          update={props.update}
          autocompleteTagGroups={props.autocompleterFactory('tag_groups')}
          autocompleteTagOptions={props.completeTagChoices}
          dependantOn={dependsOnSite(props.requestSpec)}
        />
        <HostLabelFilter
          data-name="host_labels"
          requestSpec={props.requestSpec}
          update={props.update}
          autocomplete={props.labelAutocomplete}
          dependantOn={dependsOnSite(props.requestSpec)}
        />
      </OnlyActiveChildren>
    </InlineFieldRow>
  );
};
