import fetchMock from 'fetch-mock';
import oauthClientCredentialsMock from '../../__mocks__/oauthClientCredentials.json';
import { TokenStorage, ProvidedTokenGenerator } from '../../src/index';
import Storage from '../../__mocks__/mockStorage';

global.FormData = require('form-data');

const providedToken = {
  access_token: oauthClientCredentialsMock.access_token,
  token_type: 'bearer',
};

describe('ProvidedTokenGenerator tests', () => {
  afterEach(fetchMock.restore);

  test('test generateToken method', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);
    const token = tokenGenerator.generateToken();

    expect(token).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof token).toBe('object'),
      expect(token.then((a) => a.access_token)).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      ),
    ]);
  });

  test('test that refreshToken refresh the token ;)', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);
    const refreshedToken = tokenGenerator.refreshToken();

    expect(refreshedToken).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof refreshedToken).toBe('object'),
      expect(refreshedToken.then((a) => a.access_token)).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      ),
    ]);
  });

  test('test get token without generating it', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);
    const oauth = new TokenStorage(tokenGenerator, new Storage());
    const autogeneratedToken = oauth.getAccessToken();
    expect(autogeneratedToken).toBeInstanceOf(Promise);
    return Promise.all([
      expect(autogeneratedToken.then()).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      ),
    ]);
  });

  test('test generate and get token', () => {
    const tokenGenerator = new ProvidedTokenGenerator(providedToken);
    const oauth = new TokenStorage(tokenGenerator, new Storage());

    const tokenPromise = oauth.generateToken();
    expect(tokenPromise).toBeInstanceOf(Promise);

    return tokenPromise.then((token) => {
      expect(token).toEqual({
        access_token: oauthClientCredentialsMock.access_token,
        expires_at: null,
        token_type: 'bearer',
      });

      const autogeneratedToken = oauth.getAccessToken();
      expect(autogeneratedToken).toBeInstanceOf(Promise);
      return expect(autogeneratedToken).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      );
    });
  });

  test('refresh the token if the second parameter is set', () => {
    const newToken = { a: 'new token' };
    fetchMock.mock('begin:http://foo.bar', newToken);

    const refreshFunc = () =>
      fetch('http://foo.bar', {
        method: 'POST',
      }).then((response) => {
        if (response.status !== 200) {
          return response
            .json()
            .then((responseData) => Promise.reject(responseData));
        }

        return response.json();
      });

    const tokenGenerator = new ProvidedTokenGenerator(
      providedToken,
      refreshFunc
    );

    return expect(tokenGenerator.refreshToken()).resolves.toEqual(newToken);
  });
});
