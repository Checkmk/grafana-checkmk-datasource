import { render } from '@testing-library/react';
import * as React from 'react';

import RestApiBackend from '../../src/backend/rest';
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
  const options = { jsonData: {}, secureJsonData: {} } as any;
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

    it('sets the non configurable values to the defaults', () => {
      expect(onOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ jsonData: { backend: 'rest' } }));
      expect(onOptionsChange).toHaveBeenCalledWith(expect.objectContaining({ jsonData: { edition: 'CEE' } }));
    });
  });

  describe('RestApiBackend', () => {
    const mockDatasource = {
      getUrl() {
        return 'http://no.where/';
      },
    } as any;

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
