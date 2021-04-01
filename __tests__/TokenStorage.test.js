/* eslint-disable max-classes-per-file */
/* eslint-disable no-underscore-dangle */
import fetchMock from 'fetch-mock';
import {
  AbstractTokenGenerator,
  OauthError,
  TokenStorage,
  BadRequestError,
} from '../src';
import ObjectTokenGeneratorMock from '../__mocks__/ObjectTokenGeneratorMock';
import ResponseTokenGeneratorMock from '../__mocks__/ResponseTokenGeneratorMock';
import NoTokenGeneratorMock from '../__mocks__/NoTokenGeneratorMock';
import oauthClientCredentialsMock from '../__mocks__/oauthClientCredentials.json';
import refreshedCredentials from '../__mocks__/refreshedCredentials.json';
import Storage from '../__mocks__/mockStorage';

global.FormData = require('form-data');

const objectTokenGeneratorMock = new ObjectTokenGeneratorMock();
const responseTokenGeneratorMock = new ResponseTokenGeneratorMock();

afterEach(fetchMock.reset);

describe('Token storage tests', () => {
  test('handle empty token', async (done) => {
    const oauth = new TokenStorage(new NoTokenGeneratorMock(), new Storage());

    const hasAccessToken = await oauth.hasAccessToken();
    expect(hasAccessToken).toBe(false);

    return oauth
      .getAccessToken()
      .catch((e) => {
        expect(e.message).toBe('No token has been generated yet.');
      })
      .then(async () => {
        await oauth.generateToken();
        const accessToken = await oauth.getAccessToken();

        expect(accessToken).toBeNull();

        done();
      });
  });

  test.each([[objectTokenGeneratorMock], [responseTokenGeneratorMock]])(
    'handle non empty token',
    (tokenGeneratorMock) => {
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
    }
  );

  test.each([[objectTokenGeneratorMock], [responseTokenGeneratorMock]])(
    'handle generating token',
    (tokenGeneratorMock) => {
      fetchMock.mock(() => true, oauthClientCredentialsMock);

      const oauth = new TokenStorage(tokenGeneratorMock, new Storage());

      const generatedToken = oauth.generateToken({
        grant_type: 'client_credentials',
      });

      expect(generatedToken).toBeInstanceOf(Promise);

      const expectedStoredAccessTokenObject = {
        ...oauthClientCredentialsMock,
        expires_at: 1487080308,
      };

      const expectedStoredRefreshTokenObject = {
        ...refreshedCredentials,
        expires_at: 1487089508,
      };

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
    }
  );

  test.each([[objectTokenGeneratorMock], [responseTokenGeneratorMock]])(
    'getAccessTokenObject should not return something that is not an object',
    async (tokenGeneratorMock) => {
      const oauth = new TokenStorage(tokenGeneratorMock, new Storage());

      await oauth._storeAccessToken('coucou');
      const actual = await oauth.getAccessTokenObject();
      expect(actual).toBeNull();
    }
  );

  test.each([[objectTokenGeneratorMock], [responseTokenGeneratorMock]])(
    'We can have the remaining validity time for a given token',
    async (tokenGeneratorMock) => {
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
    }
  );

  test.each([[objectTokenGeneratorMock], [responseTokenGeneratorMock]])(
    'remaining validity time is null for a token with no expiresAt',
    async (tokenGeneratorMock) => {
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
    }
  );
});

describe('issue with expires_at when to token has been generated', () => {
  test('no expires_at should be found if there is no responseData', async () => {
    const oauth = new TokenStorage(new NoTokenGeneratorMock(), new Storage());

    const token = await oauth.generateToken();

    expect(token).toBeNull();
  });
});

describe('Oauth token generation error', () => {
  class Response {
    constructor(status, body) {
      this.status = status;
      this.body = body;
    }

    async json() {
      return this.body;
    }
  }

  class ErrorTokenGenerator extends AbstractTokenGenerator {
    constructor(status, error) {
      super({});
      this.status = status;
      this.error = error;
    }

    generateToken(parameters) {
      return new Promise((resolve) => {
        resolve(new Response(this.status, { error: this.error }));
      });
    }

    refreshToken(accessToken, parameters) {
      return new Promise((resolve) => {
        resolve(new Response(this.status, { error: this.error }));
      });
    }
  }

  test('400 error with error code', async () => {
    expect.assertions(3);
    const tokenGeneratorMock = new ErrorTokenGenerator(400, 'invalid_request');
    const tokenStorage = new TokenStorage(tokenGeneratorMock, new Storage());

    try {
      await tokenStorage.generateToken();
    } catch (err) {
      expect(err).toBeInstanceOf(OauthError);
      expect(err.message).toBe('invalid_request');
      expect(err.previousError).toBeInstanceOf(BadRequestError);
    }
  });
});
