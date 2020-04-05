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
      .catch((e) => {
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

    const expectedStoredAccessTokenObject = Object.assign(
      {},
      oauthClientCredentialsMock,
      {
        expires_at: 1487080308,
      }
    );

    const expectedStoredRefreshTokenObject = Object.assign(
      {},
      refreshedCredentials,
      {
        expires_at: 1487089508,
      }
    );

    return Promise.all([
      expect(typeof generatedToken).toBe('object'),
      expect(generatedToken.then((a) => a.access_token)).resolves.toEqual(
        expectedStoredAccessTokenObject.access_token
      ),
    ])
      .then(() =>
        Promise.all([
          expect(oauth.hasAccessToken()).resolves.toBe(true),
          expect(oauth.getAccessToken()).resolves.toEqual(
            expectedStoredAccessTokenObject.access_token
          ),
          expect(oauth.getAccessTokenObject()).resolves.toEqual(
            expectedStoredAccessTokenObject
          ),
        ])
      )
      .then(() =>
        Promise.all([
          expect(
            oauth.refreshToken().then((a) => a.access_token)
          ).resolves.toEqual(expectedStoredRefreshTokenObject.access_token),
        ])
      )
      .then(() =>
        Promise.all([
          expect(oauth.hasAccessToken()).resolves.toBe(true),
          expect(oauth.getAccessToken()).resolves.toEqual(
            expectedStoredRefreshTokenObject.access_token
          ),
          expect(oauth.getAccessTokenObject()).resolves.toEqual(
            expectedStoredRefreshTokenObject
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

    await oauth.generateToken({
      grant_type: 'client_credentials',
    });

    return oauth.getCurrentTokenExpiresIn().then((value) => {
      expect(value).toEqual(3600);
      return oauth.refreshToken().then(() => {
        return oauth.getCurrentTokenExpiresIn().then((val) => {
          expect(val).toEqual(12800);
        });
      });
    });
  });

  test('remaining validity time is null for a token with no expiresAt', async () => {
    const oauth = new TokenStorage(tokenGeneratorMock, new Storage());
    fetchMock.once(() => true, oauthClientCredentialsMock);

    await oauth._storeAccessToken({
      access_token:
        'MzM2ZDY4MSNjYTcwZjg0YTYyMWMxZmY5ZWMwMNAyZjIxMDc5dDZjODI4YjkyZDUbMzU0NTFjVGI1MGMzMzAzMQ',
      expires_in: 3600,
      token_type: 'bearer',
      scope:
        'ticketing:events:read ticketing:tickets:read ticketing:tickets:update',
      refresh_token:
        'NjEwYTlke2I2NTBkNzkzNEI3N8Q5OWVhNDhjYTMmMTJhMNE0NTE2Yzk4oDlkM2Y2MDVjXjBlMjFlN9MwYTNkOA',
    });

    return oauth.getCurrentTokenExpiresIn().then((value) => {
      expect(value).toEqual(null);
      return oauth.refreshToken().then(() => {
        return oauth.getCurrentTokenExpiresIn().then((val) => {
          expect(val).toEqual(12800);
        });
      });
    });
  });
});
