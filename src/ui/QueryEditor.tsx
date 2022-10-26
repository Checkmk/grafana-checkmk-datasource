import React from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { CmkQuery, DataSourceOptions, GraphKind, ResponseDataAutocomplete } from '../types';
import { cloneDeep } from 'lodash';
import { InlineFieldRow, VerticalGroup } from '@grafana/ui';
import { FilterEditor, Select, StringSelect } from './components';
import { createAutocompleteConfig, Presentation } from './autocomplete';
import { defaultRequestSpec, RequestSpec } from '../RequestSpec';
import { titleCase } from '../utils';

type Props = QueryEditorProps<DataSource, CmkQuery, DataSourceOptions>;

export const QueryEditor = (props: Props): JSX.Element => {
  const { onChange, onRunQuery, datasource, query } = props;
  const requestSpec = query.requestSpec || defaultRequestSpec;

  const editionMode = datasource.getEdition();

  function isMinimalRequest(spec: RequestSpec) {
    // The UI doesn't give you any choices for a graph until it has enough information to get data, so this should be fine
    return spec.graph !== '';
  }

  const autocomplete =
    (ident: string) =>
    async (value = '') => {
      const response = await props.datasource.autocompleterRequest<ResponseDataAutocomplete>(
        'ajax_vs_autocomplete.py',
        createAutocompleteConfig(requestSpec, ident, value)
      );
      return response.data.result.choices.map(([value, label]: [string, string]) => ({
        value,
        label,
      }));
    };

  const labelAutocomplete = async (value: string) => {
    const response = await props.datasource.autocompleterRequest<Array<{ value: string }>>(
      'ajax_autocomplete_labels.py',
      {
        world: 'core',
        search_label: value,
      }
    );
    return response.data.result.map((val: { value: string }) => ({ value: val.value, label: val.value }));
  };

  const completeTagChoices = async (tagGroupId: string, value: string) => {
    const response = await props.datasource.autocompleterRequest<ResponseDataAutocomplete>('ajax_vs_autocomplete.py', {
      ident: 'tag_groups_opt',
      params: { group_id: tagGroupId, strict: true },
      value: value,
    });
    return response.data.result.choices.map(([value, label]: [string, string]) => ({
      value,
      label,
    }));
  };

  const presentationCompleter = async (): Promise<Array<SelectableValue<Presentation>>> => [
    { value: 'lines', label: 'Lines' },
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
  ];

  const fieldSetter = function <T>(setter: (requestSpec: RequestSpec, value: T) => void) {
    return (value: T): void => {
      const copy = cloneDeep(requestSpec);
      setter(copy, value);

      onChange({ ...query, requestSpec: copy });
      if (isMinimalRequest(copy)) {
        onRunQuery();
      }
    };
  };

  const graphTypeCompleter = async (): Promise<Array<SelectableValue<GraphKind>>> => [
    { value: 'template', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];

  const graphTypeSelect = (
    <Select
      label={'Graph type'}
      setValue={fieldSetter((rs, value) => (rs.graph_type = value))}
      autocompleter={graphTypeCompleter}
      defaultValue={{ value: 'template', label: 'Template' }}
    />
  );

  const graphNameSelect = (
    <StringSelect
      dependantOn={[requestSpec]}
      label={titleCase(requestSpec.graph_type)}
      setValue={fieldSetter((rs, value) => (rs.graph = value))}
      autocompleter={autocomplete(requestSpec.graph_type === 'metric' ? 'monitored_metrics' : 'available_graphs')}
    />
  );

  if (editionMode === 'RAW') {
    return (
      <InlineFieldRow>
        <StringSelect
          label={'Site'}
          setValue={fieldSetter((rs, value) => (rs.site = value))}
          autocompleter={autocomplete('sites')}
        />
        <StringSelect
          dependantOn={[requestSpec.site]}
          label={'Host'}
          setValue={fieldSetter((rs, value) => (rs.host_name = value))}
          autocompleter={autocomplete('monitored_hostname')}
        />
        <StringSelect
          dependantOn={[requestSpec.host_name, requestSpec.site]}
          label={'Service'}
          setValue={fieldSetter((rs, value) => (rs.service = value))}
          autocompleter={autocomplete('monitored_service_description')}
        />
        {graphTypeSelect}
        {graphNameSelect}
      </InlineFieldRow>
    );
  } else {
    return (
      <VerticalGroup>
        <FilterEditor
          fieldSetterWrapper={fieldSetter}
          autocompleterFactory={autocomplete}
          requestSpec={requestSpec}
          labelAutocomplete={labelAutocomplete}
          completeTagChoices={completeTagChoices}
        />
        <Select
          label={'Aggregation'}
          setValue={fieldSetter((rq, value) => (rq.aggregation = value))}
          autocompleter={presentationCompleter}
          defaultValue={{ value: 'lines', label: 'Lines' }}
        />
        {graphTypeSelect}
        {graphNameSelect}
      </VerticalGroup>
    );
  }
};
