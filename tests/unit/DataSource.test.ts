import { buildRequestBody, buildUrlWithParams } from '../../src/webapi';

describe('URL conversions', () => {
  it('Params', () => {
    expect(buildUrlWithParams('hi', { A: '5', TE: 'TTI' })).toBe('hi?A=5&TE=TTI');
  });
  it('Request body', () => {
    expect(buildRequestBody({ spec: ['comb', { site: 'heute' }] })).toBe('request={"spec":["comb",{"site":"heute"}]}');
  });
});
