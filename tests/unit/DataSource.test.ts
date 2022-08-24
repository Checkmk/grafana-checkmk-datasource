import { buildUrlWithParams } from '../../src/DataSource';
import { buildRequestBody } from '../../src/graphspecs';

describe('URL conversions', () => {
  it('Params', () => {
    expect(buildUrlWithParams('hi', { A: '5', TE: 'TTI' })).toBe('hi?A=5&TE=TTI');
  });
  it('Request body', () => {
    expect(buildRequestBody({ spec: ['comb', { site: 'heute' }] })).toBe('request={"spec":["comb",{"site":"heute"}]}');
  });
});
