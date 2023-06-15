import { SelectableValue } from '@grafana/data';
import { InlineFieldRow, Label, VerticalGroup } from '@grafana/ui';
import { DataSource } from 'DataSource';
import React from 'react';

import { FiltersRequestSpec, MetricFindQuery, ObjectType } from '../RequestSpec';
import { CheckMkGenericAsyncSelect } from './components';
import { Filters } from './filters';

interface VariableQueryProps {
  query: MetricFindQuery | string;
  onChange: (query: MetricFindQuery, definition: string) => void;
  datasource: DataSource;
}

const formatDefinition = function (query: MetricFindQuery) {
  return `${query.objectType}: ${JSON.stringify(query.filter)}`;
};

const FILTER_RESTRICTION: Record<string, Array<keyof FiltersRequestSpec>> = {
  site: [],
  host: ['site', 'host_name', 'host_name_regex', 'host_in_group', 'host_labels', 'host_tags'],
  service: [
    // TODO: deduplicate with host
    'site',
    'host_name',
    'host_name_regex',
    'host_in_group',
    'host_labels',
    'host_tags',
    'service',
    'service_regex',
    'service_in_group',
  ],
};

export const VariableQueryEditor = function (props: VariableQueryProps) {
  const query: MetricFindQuery = typeof props.query === 'string' ? { filter: {}, objectType: 'host' } : props.query;

  if (props.query === '') {
    // first run ever, query holds default value
    props.onChange(query, formatDefinition(query));
  }

  const objectTypeChange = (value: ObjectType) => {
    const newQuery: MetricFindQuery = {
      ...query,
      objectType: value,
    };
    props.onChange(newQuery, formatDefinition(newQuery));
  };

  const filtersChange = (value: FiltersRequestSpec) => {
    query.filter = value;
    props.onChange(query, formatDefinition(query));
  };

  const objectTypeCompleter = async (): Promise<Array<SelectableValue<ObjectType>>> => [
    { value: 'site', label: 'Site' },
    { value: 'host', label: 'Host' },
    { value: 'service', label: 'Service' },
  ];

  const restrictFilter = FILTER_RESTRICTION[query.objectType];

  return (
    <>
      <VerticalGroup>
        <InlineFieldRow>
          <VerticalGroup>
            <Label>Object type to query</Label>
            <CheckMkGenericAsyncSelect<ObjectType>
              showVariables={false}
              inputId={'object_type'}
              value={query.objectType}
              onChange={objectTypeChange}
              autocompleter={objectTypeCompleter}
            />
            <Filters
              datasource={props.datasource}
              onChange={filtersChange}
              requestSpec={query.filter}
              restrictedChildrenChoice={restrictFilter}
            />
          </VerticalGroup>
        </InlineFieldRow>
      </VerticalGroup>
    </>
  );
};
