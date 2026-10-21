import { act, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';

import { Filter } from '../../../src/ui/components';

describe('Filter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps typed text and negation when negating during the debounce delay', () => {
    const onChange = jest.fn();
    // a new callback on every render, like the parent components pass
    const renderFilter = () => (
      <Filter label="Host regex" requestSpecKey="host_name_regex" onChange={(v) => onChange(v)} value={undefined} />
    );
    const { container, rerender } = render(renderFilter());

    fireEvent.change(container.querySelector('[data-test-id="host_name_regex-filter-input"]')!, {
      target: { value: 'web' },
    });
    rerender(renderFilter());
    fireEvent.click(screen.getByLabelText('Negate'));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ value: 'web', negated: true });
  });
});
