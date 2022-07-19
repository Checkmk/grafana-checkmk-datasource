import React from 'react';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { FilterEditor, SelectAggregation } from './components/combinedgraphs';
import { defaults, get } from 'lodash';
import { InlineFieldRow } from '@grafana/ui';
import { HostFilter, ServiceFilter, SiteFilter } from 'components/filters';
import { GraphSelect } from 'components/fields';
//import { logError } from '@grafana/runtime';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export const QueryEditor = (props: Props): JSX.Element => {
  defaults(props.query, defaultQuery); // mutate into default query
  const editionMode = get(props, 'datasource.instanceSettings.jsonData.edition', '');

  return (
    <div className="gf-form-group">
      {editionMode === 'RAW' && (
        <InlineFieldRow>
          <SiteFilter {...props} />
          <HostFilter {...props} />
          <ServiceFilter {...props} />
          <GraphSelect edition={editionMode} {...props} />
        </InlineFieldRow>
      )}
      {editionMode === 'CEE' && (
        <>
          <FilterEditor {...props} />
          <SelectAggregation {...props} />
          <GraphSelect edition={editionMode} {...props} />
        </>
      )}
    </div>
  );
};
