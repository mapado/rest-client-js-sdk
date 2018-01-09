import fetchMock from 'fetch-mock';
import { TokenStorage } from '../src';
import TokenGeneratorMock from '../__mocks__/TokenGeneratorMock';
import oauthClientCredentialsMock from '../__mocks__/oauthClientCredentials.json';
import refreshedCredentials from '../__mocks__/refreshedCredentials.json';
import Storage from '../__mocks__/mockStorage';

global.FormData = require('form-data');

const tokenGeneratorMock = new TokenGeneratorMock();

describe('Token storage tests', () => {
  test('handle empty token', () => {
    const oauth = new TokenStorage(tokenGeneratorMock, new Storage());

    const hasAccessToken = oauth.hasAccessToken();
    expect(hasAccessToken).toBeInstanceOf(Promise);

    return oauth
      .getAccessToken()
      .catch(e => {
        expect(e.message).toBe('No token has been generated yet.');
      })
      .then(() => {
        oauth.generateToken();
        const accessToken = oauth.getAccessToken();

        return Promise.all([
          expect(hasAccessToken).resolves.toBe(false),
          expect(accessToken).resolves.toBeUndefined(),
        ]);
      });
  });

  test('handle non empty token', () => {
    const storage = new Storage();
    storage.setItem(
      'rest_client_sdk.api.access_token',
      JSON.stringify({ access_token: 'accesstoken' })
    );
    const oauth = new TokenStorage(tokenGeneratorMock, storage);

    const hasAccessToken = oauth.hasAccessToken();
    expect(hasAccessToken).toBeInstanceOf(Promise);

    oauth.generateToken();
    const accessToken = oauth.getAccessToken();

    return Promise.all([
      expect(hasAccessToken).resolves.toBe(true),
      expect(accessToken).resolves.toEqual('accesstoken'),
    ]);
  });

  test('handle generating token', () => {
    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const oauth = new TokenStorage(tokenGeneratorMock, new Storage());

    const generatedToken = oauth.generateToken({
      grant_type: 'client_credentials',
    });

    expect(generatedToken).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof generatedToken).toBe('object'),
      expect(generatedToken.then(a => a.access_token)).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      ),
    ])
      .then(() =>
        Promise.all([
          expect(oauth.hasAccessToken()).resolves.toBe(true),
          expect(oauth.getAccessToken()).resolves.toEqual(
            oauthClientCredentialsMock.access_token
          ),
        ])
      )
      .then(() =>
        Promise.all([
          expect(
            oauth.refreshToken().then(a => a.access_token)
          ).resolves.toEqual(refreshedCredentials.access_token),
        ])
      )
      .then(() =>
        Promise.all([
          expect(oauth.hasAccessToken()).resolves.toBe(true),
          expect(oauth.getAccessToken()).resolves.toEqual(
            refreshedCredentials.access_token
          ),
        ])
      );
  });
});
