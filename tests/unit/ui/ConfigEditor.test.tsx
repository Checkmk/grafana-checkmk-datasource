import { DataSourceSettings } from '@grafana/data';
import { expect, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import { ConfigEditor } from '../../../src/ui/ConfigEditor';

describe('ConfigEditor', () => {
  it('turns off Checkmk metric colors as default for new queries', () => {
    const options = { jsonData: {}, secureJsonData: {} } as DataSourceSettings;
    const onOptionsChange = jest.fn();
    render(<ConfigEditor options={options} onOptionsChange={onOptionsChange} />);

    const metricColorsDefault = screen.getByLabelText('Apply Checkmk metric colors');
    expect(metricColorsDefault).toBeChecked();

    fireEvent.click(metricColorsDefault);

    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({ jsonData: { applyCheckmkMetricColorsByDefault: false } })
    );
  });
});
