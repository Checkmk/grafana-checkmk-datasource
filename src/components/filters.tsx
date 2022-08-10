import React, { ChangeEvent } from 'react';
import {
  HorizontalGroup,
  VerticalGroup,
  Label,
  InlineField,
  Input,
  AsyncMultiSelect,
  Checkbox,
  InlineFieldRow,
  Select,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { EditorProps } from './types';
import { AsyncAutocomplete, vsAutocomplete } from './fields';
import { get, update, debounce } from 'lodash';
import { ResponseDataAutocompleteLabel } from 'types';

export const SiteFilter = (props: EditorProps): JSX.Element => {
  const sitesVS = { ident: 'sites', params: { strict: false, context: props.query.context } };

  return (
    <InlineField labelWidth={14} label="Site">
      <AsyncAutocomplete
        autocompleter={vsAutocomplete(props.datasource, sitesVS)}
        contextPath="context.siteopt.site"
        {...props}
      />
    </InlineField>
  );
};

export const HostFilter = (props: EditorProps): JSX.Element => {
  const hostVS = {
    ident: 'monitored_hostname',
    params: { strict: true, context: props.query.context },
  };
  return (
    <InlineField labelWidth={14} label="Hostname">
      <AsyncAutocomplete
        autocompleter={vsAutocomplete(props.datasource, hostVS)}
        contextPath="context.host.host"
        {...props}
      />
    </InlineField>
  );
};

const debouncedOnRunQuery = debounce((props: EditorProps) => {
  props.onRunQuery();
}, 500);

export const HostRegExFilter = (props: EditorProps): JSX.Element => {
  const onHostChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    update(query, 'context.hostregex.host_regex', () => event.target.value);
    onChange(query);
    debouncedOnRunQuery(props);
  };

  const onNegateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, onRunQuery, query } = props;
    update(query, 'context.hostregex.neg_host_regex', () => (event.target.checked ? 'on' : ''));
    onChange(query);
    onRunQuery();
  };

  const hostRegEx = get(props, 'query.context.hostregex', {});
  return (
    <InlineFieldRow>
      <InlineField label="Hostname regex" labelWidth={14}>
        <Input width={32} type="text" value={hostRegEx.host_regex || ''} onChange={onHostChange} placeholder="none" />
      </InlineField>
      <Checkbox label="negate" onChange={onNegateChange} />
    </InlineFieldRow>
  );
};

export const ServiceFilter = (props: EditorProps): JSX.Element => {
  const serviceVS = {
    ident: 'monitored_service_description',
    params: { strict: true, host: get(props, 'query.context.host.host', ''), context: props.query.context },
  };

  return (
    <InlineField labelWidth={14} label="Service">
      <AsyncAutocomplete
        autocompleter={vsAutocomplete(props.datasource, serviceVS)}
        contextPath="context.service.service"
        {...props}
      />
    </InlineField>
  );
};

export const ServiceRegExFilter = (props: EditorProps): JSX.Element => {
  const onServiceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = props;
    update(query, 'context.serviceregex.service_regex', () => event.target.value);
    onChange(query);
    debouncedOnRunQuery(props);
  };

  const onNegateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, onRunQuery, query } = props;
    update(query, 'context.serviceregex.neg_service_regex', () => (event.target.checked ? 'on' : ''));
    onChange(query);
    onRunQuery();
  };

  const serviceRegEx = get(props, 'query.context.serviceregex.service_regex', '');
  return (
    <InlineFieldRow>
      <InlineField label="Service regex" labelWidth={14}>
        <Input width={32} type="text" value={serviceRegEx} onChange={onServiceChange} placeholder="none" />
      </InlineField>
      <Checkbox label="negate" onChange={onNegateChange} />
    </InlineFieldRow>
  );
};

