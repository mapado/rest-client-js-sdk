import oauthClientCredentialsMock from '../../__mocks__/passwordCredentials.json';
import { PasswordGenerator } from '../../src/index';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
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

  test('test generateToken method', () => {
    fetch.mockResponse(JSON.stringify(oauthClientCredentialsMock));

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    expect(() => tokenGenerator.generateToken()).toThrowError(RangeError);
    expect(() => tokenGenerator.generateToken({ foo: 'bar' })).toThrowError(
      RangeError
    );
    const token = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });
    expect(token).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof token).toBe('object'),
      expect(token.then(a => a.access_token)).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      ),
      expect(token.then(a => a.refresh_token)).resolves.toEqual(
        oauthClientCredentialsMock.refresh_token
      ),
    ]);
  });

  test('test that refreshToken refresh the token ;)', () => {
    fetch.mockResponse(JSON.stringify(oauthClientCredentialsMock));

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    expect(() => tokenGenerator.refreshToken()).toThrowError(Error);

    const generateTokenPromise = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });

    return Promise.all([
      generateTokenPromise.then(accessToken => {
        expect(() => tokenGenerator.refreshToken(accessToken)).not.toThrowError(
          Error
        );
        expect(
          tokenGenerator
            .refreshToken(accessToken)
            .then(token => token.access_token)
        ).resolves.toEqual(oauthClientCredentialsMock.access_token);
      }),
    ]);
  });

  test('test that refreshToken throws BadRequest on 400 with no json body', () => {
    const tokenGenerator = new PasswordGenerator(tokenConfig);

    fetch.mockResponseOnce(JSON.stringify(oauthClientCredentialsMock));

    const generateTokenPromise = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });

    fetch.mockResponseOnce(null, { status: 400 });

    return generateTokenPromise.then(accessToken =>
      tokenGenerator.refreshToken(accessToken).catch(err => {
        expect(err instanceof BadRequestError).toEqual(true);
      })
    );
  });

  test('test that refreshToken throws BadRequest on 400 with no oauth error', () => {
    const tokenGenerator = new PasswordGenerator(tokenConfig);

    fetch.mockResponseOnce(JSON.stringify(oauthClientCredentialsMock));

    const generateTokenPromise = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });

    fetch.mockResponseOnce(JSON.stringify({ error: 'dummy error' }), {
      status: 400,
    });

    return generateTokenPromise.then(accessToken =>
      tokenGenerator.refreshToken(accessToken).catch(err => {
        expect(err instanceof BadRequestError).toEqual(true);
      })
    );
  });

  test('test that ForbiddenError is thrown', () => {
    fetch.mockResponseOnce(null, { status: 403 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof ForbiddenError).toEqual(true);
      });
  });

  test('test that ResourceNotFoundError is thrown', () => {
    fetch.mockResponseOnce(null, { status: 404 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof ResourceNotFoundError).toEqual(true);
      });
  });

  test('test that BadRequestError is thrown', () => {
    fetch.mockResponseOnce(null, { status: 400 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof BadRequestError).toEqual(true);
      });
  });

  test('test that UnauthorizedError is thrown when getting a 400 with body error "invalid_grant"', () => {
    fetch.mockResponse(JSON.stringify({ error: 'invalid_grant' }), {
      status: 400,
    });

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    return tokenGenerator
      .refreshToken(oauthClientCredentialsMock)
      .catch(err => {
        expect(err instanceof UnauthorizedError).toEqual(true);
      });
  });

  test('test that InternalServerError is thrown', () => {
    fetch.mockResponseOnce(null, { status: 500 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof InternalServerError).toEqual(true);
      });
  });

  test('test that unexpected error is thrown', () => {
    fetch.mockResponseOnce(null, { status: 401 });

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof Error).toEqual(true);
      });
  });
});
