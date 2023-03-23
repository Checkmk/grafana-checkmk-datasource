import { SelectableValue } from '@grafana/data';
import { act, render } from '@testing-library/react';
import * as React from 'react';

import { CheckMkAsyncSelect } from '../../../src/ui/components';

const mockTemplateSrv = {
  getVariables: () => [],
  replaceValue: (value) => value,
};
jest.mock('@grafana/runtime', () => ({
  ...(jest.requireActual('@grafana/runtime') as unknown as object),
  getTemplateSrv: () => mockTemplateSrv,
}));

describe('CheckMkAsyncSelect', () => {
  const autocompleter = jest.fn(async (prefix: string): Promise<Array<SelectableValue<string>>> => {
    if (prefix === 'sentinel') {
      return [{ label: 'sentinel', value: 'sentinel' }];
    }
    return [];
  });

  it("uses the specific options if the default ones don't include the value", async () => {
    await act(async () => {
      await render(
        <CheckMkAsyncSelect autocompleter={autocompleter} inputId={'foo'} onChange={() => undefined} value="sentinel" />
      );
    });
    expect(autocompleter).toHaveBeenCalledWith('');
    expect(autocompleter).toHaveBeenCalledWith('sentinel');
  });
});
