import fetchMock from 'fetch-mock';
import oauthClientCredentialsMock from '../../__mocks__/oauthClientCredentials.json';
import { ClientCredentialsGenerator } from '../../src/index';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  ResourceNotFoundError,
} from '../../src/Error';

global.FormData = require('form-data');

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
};

describe('ClientCredentialsGenerator tests', () => {
  afterEach(fetchMock.restore);

  test('test that config is properly checked', () => {
    function createTokenGenerator(config) {
      return () => new ClientCredentialsGenerator(config);
    }

    expect(createTokenGenerator()).toThrowError(RangeError);
    expect(createTokenGenerator({ foo: 'bar' })).toThrowError(RangeError);
    expect(
      createTokenGenerator({ path: 'oauth.me', scheme: 'https' })
    ).toThrowError(RangeError);
    expect(createTokenGenerator(tokenConfig)).not.toThrowError('good config');
  });

  test('test generateToken method', () => {
    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);

    const token = tokenGenerator.generateToken();

    expect(token).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof token).toBe('object'),
      expect(token.then(a => a.access_token)).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      ),
    ]);
  });

  test('test thas refreshToken method does the same as generateToken', () => {
    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);

    const token = tokenGenerator.refreshToken();

    expect(token).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof token).toBe('object'),
      expect(token.then(a => a.access_token)).resolves.toEqual(
        oauthClientCredentialsMock.access_token
      ),
    ]);
  });

  test('test that ForbiddenError is thrown', () => {
    fetchMock.mock(() => true, 403);

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch(err => {
      expect(err instanceof ForbiddenError).toEqual(true);
    });
  });

  test('test that ResourceNotFoundError is thrown', () => {
    fetchMock.mock(() => true, 404);

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch(err => {
      expect(err instanceof ResourceNotFoundError).toEqual(true);
    });
  });

  test('test that BadRequestError is thrown', () => {
    fetchMock.mock(() => true, 400);

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch(err => {
      expect(err instanceof BadRequestError).toEqual(true);
    });
  });

  test('test that InternalServerError is thrown', () => {
    fetchMock.mock(() => true, 500);

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch(err => {
      expect(err instanceof InternalServerError).toEqual(true);
    });
  });

  test('test that unexpected error is thrown', () => {
    fetchMock.mock(() => true, 401);

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch(err => {
      expect(err instanceof Error).toEqual(true);
    });
  });
});
