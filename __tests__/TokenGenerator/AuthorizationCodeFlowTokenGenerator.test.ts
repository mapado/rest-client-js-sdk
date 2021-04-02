/* eslint-disable camelcase */
import mockToken from '../../__mocks__/passwordCredentials.json';
import {
  AuthorizationCodeFlowTokenGenerator,
  PasswordGenerator,
  Token,
} from '../../src/index';
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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error -- Form form data

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
  redirectUri: 'https://client.app',
};

describe('AuthorizationCodeFlowTokenGenerator', () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error -- this is a jest-reset-mock stuff
  beforeEach(fetch.resetMocks);

  test('test that config is properly checked', () => {
    function createTokenGenerator(config) {
      return () => new AuthorizationCodeFlowTokenGenerator(config);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error -- validate for pure JS imlementations
    expect(createTokenGenerator()).toThrowError(RangeError);
    expect(createTokenGenerator({ foo: 'bar' })).toThrowError(RangeError);
    expect(
      createTokenGenerator({ path: 'oauth.me', scheme: 'https' })
    ).toThrowError(RangeError);
    expect(createTokenGenerator(tokenConfig)).not.toThrowError();
  });

  test('test generateToken method', async () => {
    expect.assertions(7);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error -- this is a jest-reset-mock stuff
    fetch.mockResponse(JSON.stringify(mockToken));

    const tokenGenerator = new AuthorizationCodeFlowTokenGenerator(tokenConfig);

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- validate for pure JS imlementations
      await tokenGenerator.generateToken();
    } catch (err) {
      expect(err).toBeInstanceOf(RangeError);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error -- jest-fetch-mock stuff
    expect(fetch.mock.calls[0][0]).toEqual('https://oauth.me/');
  });

  test('refreshToken method', async () => {
    expect.assertions(3);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error -- this is a jest-reset-mock stuff
    fetch.mockResponse(JSON.stringify(mockToken));

    const tokenGenerator = new AuthorizationCodeFlowTokenGenerator(tokenConfig);

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error -- validate for pure JS imlementations
      await tokenGenerator.refreshToken();
    } catch (err) {
      expect(err.message).toBe(
        'refresh_token is not set. Did you called `generateToken` before ?'
      );
    }

    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
