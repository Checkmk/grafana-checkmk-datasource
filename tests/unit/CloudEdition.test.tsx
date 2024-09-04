import { render } from '@testing-library/react';
import * as React from 'react';
import { expect, jest } from '@jest/globals';
import * as process from 'process';

import RestApiBackend from '../../src/backend/rest';
import { ConfigEditor } from '../../src/ui/ConfigEditor';
import { DataSourceSettings } from '@grafana/data';
import { DatasourceOptions } from '../../src/backend/types';

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
    delete process.env.BUILD_EDITION;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  describe('ConfigEditor', () => {
    let screen;

    beforeAll(() => {
      process.env.BUILD_EDITION = 'CLOUD';
      screen = render(<ConfigEditor options={options} onOptionsChange={onOptionsChange} />);
    });

    it("doesn't render the version and edition dropdowns", () => {
      expect(screen.queryByLabelText('Edition')).toBeNull();
      expect(screen.queryByLabelText('Version')).toBeNull();
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
      process.env.BUILD_EDITION = 'CLOUD';
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
