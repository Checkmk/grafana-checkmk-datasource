import { PickByValue } from '../../src/RequestSpec';
import { expect } from '@jest/globals';

type Test = PickByValue<{ foo: string; bar: number }, string>;
const value: Test = { foo: '' };

describe('we have no unit tests yet', () => {
  it('but want just make sure PickByValue works as expected', () => {
    expect(1).toStrictEqual(1);
  });
});
