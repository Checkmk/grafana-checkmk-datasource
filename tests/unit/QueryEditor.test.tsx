import { act, render, screen } from '@testing-library/react';
import { QueryEditor } from '../../src/QueryEditor';
import { CmkQuery, defaultRequestSpec } from '../../src/types';
import { DataSource } from '../../src/DataSource';
import * as React from 'react';
import selectEvent from 'react-select-event';

const completions: Record<string, string[][]> = {
  sites: [
    ['site_1', 'Site One'],
    ['site_2', 'Site Two'],
  ],
  monitored_hostname: [
    ['host_name_1', 'Host One'],
    ['host_name_2', 'Host Two'],
  ],
  monitored_service_description: [
    ['service_1', 'Service One'],
    ['service_2', 'Service Two'],
  ],
  monitored_metrics: [
    ['metric_1', 'Metric One'],
    ['metric_2', 'Metric Two'],
  ],
  available_graphs: [
    ['graph_1', 'Graph One'],
    ['graph_2', 'Graph Two'],
  ],
};

describe('QueryEditor RAW', () => {
  const restRequest = jest.fn(async (_, { ident }) => {
    return {
      data: {
        result: {
          choices: completions[ident],
        },
      },
    };
  });

  const mockDatasource = {
    instanceSettings: {
      jsonData: {
        edition: 'RAW',
      },
    },
    restRequest,
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
    label        | attribute      | autocomplete
    ${'Site'}    | ${'site'}      | ${'sites'}
    ${'Host'}    | ${'host_name'} | ${'monitored_hostname'}
    ${'Service'} | ${'service'}   | ${'monitored_service_description'}
  `(
    'sets $attribute using $label with results from autocompleter $autocomplete',
    async ({ label, attribute, autocomplete }) => {
      render(<QueryEditor datasource={mockDatasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />);

      expect(restRequest).toHaveBeenCalledWith(
        'ajax_vs_autocomplete.py',
        expect.objectContaining({ ident: autocomplete })
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
      await selectEvent.select(input, 'Single metric', { container: document.body });
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        requestSpec: expect.objectContaining({ graph_type: 'metric' }),
      })
    );
    expect(onRunQuery).toHaveBeenCalledTimes(0);
  });

  it.each`
    graphType          | graphTypeTitle | selectChoice    | graphValue
    ${'Template'}      | ${'Template'}  | ${'Graph One'}  | ${'graph_1'}
    ${'Single metric'} | ${'Metric'}    | ${'Metric One'} | ${'metric_1'}
  `(
    'selects the right graph and calls the right autocompleter for $autocompleter',
    async ({ graphType, graphTypeTitle, selectChoice, graphValue }) => {
      render(<QueryEditor datasource={mockDatasource} query={query} onRunQuery={onRunQuery} onChange={onChange} />);

      const graphInput = screen.getByLabelText('Graph type');
      await act(async () => {
        await selectEvent.select(graphInput, graphType, { container: document.body });
      });

      const input = screen.getByLabelText(graphTypeTitle);

      await act(async () => {
        await selectEvent.select(input, selectChoice, { container: document.body });
      });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          requestSpec: expect.objectContaining({ graph: graphValue }),
        })
      );
      expect(onRunQuery).toHaveBeenCalledTimes(0);
    }
  );

  // TODO: Add test where onRunQuery is actually called.
});
