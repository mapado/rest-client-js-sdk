/* global describe, it, afterEach */
global.FormData = require('form-data');
import {
  expect,
} from 'chai';
import fetchMock from 'fetch-mock';
import { OauthClient } from '../src';
import oauthClientCredentialsMock from './mock/oauthClientCredentials';
import Storage from './mock/mockStorage';

describe('Oauth Client tests', () => {
  afterEach(fetchMock.restore);

  it('handle empty token', () => {
    const oauth = new OauthClient({ path: 'oauth.me', scheme: 'http' }, '1', 'secret', new Storage());

    const hasAccessToken = oauth.hasAccessToken();
    const accessToken = oauth.getAccessToken();


    expect(hasAccessToken).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(hasAccessToken).to.eventually.be.false,
      expect(accessToken).to.eventually.be.undefined,
    ]);
  });

  it('handle non empty token', () => {
    const storage = new Storage();
    storage.setItem('mapado.api.access_token', JSON.stringify({ access_token: 'accesstoken' }));
    const oauth = new OauthClient({ path: 'oauth.me', scheme: 'http' }, '1', 'secret', storage);

    const hasAccessToken = oauth.hasAccessToken();
    const accessToken = oauth.getAccessToken();

    expect(hasAccessToken).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(hasAccessToken).to.eventually.be.true,
      expect(accessToken).to.eventually.be.equals('accesstoken'),
    ]);
  });

  it('handle generating client_credentials token', () => {
    fetchMock
      .mock(() => true, oauthClientCredentialsMock)
      .getMock()
    ;

    const oauth = new OauthClient({ path: 'oauth.me', scheme: 'http' }, '1', 'secret', new Storage());

    formData = new FormData();
    formData.append('grant_type', 'client_credentials');

    const generatedToken = oauth.getToken(formData);

    expect(generatedToken).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(generatedToken).to.eventually.be.an.object,
      expect(generatedToken.then(a => a.access_token))
        .to.eventually.equals(oauthClientCredentialsMock.access_token),
    ])
    .then(() => Promise.all([
      expect(oauth.hasAccessToken()).to.eventually.be.true,
      expect(oauth.getAccessToken())
        .to.eventually.equals(oauthClientCredentialsMock.access_token),
    ]));
  });
});
