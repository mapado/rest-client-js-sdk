import fetchMock from 'fetch-mock';
import oauthClientCredentialsMock from '../../__mocks__/passwordCredentials.json';
import { PasswordGenerator } from '../../src/index';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  ResourceNotFoundError,
  AccessDeniedError,
} from '../../src/Error';

global.FormData = require('form-data');

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
};

describe('PasswordGenerator tests', () => {
  afterEach(fetchMock.restore);

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
    fetchMock.post(() => true, oauthClientCredentialsMock);

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
    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    expect(() => tokenGenerator.refreshToken()).toThrowError(Error);

    fetchMock.mock(() => true, oauthClientCredentialsMock);

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

  test('test that refreshToken throws AccessDeniedError on 400', () => {
    const tokenGenerator = new PasswordGenerator(tokenConfig);

    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const generateTokenPromise = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });

    fetchMock.mock(() => true, 400);

    return generateTokenPromise.then(accessToken =>
      tokenGenerator.refreshToken(accessToken).catch(err => {
        expect(err instanceof AccessDeniedError).toEqual(true);
      })
    );
  });

  test('test that ForbiddenError is thrown', () => {
    fetchMock.mock(() => true, 403);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof ForbiddenError).toEqual(true);
      });
  });

  test('test that ResourceNotFoundError is thrown', () => {
    fetchMock.mock(() => true, 404);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof ResourceNotFoundError).toEqual(true);
      });
  });

  test('test that BadRequestError is thrown', () => {
    fetchMock.mock(() => true, 400);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof BadRequestError).toEqual(true);
      });
  });

  test('test that InternalServerError is thrown', () => {
    fetchMock.mock(() => true, 500);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof InternalServerError).toEqual(true);
      });
  });

  test('test that unexpected error is thrown', () => {
    fetchMock.mock(() => true, 401);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof Error).toEqual(true);
      });
  });
});
