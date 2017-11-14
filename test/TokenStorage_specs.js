/* global describe, it, afterEach */
global.FormData = require('form-data');
import { expect } from 'chai';
import fetchMock from 'fetch-mock';
import { TokenStorage } from '../src';
import TokenGeneratorMock from './mock/TokenGeneratorMock';
import oauthClientCredentialsMock from './mock/oauthClientCredentials';
import refreshedCredentials from './mock/refreshedCredentials';
import Storage from './mock/mockStorage';

const tokenGeneratorMock = new TokenGeneratorMock();

describe('Token storage tests', () => {
  it('handle empty token', done => {
    const oauth = new TokenStorage(tokenGeneratorMock, new Storage());

    const hasAccessToken = oauth.hasAccessToken();
    expect(hasAccessToken).to.be.an.instanceOf(Promise);

    oauth
      .getAccessToken()
      .catch(e => {
        expect(e.message).to.equal('No token has been generated yet.');
      })
      .then(() => {
        oauth.generateToken();
        const accessToken = oauth.getAccessToken();

        Promise.all([
          expect(hasAccessToken).to.eventually.be.false,
          expect(accessToken).to.eventually.be.undefined,
        ]).then(() => done());
      });
  });

  it('handle non empty token', () => {
    const storage = new Storage();
    storage.setItem(
      'rest_client_sdk.api.access_token',
      JSON.stringify({ access_token: 'accesstoken' })
    );
    const oauth = new TokenStorage(tokenGeneratorMock, storage);

    const hasAccessToken = oauth.hasAccessToken();
    expect(hasAccessToken).to.be.an.instanceOf(Promise);

    oauth.generateToken();
    const accessToken = oauth.getAccessToken();

    return Promise.all([
      expect(hasAccessToken).to.eventually.be.true,
      expect(accessToken).to.eventually.be.equals('accesstoken'),
    ]);
  });

  it('handle generating token', () => {
    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const oauth = new TokenStorage(tokenGeneratorMock, new Storage());

    const generatedToken = oauth.generateToken({
      grant_type: 'client_credentials',
    });

    expect(generatedToken).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(generatedToken).to.eventually.be.an.object,
      expect(generatedToken.then(a => a.access_token)).to.eventually.equals(
        oauthClientCredentialsMock.access_token
      ),
    ])
      .then(() =>
        Promise.all([
          expect(oauth.hasAccessToken()).to.eventually.be.true,
          expect(oauth.getAccessToken()).to.eventually.equals(
            oauthClientCredentialsMock.access_token
          ),
        ])
      )
      .then(() =>
        Promise.all([
          expect(
            oauth.refreshToken().then(a => a.access_token)
          ).to.eventually.equals(refreshedCredentials.access_token),
        ])
      )
      .then(() =>
        Promise.all([
          expect(oauth.hasAccessToken()).to.eventually.be.true,
          expect(oauth.getAccessToken()).to.eventually.equals(
            refreshedCredentials.access_token
          ),
        ])
      );
  });
});
