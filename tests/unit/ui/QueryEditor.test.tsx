import { act, render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import selectEvent from 'react-select-event';

import { DataSource } from '../../../src/DataSource';
import { defaultRequestSpec } from '../../../src/RequestSpec';
import { CmkQuery } from '../../../src/types';
import { QueryEditor } from '../../../src/ui/QueryEditor';

const mockTemplateSrv = {
  getVariables: () => [],
  replaceValue: (value) => value,
};
jest.mock('@grafana/runtime', () => ({
  ...(jest.requireActual('@grafana/runtime') as unknown as object),
  getTemplateSrv: () => mockTemplateSrv,
}));

const completions: Record<string, Array<{ value: string; label: string }>> = {
  sites: [
    { value: 'site_1', label: 'Site One' },
    { value: 'site_2', label: 'Site Two' },
  ],
  monitored_hostname: [
    { value: 'host_name_1', label: 'Hostname One' },
    { value: 'host_name_2', label: 'Hostname Two' },
  ],
  monitored_service_description: [
    { value: 'service_1', label: 'Service One' },
    { value: 'service_2', label: 'Service Two' },
  ],
  monitored_metrics: [
    { value: 'metric_1', label: 'Metric One' },
    { value: 'metric_2', label: 'Metric Two' },
  ],
  available_graphs: [
    { value: 'graph_1', label: 'Graph One' },
    { value: 'graph_2', label: 'Graph Two' },
  ],
};

describe('QueryEditor RAW', () => {
  const contextAutocomplete = jest.fn(async (ident, _partialRequestSpec, _prefix, _params) => {
    return completions[ident];
  });

  const mockDatasource = {
    instanceSettings: {
      jsonData: {
        edition: 'RAW',
      },
    },
    contextAutocomplete,
    getEdition() {
      return 'RAW';
    },
  } as unknown as DataSource;

  const query = {
    refId: '',
    requestSpec: defaultRequestSpec,
  } as CmkQuery;

  const onRunQuery = jest.fn();
  const onChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each`
    label         | attribute      | autocomplete
    ${'Site'}     | ${'site'}      | ${'sites'}
    ${'Hostname'} | ${'host_name'} | ${'monitored_hostname'}
    ${'Service'}  | ${'service'}   | ${'monitored_service_description'}
  `(
    'sets $attribute using $label with results from autocompleter $autocomplete',
    async ({ label, attribute, autocomplete }) => {
      render(<QueryEditor datasource={mockDatasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />);

      expect(contextAutocomplete).toHaveBeenCalledWith(
        autocomplete,
        expect.anything(),
        expect.anything(),
        expect.anything()
      );

      const input = screen.getByLabelText(label);
      await act(async () => {
        await selectEvent.openMenu(input);
      });

      await act(async () => {
        await selectEvent.select(input, `${label} One`, { container: document.body });
      });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          requestSpec: expect.objectContaining({ [attribute]: `${attribute}_1` }),
        })
      );
    }
  );

  it('selects the proper graph type', async () => {
    render(<QueryEditor datasource={mockDatasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />);

    const input = screen.getByLabelText('Graph type');

    await act(async () => {
      await selectEvent.openMenu(input);
    });

    await act(async () => {
      await selectEvent.select(input, 'Single metric', { container: document.body });
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        requestSpec: expect.objectContaining({ graph_type: 'single_metric' }),
      })
    );
    expect(onRunQuery).toHaveBeenCalledTimes(1);
  });

  it.each`
    graphType             | graphTypeTitle        | selectChoice    | graphValue
    ${'Predefined graph'} | ${'Predefined graph'} | ${'Graph One'}  | ${'graph_1'}
    ${'Single metric'}    | ${'Single metric'}    | ${'Metric One'} | ${'metric_1'}
  `('selects the right graph', async ({ graphType, graphTypeTitle, selectChoice, graphValue }) => {
    render(<QueryEditor datasource={mockDatasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />);

    const graphInput = screen.getByLabelText('Graph type');

    await act(async () => {
      await selectEvent.openMenu(graphInput);
    });

    await act(async () => {
      await selectEvent.select(graphInput, graphType, { container: document.body });
    });

    const input = screen.getByLabelText(graphTypeTitle);

    await act(async () => {
      await selectEvent.openMenu(input);
    });

    await act(async () => {
      await selectEvent.select(input, selectChoice, { container: document.body });
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        requestSpec: expect.objectContaining({ graph: graphValue }),
      })
    );
  });

  it('calls the autocompleters the minimal amount of times', async () => {
    render(<QueryEditor datasource={mockDatasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />);

    expect(contextAutocomplete).toHaveBeenCalledWith('sites', expect.anything(), expect.anything(), expect.anything());
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'monitored_hostname',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'monitored_service_description',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'available_graphs',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    contextAutocomplete.mockClear();

    const siteInput = screen.getByLabelText('Site');

    await act(async () => {
      await selectEvent.openMenu(siteInput);
    });

    await act(async () => {
      await selectEvent.select(siteInput, 'Site One', { container: document.body });
    });
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'monitored_hostname',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'monitored_service_description',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'available_graphs',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    contextAutocomplete.mockClear();

    const hostInput = screen.getByLabelText('Hostname');

    await act(async () => {
      await selectEvent.openMenu(hostInput);
    });

    await act(async () => {
      await selectEvent.select(hostInput, 'Hostname One', { container: document.body });
    });
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'monitored_service_description',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    expect(contextAutocomplete).toHaveBeenCalledWith(
      'available_graphs',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    contextAutocomplete.mockClear();

    const serviceInput = screen.getByLabelText('Service');

    await act(async () => {
      await selectEvent.openMenu(serviceInput);
    });

    await act(async () => {
      await selectEvent.select(serviceInput, 'Service One', { container: document.body });
    });

    expect(contextAutocomplete).toHaveBeenCalledWith(
      'available_graphs',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
    contextAutocomplete.mockClear();

    const graphInput = screen.getByLabelText('Predefined graph');

    await act(async () => {
      await selectEvent.openMenu(graphInput);
    });

    await act(async () => {
      await selectEvent.select(graphInput, 'Graph One', { container: document.body });
    });
    expect(contextAutocomplete).toHaveBeenCalledTimes(0);
  });
});
