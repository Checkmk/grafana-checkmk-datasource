import { SelectableValue } from '@grafana/data';
import { render } from '@testing-library/react';
import * as React from 'react';

import { CheckMkAsyncSelect } from '../../../src/ui/components';

describe('CheckMkAsyncSelect', () => {
  const autocompleter = jest.fn(async (prefix: string): Promise<Array<SelectableValue<string>>> => {
    if (prefix === 'sentinel') {
      return [{ label: 'sentinel', value: 'sentinel' }];
    }
    return [];
  });

  it("uses the specific options if the default ones don't include the value", async () => {
    const screen = await render(
      <CheckMkAsyncSelect autocompleter={autocompleter} inputId={'foo'} onChange={() => undefined} value="sentinel" />
    );

    expect(autocompleter).toHaveBeenCalledWith('');
    expect(autocompleter).toHaveBeenCalledWith('sentinel');
  });
});
