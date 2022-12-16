import React from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { CmkQuery, DataSourceOptions, GraphKind, ResponseDataAutocomplete } from '../types';
import { VerticalGroup } from '@grafana/ui';
import { CheckMkSelect, FilterEditor } from './components';
import { createAutocompleteConfig, Presentation } from './autocomplete';
import {
  defaultRequestSpec,
  dependsOnAll,
  dependsOnHost,
  dependsOnNothing,
  dependsOnService,
  dependsOnSite,
  RequestSpec,
} from '../RequestSpec';
import { titleCase } from '../utils';

type Props = QueryEditorProps<DataSource, CmkQuery, DataSourceOptions>;

export const QueryEditor = (props: Props): JSX.Element => {
  const { onChange, onRunQuery, datasource, query } = props;
  const [requestSpec, setRequestSpec] = React.useState(query.requestSpec || defaultRequestSpec);

  const editionMode = datasource.getEdition();

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

  const update = (rq: RequestSpec, key: string, value: unknown) => {
    const newRequestSpec = { ...rq, [key]: value };
    setRequestSpec(newRequestSpec)
    onChange({ ...query, requestSpec: newRequestSpec });
    onRunQuery();
  };

  const graphTypeCompleter = async (): Promise<Array<SelectableValue<GraphKind>>> => [
    { value: 'template', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];

  if (editionMode === 'RAW') {
    return (
      <VerticalGroup>
        <CheckMkSelect
          label={'Site'}
          requestSpec={requestSpec}
          requestSpecKey={'site'}
          update={update}
          autocompleter={autocomplete('sites')}
          dependantOn={dependsOnNothing()}
        />
        <CheckMkSelect
          label={'Host'}
          requestSpec={requestSpec}
          requestSpecKey={'host_name'}
          update={update}
          autocompleter={autocomplete('monitored_hostname')}
          dependantOn={dependsOnSite(requestSpec)}
        />
        <CheckMkSelect
          label={'Service'}
          requestSpec={requestSpec}
          requestSpecKey={'service'}
          update={update}
          autocompleter={autocomplete('monitored_service_description')}
          dependantOn={dependsOnHost(requestSpec)}
        />
        <CheckMkSelect
          requestSpec={requestSpec}
          requestSpecKey={'graph_type'}
          update={update}
          label={'Graph type'}
          autocompleter={graphTypeCompleter}
          dependantOn={dependsOnNothing()}
        />
        <CheckMkSelect
          requestSpec={requestSpec}
          requestSpecKey={'graph'}
          update={update}
          label={titleCase(requestSpec.graph_type ?? 'Template')}
          autocompleter={autocomplete(requestSpec.graph_type === 'metric' ? 'monitored_metrics' : 'available_graphs')}
          dependantOn={dependsOnAll(dependsOnService(requestSpec), requestSpec.graph_type)}
        />
      </VerticalGroup>
    );
  } else {
    // TODO: Recreate Filter Editor from requestSpec
    return (
      <VerticalGroup>
        <FilterEditor
          update={update}
          autocompleterFactory={autocomplete}
          requestSpec={requestSpec}
          labelAutocomplete={labelAutocomplete}
          completeTagChoices={completeTagChoices}
        />
        <CheckMkSelect
          label={'Aggregation'}
          requestSpec={requestSpec}
          requestSpecKey={'aggregation'}
          update={update}
          autocompleter={presentationCompleter}
          dependantOn={dependsOnNothing()}
        />
        <CheckMkSelect
          requestSpec={requestSpec}
          requestSpecKey={'graph_type'}
          update={update}
          label={'Graph type'}
          autocompleter={graphTypeCompleter}
          dependantOn={dependsOnNothing()}
        />
        <CheckMkSelect
          requestSpec={requestSpec}
          requestSpecKey={'graph'}
          update={update}
          label={titleCase(requestSpec.graph_type ?? 'Template')}
          autocompleter={autocomplete(requestSpec.graph_type === 'metric' ? 'monitored_metrics' : 'available_graphs')}
          dependantOn={dependsOnAll(dependsOnService(requestSpec), requestSpec.graph_type)}
        />
      </VerticalGroup>
    );
  }
};
