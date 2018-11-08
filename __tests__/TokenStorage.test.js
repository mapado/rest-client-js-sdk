import fetchMock from 'fetch-mock';
import { TokenStorage } from '../src';
import TokenGeneratorMock from '../__mocks__/TokenGeneratorMock';
import oauthClientCredentialsMock from '../__mocks__/oauthClientCredentials.json';
import refreshedCredentials from '../__mocks__/refreshedCredentials.json';
import Storage from '../__mocks__/mockStorage';
import { NOW_TIMESTAMP_MOCK } from '../setupJest';

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
          expect(accessToken).resolves.toBeNull(),
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
          expect(oauth.getAccessTokenObject()).resolves.toEqual(
            oauthClientCredentialsMock
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
          expect(oauth.getAccessTokenObject()).resolves.toEqual(
            refreshedCredentials
          ),
        ])
      );
  });

  test('getAccessTokenObject should not return something that is not an object', async () => {
    const oauth = new TokenStorage(tokenGeneratorMock, new Storage());

    await oauth._storeAccessToken('coucou');
    const actual = await oauth.getAccessTokenObject();
    expect(actual).toBeNull();
  });

  test('We can have the remaining validity time for a given token', async () => {
    const oauth = new TokenStorage(tokenGeneratorMock, new Storage());
    fetchMock.once(() => true, oauthClientCredentialsMock);

    const generatedToken = await oauth.generateToken({
      grant_type: 'client_credentials',
    });

    expect(oauth.getTokenExpiresIn(oauthClientCredentialsMock)).toEqual(3600);
    await oauth.refreshToken();
    expect(oauth.getTokenExpiresIn(refreshedCredentials)).toEqual(12800);
  });
});
