import { fetchMock } from 'metch-fock';
import { describe, expect, test } from 'vitest';
import mockToken from '../../__mocks__/passwordCredentials.json';
import {
  AuthorizationCodeFlowTokenGenerator,
  Token,
} from '../../src/index';

// `generateToken` and `refreshToken` both POST to the same URL, so we match on
// the request body `grant_type` to return a distinct `Response` per call.
const grantTypeIs =
  (grantType: string) =>
  (input: URL | RequestInfo, options: RequestInit | undefined): boolean =>
    new URLSearchParams(options?.body as string).get('grant_type') ===
    grantType;

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
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
