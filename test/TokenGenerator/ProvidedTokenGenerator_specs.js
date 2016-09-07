/* global describe, it, afterEach */
global.FormData = require('form-data');
import {
  expect,
} from 'chai';
import oauthClientCredentialsMock from '../mock/oauthClientCredentials';
import { ProvidedTokenGenerator } from '../../src';

const providedToken = 'MmEyOWM3NTlkYzdkOWJhYTg4ZjVlNzYwNzk3MjU1ZTYyMTI1NzNmZWNiMmE5NWRlOWNiYWYyYTViNmUyYTZlOQ';

describe('ProvidedTokenGenerator tests', () => {
  it('test that config is properly checked', () => {
    function createTokenGenerator(token) {
      return () => new ProvidedTokenGenerator(token);
    }

    expect(createTokenGenerator()).to.throw(RangeError, /A token must be provided/);
    expect(createTokenGenerator(providedToken)).not.to.throw('good config');
  });

  it('test generateToken method', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);

    expect(() => tokenGenerator.generateToken()).to.throw(RangeError, /A token must be provided/);

    const token = tokenGenerator.generateToken(providedToken);
    expect(token).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(token).to.eventually.be.an.object,
      expect(token.then(a => a.access_token))
        .to.eventually.equals(oauthClientCredentialsMock.access_token),
      expect(token.then(a => a.refresh_token))
        .to.eventually.equals(oauthClientCredentialsMock.refresh_token),
    ]);
  });

  it('test thas refreshToken refresh the token ;)', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);

    expect(() => tokenGenerator.refreshToken()).to.throw(Error, /A token must be provided/);

    const refreshedToken = tokenGenerator.refreshToken(providedToken);
    expect(refreshedToken).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(refreshedToken).to.eventually.be.an.object,
      expect(refreshedToken.then(a => a.access_token))
        .to.eventually.equals(oauthClientCredentialsMock.access_token),
      expect(refreshedToken.then(a => a.refresh_token))
        .to.eventually.equals(oauthClientCredentialsMock.refresh_token),
    ]);
  });
});