export const HostLabelsFilter = ({ datasource, onChange, query, onRunQuery }: EditorProps): JSX.Element => {
  const valueListToSelect = (labels: Array<SelectableValue<string>>) =>
    labels.map(({ value }) => ({ label: value, value: value }));

  const getHostLabels = (inputValue: string) => {
    const search = inputValue.trim().toLowerCase();
    return datasource
      .restRequest<ResponseDataAutocompleteLabel>('ajax_autocomplete_labels.py', {
        world: 'core',
        search_label: search,
      })
      .then((result) =>
        result?.data.result.filter(({ value }: { value: string }) => value.toLowerCase().includes(search))
      )
      .then(valueListToSelect);
  };

  const onLabelsChange = (values: Array<SelectableValue<string>>) => {
    update(query, 'context.host_labels.host_label', () => JSON.stringify(values.map((l) => ({ value: l.value }))));
    onChange(query);
    onRunQuery();
  };

  const hostLabelFilter = get(query, 'context.host_labels.host_label', '[]');
  const labels = valueListToSelect(JSON.parse(hostLabelFilter));
  return (
    <InlineField label="Host labels" labelWidth={14}>
      <AsyncMultiSelect
        width={32}
        defaultOptions
        loadOptions={getHostLabels}
        onChange={onLabelsChange}
        value={labels}
        placeholder="Type to trigger search"
      />
    </InlineField>
  );
};

export const HostGroupFilter = (props: EditorProps): JSX.Element => {
  const onNegateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, onRunQuery, query } = props;
    update(query, 'context.opthostgroup.neg_opthost_group', () => (event.target.checked ? 'on' : ''));
    onChange(query);
    onRunQuery();
  };

  const groupVS = {
    ident: 'allgroups',
    params: {
      group_type: 'host',
      strict: true,
      host: get(props, 'query.context.opthostgroup.opthost_group', ''),
      context: props.query.context,
    },
  };

  return (
    <InlineFieldRow>
      <InlineField label="Host is in Group" labelWidth={14}>
        <AsyncAutocomplete
          autocompleter={vsAutocomplete(props.datasource, groupVS)}
          contextPath="context.opthostgroup.opthost_group"
          {...props}
        />
      </InlineField>
      <Checkbox label="negate" onChange={onNegateChange} />
    </InlineFieldRow>
  );
};

export const ServiceGroupFilter = (props: EditorProps): JSX.Element => {
  const onNegateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, onRunQuery, query } = props;
    update(query, 'context.optservicegroup.neg_optservice_group', () => (event.target.checked ? 'on' : ''));
    onChange(query);
    onRunQuery();
  };

  const groupVS = {
    ident: 'allgroups',
    params: {
      group_type: 'service',
      strict: true,
      service: get(props, 'query.context.optservicegroup.optservice_group', ''),
      context: props.query.context,
    },
  };

  return (
    <InlineFieldRow>
      <InlineField label="Service is in Group" labelWidth={14}>
        <AsyncAutocomplete
          autocompleter={vsAutocomplete(props.datasource, groupVS)}
          contextPath="context.optservicegroup.optservice_group"
          {...props}
        />
      </InlineField>
      <Checkbox label="negate" onChange={onNegateChange} />
    </InlineFieldRow>
  );
};

interface HostTagsEditorProps extends EditorProps {
  index: number;
}

export const HostTagsItemFilter = (props: HostTagsEditorProps): JSX.Element => {
  const index = props.index;

  const groupVS = {
    ident: 'tag_groups',
    params: {
      context: props.query.context,
    },
  };
  const optionVS = {
    ident: 'tag_groups_opt',
    params: {
      group_id: get(props, `query.context.host_tags.host_tag_${index}_grp`, ''),
      context: props.query.context,
    },
  };
  const tag_operators = [
    { value: 'is', label: 'is' },
    { value: 'isnot', label: 'is not' },
  ];
  const onOperatorChange = (value: SelectableValue<string>) => {
    update(props.query, `context.host_tags.host_tag_${index}_op`, () => value.value);
    props.onChange(props.query);
    props.onRunQuery();
  };

  return (
    <>
      <VerticalGroup spacing="sm">
        <HorizontalGroup>
          <Label>Host tag {index + 1}: </Label>
          <AsyncAutocomplete
            autocompleter={vsAutocomplete(props.datasource, groupVS)}
            contextPath={`context.host_tags.host_tag_${index}_grp`}
            {...props}
          />
          <Select
            width={8}
            options={tag_operators}
            onChange={onOperatorChange}
            value={get(props.query, `context.host_tags.host_tag_${index}_op`)}
          />

          <AsyncAutocomplete
            autocompleter={vsAutocomplete(props.datasource, optionVS)}
            contextPath={`context.host_tags.host_tag_${index}_val`}
            {...props}
          />
        </HorizontalGroup>
      </VerticalGroup>
    </>
  );
};

export const HostTagsFilter = (props: EditorProps): JSX.Element => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, idx) => (
        <HostTagsItemFilter key={idx} index={idx} {...props} />
      ))}
    </>
  );
};
