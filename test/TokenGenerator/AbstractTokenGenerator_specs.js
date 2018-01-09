import { expect } from 'chai';
import { AbstractTokenGenerator } from '../../src';

describe('AbstractTokenGenerator tests', () => {
  it('contains all methods', () => {
    const tokenGenerator = new AbstractTokenGenerator();

    expect(tokenGenerator.checkTokenGeneratorConfig).to.not.throw(Error);
    expect(tokenGenerator.generateToken).to.throw(Error);
    expect(tokenGenerator.refreshToken).to.throw(Error);
  });

  it('test convert map to FormData', () => {
    const tokenGenerator = new AbstractTokenGenerator();

    const formData = tokenGenerator.convertMapToFormData({
      a: 'abc',
      foo: 'bar',
    });

    /* eslint-disable no-underscore-dangle */
    expect(formData._streams[0]).to.contain('name="a"');
    expect(formData._streams[1]).to.equal('abc');
    expect(formData._streams[3]).to.contain('name="foo"');
    expect(formData._streams[4]).to.equal('bar');
    /* eslint-enable no-underscore-dangle */
  });
});
