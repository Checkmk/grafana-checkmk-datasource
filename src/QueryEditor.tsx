import React from 'react';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { GraphOfServiceQuery } from './components/templategraphs';
import { CombinedGraphSelect, FilterEditor, SelectAggregation } from './components/combinedgraphs';
import { defaults, get } from 'lodash';
//import { logError } from '@grafana/runtime';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export const QueryEditor = (props: Props) => {
  defaults(props.query, defaultQuery); // mutate into default query
  const editionMode = get(props, 'datasource.instanceSettings.jsonData.edition', '');

  return (
    <div className="gf-form-group">
      {editionMode === 'RAW' && <GraphOfServiceQuery {...props} />}
      {editionMode === 'CEE' && (
        <>
          <FilterEditor {...props} />
          <SelectAggregation {...props} />
          <CombinedGraphSelect {...props} />
        </>
      )}
    </div>
  );
};
