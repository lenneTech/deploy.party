import { isSwaggerEnabled } from './swagger.helper';

describe('isSwaggerEnabled', () => {
  it.each(['true', 'TRUE', ' true '])('is on for %p', (value) => {
    expect(isSwaggerEnabled(value)).toBe(true);
  });

  it.each([undefined, '', 'false', '1', 'yes', 'on'])('is off for %p', (value) => {
    expect(isSwaggerEnabled(value)).toBe(false);
  });
});
