/* global describe, it, afterEach */
global.FormData = require('form-data');
import {
  expect,
} from 'chai';
import oauthClientCredentialsMock from '../mock/oauthClientCredentials';
import { TokenStorage, ProvidedTokenGenerator } from '../../src';
import Storage from '../mock/mockStorage';

const providedToken =
  'MmEyOWM3NTlkYzdkOWJhYTg4ZjVlNzYwNzk3MjU1ZTYyMTI1NzNmZWNiMmE5NWRlOWNiYWYyYTViNmUyYTZlOQ';

describe('ProvidedTokenGenerator tests', () => {
  it('test generateToken method', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);
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
    const refreshedToken = tokenGenerator.refreshToken();

    expect(refreshedToken).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(refreshedToken).to.eventually.be.an.object,
      expect(refreshedToken.then(a => a.access_token))
        .to.eventually.equals(oauthClientCredentialsMock.access_token),
      expect(refreshedToken.then(a => a.refresh_token))
        .to.eventually.equals(oauthClientCredentialsMock.refresh_token),
    ]);
  });

  it('test token autogeneration', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);
    const oauth = new TokenStorage(tokenGenerator, new Storage());
    const token = oauth.getAccessToken();
    expect(token).to.be.an.instanceOf(Promise);
    expect(token.then(a => a.access_token))
      .to.eventually.equals(oauthClientCredentialsMock.access_token);
    expect(token.then(a => a.refresh_token))
      .to.eventually.equals(oauthClientCredentialsMock.refresh_token);
  });
});
