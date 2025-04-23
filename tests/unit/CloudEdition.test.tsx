import { DataSourceSettings } from '@grafana/data';
import { expect, jest } from '@jest/globals';
import { RenderResult, render } from '@testing-library/react';
import * as process from 'process';
import * as React from 'react';

import RestApiBackend from '../../src/backend/rest';
import { DatasourceOptions } from '../../src/backend/types';
import { ConfigEditor } from '../../src/ui/ConfigEditor';

jest.mock('@grafana/runtime', () => {
  return {
    getBackendSrv: () => ({
      fetch: () => ({
        async toPromise() {
          return {
            headers: {
              get() {
                return 'cee';
              },
            },
          };
        },
      }),
    }),
  };
});

describe('Cloud Edition Restrictions', () => {
  const options = { jsonData: {}, secureJsonData: {} } as DataSourceSettings;
  const onOptionsChange = jest.fn();

  afterAll(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  describe('ConfigEditor', () => {
    let screen: RenderResult;

    beforeAll(() => {
      screen = render(<ConfigEditor options={options} onOptionsChange={onOptionsChange} />);
    });

    it('always render the edition dropdown', () => {
      expect(screen.queryByLabelText('Edition')).not.toBeNull();
    });
  });

  describe('RestApiBackend', () => {
    const mockDatasource = {
      getUrl() {
        return 'http://no.where/';
      },
    } as DatasourceOptions;

    let subject: RestApiBackend;

    beforeAll(() => {
      subject = new RestApiBackend(mockDatasource);
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('throws an error when trying to make a request to a non cloud edition', async () => {
      expect(async () => await subject.api({ url: 'some/where' })).rejects.toThrow();
    });
  });
});
