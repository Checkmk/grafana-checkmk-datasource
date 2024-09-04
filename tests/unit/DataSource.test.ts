import { DataQueryRequest, DataSourceInstanceSettings, MutableDataFrame } from '@grafana/data';
import { expect } from '@jest/globals';
import { cloneDeep } from 'lodash';

import { DataSource } from '../../src/DataSource';
import { RequestSpec } from '../../src/RequestSpec';
import RestApiBackend from '../../src/backend/rest';
import WebApiBackend from '../../src/backend/web';
import { CmkQuery, DataSourceOptions, Edition } from '../../src/types';
import { labelForRequestSpecKey } from '../../src/ui/utils';
import * as utils from '../../src/utils';
import { buildRequestBody, buildUrlWithParams } from '../../src/webapi';

jest.mock('../../src/utils');

describe('URL conversions', () => {
  it('Params', () => {
    expect(buildUrlWithParams('hi', { A: '5', TE: 'TTI' })).toBe('hi?A=5&TE=TTI');
  });
  it('Request body', () => {
    expect(buildRequestBody({ spec: ['comb', { site: 'heute' }] })).toBe('request={"spec":["comb",{"site":"heute"}]}');
  });
});

// from https://stackoverflow.com/questions/42773836/how-to-find-all-subsets-of-a-set-in-javascript-powerset-of-array
const allSubsets = (values: string[]): string[][] =>
  values.reduce((subsets, value) => subsets.concat(subsets.map((set) => [value, ...set])), [[]]);

const fullExampleRequestSpec: RequestSpec = {
  graph_type: 'predefined_graph',
  aggregation: 'off',
  site: 'monitoring',
  host_name: 'example.com',
  host_name_regex: {
    value: '*.org',
    negated: false,
  },
  host_in_group: {
    value: 'printers',
    negated: true,
  },
  host_labels: ['os:linux'],
  host_tags: [{}, {}, {}],
  service: 'CPU load',
  service_regex: {
    value: 'CPU*',
    negated: true,
  },
  service_in_group: {
    value: 'web_servers',
    negated: false,
  },
  graph: 'Load Average',
};

const getRequiredFields = (edition: Edition): Array<keyof RequestSpec> => {
  const result: Array<keyof RequestSpec> = ['graph'];
  if (edition === 'RAW') {
    result.push('site', 'host_name', 'service');
  }
  return result.sort();
};

describe.each([{ edition: 'RAW' }, { edition: 'CEE' }])(
  'Query Validation in Edition $edition',
  (editionConfig: { edition: Edition }) => {
    describe.each([{ backend: 'rest' }, { backend: 'web' }])(
      'with backend $backend',
      (backendConfig: { backend: string }) => {
        let subject: DataSource;
        const requiredFields = getRequiredFields(editionConfig.edition);
        const cases = allSubsets(requiredFields)
          .filter((arr) => arr.length > 0)
          .map((arr) => arr.sort())
          .map((value) => ({ fields: value }));

        jest
          .spyOn(RestApiBackend.prototype, 'getSingleGraph')
          .mockImplementation(() => Promise.resolve('It did succeed, sadly.'));

        jest
          .spyOn(WebApiBackend.prototype, 'getGraphQuery')
          .mockImplementation(() => Promise.resolve(new MutableDataFrame()));

        utils.replaceVariables.mockImplementation((rq) => rq);

        beforeEach(() => {
          subject = new DataSource({
            jsonData: { backend: backendConfig, edition: editionConfig.edition },
          } as unknown as DataSourceInstanceSettings<DataSourceOptions>);
        });

        it.each(cases)(
          'throws an informative error if the required fields $fields are missing in a query',
          async ({ fields }) => {
            const requestSpec = cloneDeep(fullExampleRequestSpec);
            for (const key of fields) {
              delete requestSpec[key];
            }
            const dataQueryRequest = {
              targets: [
                {
                  requestSpec,
                },
              ],
              range: [1, 2],
            } as unknown as DataQueryRequest<CmkQuery>;

            const errorMessageRegex = fields
              .map((value) => labelForRequestSpecKey(value as keyof RequestSpec, requestSpec))
              .join(', ');

            // make sure this test doesn't fail pass on a resolved promise
            expect.assertions(1);
            await expect(subject.query(dataQueryRequest)).rejects.toThrow(errorMessageRegex);
          }
        );

        it('validates even if site is an empty string', async () => {
          const requestSpec = cloneDeep(fullExampleRequestSpec);
          requestSpec['site'] = '';
          const dataQueryRequest = {
            targets: [
              {
                requestSpec,
              },
            ],
            range: [1, 2],
          } as unknown as DataQueryRequest<CmkQuery>;
          await expect(subject.query(dataQueryRequest)).resolves.not.toThrow();
        });
      }
    );
  }
);
