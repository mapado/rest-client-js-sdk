/* global describe, it, afterEach */
global.FormData = require('form-data');
import {
  expect,
} from 'chai';
import fetchMock from 'fetch-mock';
import oauthClientCredentialsMock from '../mock/oauthClientCredentials';
import { ClientCredentialsGenerator } from '../../src';

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
};

describe('ClientCredentialsGenerator tests', () => {
  afterEach(fetchMock.restore);

  it('test that config is properly checked', () => {
    function createTokenGenerator(config) {
      return () => new ClientCredentialsGenerator(config);
    }

    expect(createTokenGenerator()).to.throw(RangeError, /config must be set/);
    expect(createTokenGenerator({ foo: 'bar' })).to.throw(RangeError, /should contain a "path"/);
    expect(createTokenGenerator({ path: 'oauth.me', scheme: 'https' })).to.throw(RangeError, /should contain a "clientId"/);
    expect(createTokenGenerator(tokenConfig)).not.to.throw('good config');
  });

  it('test generateToken method', () => {
    fetchMock
      .mock(() => true, oauthClientCredentialsMock)
      .getMock()
    ;

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);

    const token = tokenGenerator.generateToken();

    expect(token).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(token).to.eventually.be.an.object,
      expect(token.then(a => a.access_token))
        .to.eventually.equals(oauthClientCredentialsMock.access_token),
    ]);
  });

  it('test thas refreshToken method does the same as generateToken', () => {
    fetchMock
      .mock(() => true, oauthClientCredentialsMock)
      .getMock()
    ;

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);

    const token = tokenGenerator.refreshToken();

    expect(token).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(token).to.eventually.be.an.object,
      expect(token.then(a => a.access_token))
        .to.eventually.equals(oauthClientCredentialsMock.access_token),
    ]);
  });
});
