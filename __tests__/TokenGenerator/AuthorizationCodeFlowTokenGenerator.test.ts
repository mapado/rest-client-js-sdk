import { fetchMock } from 'metch-fock';
import { describe, expect, test } from 'vitest';
import mockToken from '../../__mocks__/passwordCredentials.json';
import { AuthorizationCodeFlowTokenGenerator, Token } from '../../src/index';

// `generateToken` and `refreshToken` both POST to the same URL, so we match on
// the request body `grant_type` to return a distinct `Response` per call.
const grantTypeIs =
  (grantType: string) =>
  (input: URL | RequestInfo, options: RequestInit | undefined): boolean =>
    new URLSearchParams(options?.body as string).get('grant_type') ===
    grantType;

// Records the body of every matched request so tests can assert on what is sent.
const recordBodies =
  (grantType: string, bodies: URLSearchParams[]) =>
  (input: URL | RequestInfo, options: RequestInit | undefined): boolean => {
    const body = new URLSearchParams(options?.body as string);
    if (body.get('grant_type') !== grantType) {
      return false;
    }
    bodies.push(body);
    return true;
  };

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
  redirectUri: 'https://client.app',
};

const publicClientConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  redirectUri: 'https://client.app',
};

describe('AuthorizationCodeFlowTokenGenerator', () => {
  test('test that config is properly checked', () => {
    function createTokenGenerator(config) {
      return () => new AuthorizationCodeFlowTokenGenerator(config);
    }

    // @ts-expect-error -- validate for pure JS imlementations
    expect(createTokenGenerator()).toThrowError(RangeError);
    expect(createTokenGenerator({ foo: 'bar' })).toThrowError(RangeError);
    expect(
      createTokenGenerator({ path: 'oauth.me', scheme: 'https' })
    ).toThrowError(RangeError);
    expect(createTokenGenerator(tokenConfig)).not.toThrowError();
    expect(createTokenGenerator(publicClientConfig)).not.toThrowError();
    expect(
      createTokenGenerator({ ...publicClientConfig, clientId: undefined })
    ).toThrowError(RangeError);
  });

  test('generateToken sends code_verifier only when passed', async () => {
    const bodies: URLSearchParams[] = [];
    fetchMock(
      recordBodies('authorization_code', bodies),
      new Response(JSON.stringify(mockToken))
    );

    const tokenGenerator = new AuthorizationCodeFlowTokenGenerator(tokenConfig);

    await tokenGenerator.generateToken({
      code: 'abcdef',
      codeVerifier: 'verifier',
    });
    await tokenGenerator.generateToken({ code: 'abcdef' });

    expect(bodies[0].get('code_verifier')).toBe('verifier');
    expect(bodies[0].get('client_secret')).toBe('keep me secret');
    expect(bodies[1].has('code_verifier')).toBe(false);
  });

  test('public client sends no client_secret', async () => {
    const bodies: URLSearchParams[] = [];
    fetchMock(
      recordBodies('authorization_code', bodies),
      new Response(JSON.stringify(mockToken))
    );
    fetchMock(
      recordBodies('refresh_token', bodies),
      new Response(JSON.stringify(mockToken))
    );

    const tokenGenerator = new AuthorizationCodeFlowTokenGenerator(
      publicClientConfig
    );

    const response = await tokenGenerator.generateToken({
      code: 'abcdef',
      codeVerifier: 'verifier',
    });
    const accessToken = (await response.json()) as Token & {
      refresh_token: string;
    };
    await tokenGenerator.refreshToken(accessToken);

    expect(bodies.map((body) => body.get('grant_type'))).toEqual([
      'authorization_code',
      'refresh_token',
    ]);
    expect(bodies[0].has('client_secret')).toBe(false);
    expect(bodies[1].has('client_secret')).toBe(false);
    expect(bodies[0].get('client_id')).toBe('8');
  });

  test('test generateToken method', async () => {
    expect.assertions(6);
    fetchMock(
      grantTypeIs('authorization_code'),
      new Response(JSON.stringify(mockToken))
    );

    const tokenGenerator = new AuthorizationCodeFlowTokenGenerator(tokenConfig);

    try {
      // @ts-expect-error -- validate for pure JS imlementations
      await tokenGenerator.generateToken();
    } catch (err) {
      expect(err).toBeInstanceOf(RangeError);
    }

    try {
      // @ts-expect-error -- validate for pure JS imlementations
      await tokenGenerator.generateToken({ foo: 'bar' });
    } catch (err) {
      expect(err).toBeInstanceOf(RangeError);
    }
    const response = await tokenGenerator.generateToken({
      code: 'abcdef',
    });
    expect(response).toBeInstanceOf(Response);

    const token = (await response.json()) as Token;
    expect(typeof token).toBe('object');
    expect(token.access_token).toEqual(mockToken.access_token);
    expect(token.refresh_token).toEqual(mockToken.refresh_token);
  });

  test('refreshToken method', async () => {
    expect.assertions(3);
    fetchMock(
      grantTypeIs('authorization_code'),
      new Response(JSON.stringify(mockToken))
    );
    fetchMock(
      grantTypeIs('refresh_token'),
      new Response(JSON.stringify(mockToken))
    );

    const tokenGenerator = new AuthorizationCodeFlowTokenGenerator(tokenConfig);

    try {
      // @ts-expect-error -- validate for pure JS imlementations
      await tokenGenerator.refreshToken();
    } catch (err) {
      expect(err.message).toBe(
        'refresh_token is not set. Did you called `generateToken` before ?'
      );
    }

    try {
      // @ts-expect-error -- validate for pure JS imlementations
      await tokenGenerator.refreshToken({ access_token: 'foo' });
    } catch (err) {
      expect(err.message).toBe(
        'Unable to refreshToken as there are no refresh_token'
      );
    }

    const response = await tokenGenerator.generateToken({
      code: 'abcdef',
    });
    const accessToken = (await response.json()) as Token & {
      refresh_token: string;
    };

    const refreshTokenResponse = await tokenGenerator.refreshToken(accessToken);
    const refreshToken = (await refreshTokenResponse.json()) as Token;
    expect(refreshToken.access_token).toEqual(mockToken.access_token);
  });
});
