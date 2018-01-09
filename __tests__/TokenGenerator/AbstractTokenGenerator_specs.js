import { AbstractTokenGenerator } from '../../src';

describe('AbstractTokenGenerator tests', () => {
  test('contains all methods', () => {
    const tokenGenerator = new AbstractTokenGenerator();

    expect(tokenGenerator.checkTokenGeneratorConfig).not.toThrowError(Error);
    expect(tokenGenerator.generateToken).toThrowError(Error);
    expect(tokenGenerator.refreshToken).toThrowError(Error);
  });

  test('test convert map to FormData', () => {
    const tokenGenerator = new AbstractTokenGenerator();

    const formData = tokenGenerator.convertMapToFormData({
      a: 'abc',
      foo: 'bar',
    });

    /* eslint-disable no-underscore-dangle */
    expect(formData._streams[0]).toContain('name="a"');
    expect(formData._streams[1]).toBe('abc');
    expect(formData._streams[3]).toContain('name="foo"');
    expect(formData._streams[4]).toBe('bar');
    /* eslint-enable no-underscore-dangle */
  });
});
