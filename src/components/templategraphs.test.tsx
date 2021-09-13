import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { GraphOfServiceQuery } from './templategraphs';
import { defaultQuery, MyQuery } from 'types';
import { defaults } from 'lodash';

describe('Template graphs', () => {
  let mockQuery = defaults({}, defaultQuery) as MyQuery;

  it('has everything', () => {
    render(<GraphOfServiceQuery query={mockQuery} />);
    expect(screen.getByText('Select service')).toBeInTheDocument();
    expect(screen.getByText('Select graph')).toBeInTheDocument();
    expect(screen.queryByText('Select metric')).toBeNull();
  });
});
