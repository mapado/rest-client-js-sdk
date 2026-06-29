import { fetchMock } from 'metch-fock';
import { describe, expect, test } from 'vitest';
import oauthClientCredentialsMock from '../../__mocks__/oauthClientCredentials.json';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  ResourceNotFoundError,
  OauthError,
  UnauthorizedError,
} from '../../src/ErrorFactory';
import { ClientCredentialsGenerator } from '../../src/index';

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
};

describe('ClientCredentialsGenerator tests', () => {
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
    fetchMock.post(
      'https://oauth.me/',
      new Response(JSON.stringify(oauthClientCredentialsMock))
    );

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);

    const token = tokenGenerator.generateToken();

    expect(token).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof token).toBe('object'),
      expect(
        token.then((r) => r.json()).then((a) => a.access_token)
      ).resolves.toEqual(oauthClientCredentialsMock.access_token),
    ]);
  });

  test('test that refreshToken method does the same as generateToken', () => {
    fetchMock.post(
      'https://oauth.me/',
      new Response(JSON.stringify(oauthClientCredentialsMock))
    );

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);

    const token = tokenGenerator.refreshToken();

    expect(token).toBeInstanceOf(Promise);

    return Promise.all([
      expect(typeof token).toBe('object'),
      expect(
        token.then((r) => r.json()).then((a) => a.access_token)
      ).resolves.toEqual(oauthClientCredentialsMock.access_token),
    ]);
  });

  test('test that ForbiddenError is thrown', () => {
    fetchMock.post('https://oauth.me/', new Response(null, { status: 403 }));

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch((err) => {
      expect(err instanceof OauthError).toEqual(true);
      expect(err.previousError instanceof ForbiddenError).toEqual(true);
    });
  });

  test('test that ResourceNotFoundError is thrown', () => {
    fetchMock.post('https://oauth.me/', new Response(null, { status: 404 }));

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch((err) => {
      expect(err instanceof OauthError).toEqual(true);
      expect(err.previousError instanceof ResourceNotFoundError).toEqual(true);
    });
  });

  test('test that BadRequestError is thrown', () => {
    fetchMock.post('https://oauth.me/', new Response(null, { status: 400 }));

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch((err) => {
      expect(err instanceof OauthError).toEqual(true);
      expect(err.previousError instanceof BadRequestError).toEqual(true);
    });
  });

  test('test that InternalServerError is thrown', () => {
    fetchMock.post('https://oauth.me/', new Response(null, { status: 500 }));

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch((err) => {
      expect(err instanceof OauthError).toEqual(true);
      expect(err.previousError instanceof InternalServerError).toEqual(true);
    });
  });

  test('test that unexpected error is thrown', () => {
    fetchMock.post('https://oauth.me/', new Response(null, { status: 401 }));

    const tokenGenerator = new ClientCredentialsGenerator(tokenConfig);
    return tokenGenerator.generateToken().catch((err) => {
      expect(err instanceof OauthError).toEqual(true);
      expect(err.previousError instanceof UnauthorizedError).toEqual(true);
    });
  });
});
