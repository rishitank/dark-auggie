import { add } from '../src/utils/math';

describe('math.add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
