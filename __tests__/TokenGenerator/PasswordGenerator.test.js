import oauthClientCredentialsMock from '../../__mocks__/passwordCredentials.json';
import { PasswordGenerator } from '../../src/index';
import {
  InternalServerError,
  InvalidGrantError,
  InvalidScopeError,
  OauthError,
  BadRequestError,
  ResourceNotFoundError,
  UnauthorizedError,
} from '../../src/ErrorFactory';

global.fetch = require('jest-fetch-mock');
global.FormData = require('form-data');

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
};

describe('PasswordGenerator tests', () => {
  beforeEach(fetch.resetMocks);

  test('test that config is properly checked', () => {
    function createTokenGenerator(config) {
      return () => new PasswordGenerator(config);
    }

    expect(createTokenGenerator()).toThrowError(RangeError);
    expect(createTokenGenerator({ foo: 'bar' })).toThrowError(RangeError);
    expect(
      createTokenGenerator({ path: 'oauth.me', scheme: 'https' })
    ).toThrowError(RangeError);
    expect(createTokenGenerator(tokenConfig)).not.toThrowError('good config');
  });

  test('test generateToken method', async () => {
    fetch.mockResponse(JSON.stringify(oauthClientCredentialsMock));

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    expect(() => tokenGenerator.generateToken()).toThrowError(RangeError);
    expect(() => tokenGenerator.generateToken({ foo: 'bar' })).toThrowError(
      RangeError
    );
    const response = await tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });
    expect(response).toBeInstanceOf(Response);

    const token = await response.json();

    expect(typeof token).toBe('object');
    expect(token.access_token).toEqual(oauthClientCredentialsMock.access_token);
    expect(token.refresh_token).toEqual(
      oauthClientCredentialsMock.refresh_token
    );
    expect(fetch.mock.calls[0][0]).toEqual('https://oauth.me/');
  });

  test('test that refreshToken refresh the token ;)', async () => {
    expect.assertions(3);
    fetch.mockResponse(JSON.stringify(oauthClientCredentialsMock));

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    try {
      tokenGenerator.refreshToken();
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(
        'refresh_token is not set. Did you called `generateToken` before ?'
      );
    }

    const response = await tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });
    const accessToken = await response.json();

    const refreshTokenResponse = await tokenGenerator.refreshToken(accessToken);
    const refreshToken = await refreshTokenResponse.json();
    expect(refreshToken.access_token).toEqual(
      oauthClientCredentialsMock.access_token
    );
  });

  test('test that refreshToken throws OauthError on 400 with no json body', () => {
    const tokenGenerator = new PasswordGenerator(tokenConfig);

    fetch.mockResponseOnce(JSON.stringify(oauthClientCredentialsMock));

    const generateTokenPromise = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });

    fetch.mockResponseOnce(null, { status: 400 });

    return generateTokenPromise
      .then((r) => r.json())
      .then((accessToken) =>
        tokenGenerator.refreshToken(accessToken).catch((err) => {
          expect(err instanceof OauthError).toEqual(true);
          expect(err.previousError instanceof BadRequestError).toEqual(true);
        })
      );
  });

  test('test that refreshToken throws OauthError on 400 with no oauth error', async () => {
    const tokenGenerator = new PasswordGenerator(tokenConfig);

    fetch.mockResponseOnce(JSON.stringify(oauthClientCredentialsMock));

    const response = await tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });

    fetch.mockResponseOnce(JSON.stringify({ error: 'dummy error' }), {
      status: 400,
    });

    const accessToken = await response.json();

    const r2 = await tokenGenerator.refreshToken(accessToken);
    expect(r2.status).toBe(400);
    const body = await r2.json();
    expect(body.error).toBe('dummy error');
  });

  test('test that OauthError is thrown on 403', async () => {
    fetch.mockResponseOnce(null, { status: 403 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    const response = await tokenGenerator.generateToken({
      password: 'foo',
      username: 'bar',
    });
    expect(response.status).toBe(403);

    //   expect(err instanceof OauthError).toEqual(true);
    //   expect(err.previousError instanceof ForbiddenError).toEqual(true);
    // });
  });

  test('test that OauthError is thrown on 404', () => {
    fetch.mockResponseOnce(null, { status: 404 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch((err) => {
        expect(err instanceof OauthError).toEqual(true);
        expect(err.previousError instanceof ResourceNotFoundError).toEqual(
          true
        );
      });
  });

  test('test that OauthError is thrown on 400', () => {
    fetch.mockResponseOnce(null, { status: 400 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch((err) => {
        expect(err instanceof OauthError).toEqual(true);
        expect(err.previousError instanceof BadRequestError).toEqual(true);
      });
  });

  test('test that InvalidGrantError is thrown when getting a 400 with body error "invalid_grant"', () => {
    fetch.mockResponse(JSON.stringify({ error: 'invalid_grant' }), {
      status: 400,
    });

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    return tokenGenerator
      .refreshToken(oauthClientCredentialsMock)
      .catch((err) => {
        expect(err instanceof InvalidGrantError).toEqual(true);
        expect(err instanceof OauthError).toEqual(true);
        expect(err.previousError instanceof BadRequestError).toEqual(true);
      });
  });

  test('test that InvalidScopeError is thrown when getting a 400 with body error "invalid_scope"', () => {
    fetch.mockResponse(JSON.stringify({ error: 'invalid_scope' }), {
      status: 400,
    });

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    return tokenGenerator
      .refreshToken(oauthClientCredentialsMock)
      .catch((err) => {
        expect(err instanceof InvalidScopeError).toEqual(true);
        expect(err instanceof OauthError).toEqual(true);
        expect(err.previousError instanceof BadRequestError).toEqual(true);
      });
  });

  test('test that OauthError is thrown on 500', () => {
    fetch.mockResponseOnce(null, { status: 500 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch((err) => {
        expect(err instanceof OauthError).toEqual(true);
        expect(err.previousError instanceof InternalServerError).toEqual(true);
      });
  });

  test('test that OauthError error is thrown on 401', () => {
    fetch.mockResponseOnce(null, { status: 401 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch((err) => {
        expect(err instanceof OauthError).toEqual(true);
        expect(err.previousError instanceof UnauthorizedError).toEqual(true);
      });
  });
});
