import React from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { CmkQuery, DataSourceOptions, GraphKind, ResponseDataAutocomplete } from '../types';
import { InlineFieldRow, VerticalGroup } from '@grafana/ui';
import { FilterEditor, Select } from './components';
import { createAutocompleteConfig, Presentation } from './autocomplete';
import { defaultRequestSpec, RequestSpec } from '../RequestSpec';
import { titleCase } from '../utils';
import { isUndefined } from 'lodash';

type Props = QueryEditorProps<DataSource, CmkQuery, DataSourceOptions>;

export const QueryEditor = (props: Props): JSX.Element => {
  const { onChange, onRunQuery, datasource, query } = props;
  const [requestSpec, setRequestSpec] = React.useState(query.requestSpec || defaultRequestSpec);

  const editionMode = datasource.getEdition();

  function isMinimalRequest(spec: RequestSpec) {
    // The UI doesn't give you any choices for a graph until it has enough information to get data, so this should be fine
    return !isUndefined(spec.graph) && spec.graph !== '';
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

  React.useEffect(() => {
    onChange({ ...query, requestSpec: requestSpec });
    if (isMinimalRequest(requestSpec)) {
      onRunQuery();
    }
    // eslint-disable-next-line  react-hooks/exhaustive-deps
  }, [requestSpec]);

  const update = (rq: RequestSpec, key: string, value: unknown) => {
    setRequestSpec({ ...rq, [key]: value });
  };

  const graphTypeCompleter = async (): Promise<Array<SelectableValue<GraphKind>>> => [
    { value: 'template', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];

  if (editionMode === 'RAW') {
    return (
      <InlineFieldRow>
        <Select
          label={'Site'}
          requestSpec={requestSpec}
          requestSpecKey={'site'}
          update={update}
          autocompleter={autocomplete('sites')}
        />
        <Select
          label={'Host'}
          requestSpec={requestSpec}
          requestSpecKey={'host_name'}
          update={update}
          autocompleter={autocomplete('monitored_hostname')}
        />
        <Select
          label={'Service'}
          requestSpec={requestSpec}
          requestSpecKey={'service'}
          update={update}
          autocompleter={autocomplete('monitored_service_description')}
        />

        <Select
          requestSpec={requestSpec}
          requestSpecKey={'graph_type'}
          update={update}
          label={'Graph type'}
          autocompleter={graphTypeCompleter}
        />
        <Select
          requestSpec={requestSpec}
          requestSpecKey={'graph'}
          update={update}
          label={titleCase(requestSpec.graph_type ?? 'Template')}
          autocompleter={autocomplete(requestSpec.graph_type === 'metric' ? 'monitored_metrics' : 'available_graphs')}
        />
      </InlineFieldRow>
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
        <Select
          label={'Aggregation'}
          requestSpec={requestSpec}
          requestSpecKey={'aggregation'}
          update={update}
          autocompleter={presentationCompleter}
        />
        <Select
          requestSpec={requestSpec}
          requestSpecKey={'graph_type'}
          update={update}
          label={'Graph type'}
          autocompleter={graphTypeCompleter}
        />
        <Select
          requestSpec={requestSpec}
          requestSpecKey={'graph'}
          update={update}
          label={titleCase(requestSpec.graph_type ?? 'Template')}
          autocompleter={autocomplete(requestSpec.graph_type === 'metric' ? 'monitored_metrics' : 'available_graphs')}
        />
      </VerticalGroup>
    );
  }
};
