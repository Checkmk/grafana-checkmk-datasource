import React from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { CmkQuery, DataSourceOptions, ResponseDataAutocomplete } from '../types';
import { cloneDeep } from 'lodash';
import { InlineFieldRow } from '@grafana/ui';
import { Filter, StringFilter } from './components';
import { createAutocompleteConfig } from './autocomplete';
import { defaultRequestSpec, RequestSpec } from '../RequestSpec';
import { titleCase } from '../utils';

type GraphKind = 'template' | 'metric';

type Props = QueryEditorProps<DataSource, CmkQuery, DataSourceOptions>;

export const QueryEditor = (props: Props): JSX.Element => {
  const { onChange, onRunQuery, datasource, query } = props;
  const requestSpec = query.requestSpec || defaultRequestSpec;

  const editionMode = datasource.getEdition() ?? 'RAW';

  function isMinimalRequest(spec: RequestSpec) {
    return [spec.site, spec.host_name, spec.service, spec.graph_type, spec.graph].map(Boolean).reduce((x, y) => x && y);
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

  const graphTypeCompleter = async () =>
    [
      { value: 'template', label: 'Template' },
      { value: 'metric', label: 'Single metric' },
    ] as Array<SelectableValue<GraphKind>>;

  if (editionMode === 'RAW') {
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

    return (
      <InlineFieldRow>
        <StringFilter
          label={'Site'}
          setFilter={fieldSetter((rs, value) => (rs.site = value))}
          autocompleter={autocomplete('sites')}
        />
        <StringFilter
          dependantOn={[requestSpec.site]}
          label={'Host'}
          setFilter={fieldSetter((rs, value) => (rs.host_name = value))}
          autocompleter={autocomplete('monitored_hostname')}
        />
        <StringFilter
          dependantOn={[requestSpec.host_name, requestSpec.site]}
          label={'Service'}
          setFilter={fieldSetter((rs, value) => (rs.service = value))}
          autocompleter={autocomplete('monitored_service_description')}
        />
        <Filter
          dependantOn={[]}
          label={'Graph type'}
          setFilter={fieldSetter((rs, value) => (rs.graph_type = value))}
          autocompleter={graphTypeCompleter}
          default={'template' as GraphKind}
        />
        <StringFilter
          dependantOn={[requestSpec.service, requestSpec.host_name, requestSpec.site, requestSpec.graph_type]}
          label={titleCase(requestSpec.graph_type)}
          setFilter={fieldSetter((rs, value) => (rs.graph = value))}
          autocompleter={autocomplete(requestSpec.graph_type === 'metric' ? 'monitored_metrics' : 'available_graphs')}
        />
      </InlineFieldRow>
    );
  } else {
    return <div />;
  }
};
