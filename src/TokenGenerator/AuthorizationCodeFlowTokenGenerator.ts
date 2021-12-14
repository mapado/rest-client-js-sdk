/* eslint-disable camelcase */
import AbstractTokenGenerator from './AbstractTokenGenerator';
import { Token, TokenResponse } from './types';
import { logRequest } from '../utils/logging';

type AuthorizationCodeFlowTokenGeneratorConfig = {
  clientId: string;
  clientSecret: string;
  path: string;
  scheme: string;
  redirectUri: string;
  port?: string;
  scope?: string;
};

type GenerateTokenParameters = {
  code: string;
  state?: string;
};

interface AuthorizationCodeToken extends Token {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in?: number;
  scope?: string;
}

type AuthorizationCodeFlowResponse = TokenResponse<AuthorizationCodeToken>;

/**
 * This generator take cares of the second part of the authorization code flow : the part where you have a "code"
 * and you have validated the "state"
 * @See {@link https://oauth2.thephpleague.com/authorization-server/auth-code-grant/|the great article of the PHP League} about authorization code flow.
 */
class AuthorizationCodeFlowTokenGenerator extends AbstractTokenGenerator<
  AuthorizationCodeToken,
  AuthorizationCodeFlowTokenGeneratorConfig
> {
  /**
   * This function needs no generate an access token
   */
  generateToken(
    parameters: GenerateTokenParameters
  ): Promise<AuthorizationCodeFlowResponse> {
    this._checkGenerateParameters(parameters);

    const url = this.generateUrlFromConfig(this.tokenGeneratorConfig);

    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.tokenGeneratorConfig.clientId,
        client_secret: this.tokenGeneratorConfig.clientSecret, // TODO : secure this ?
        redirect_uri: this.tokenGeneratorConfig.redirectUri,
        code: parameters.code,
      }),
    };

    if (this.logger) {
      logRequest(this.logger, { url, ...params });
    }

    return fetch(url, params);
  }

  /**
   * This function needs to refresh the current possibly expired access token
   * and return a Promise that will be resolved with a fresh access token
   */
  refreshToken(
    oldAccessToken: null | AuthorizationCodeToken
  ): Promise<AuthorizationCodeFlowResponse> {
    if (!oldAccessToken) {
      throw new Error(
        'refresh_token is not set. Did you called `generateToken` before ?'
      );
    }

    if (!oldAccessToken?.refresh_token) {
      throw new Error('Unable to refreshToken as there are no refresh_token');
    }

    const url = this.generateUrlFromConfig(this.tokenGeneratorConfig);

    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.tokenGeneratorConfig.clientId,
        client_secret: this.tokenGeneratorConfig.clientSecret,
        refresh_token: oldAccessToken.refresh_token,
      }),
    };

    if (this.logger) {
      logRequest(this.logger, { url, ...params });
    }

    return fetch(url, params);
  }

  checkTokenGeneratorConfig(
    config: AuthorizationCodeFlowTokenGeneratorConfig
  ): void {
    if (!config || Object.keys(config).length === 0) {
      throw new RangeError('TokenGenerator config must be set');
    }

    if (!(config.path && config.scheme)) {
      throw new RangeError(
        'TokenGenerator config is not valid, it should contain a "path", a "scheme" parameter'
      );
    }

    if (!(config.clientId && config.clientSecret)) {
      throw new RangeError(
        'TokenGenerator config is not valid, it should contain a "clientId", a "clientSecret" parameter'
      );
    }

    if (!config.redirectUri) {
      throw new RangeError(
        'TokenGenerator config is not valid, it should contain a "redirectUri" parameter'
      );
    }
  }

  private _checkGenerateParameters(parameters: GenerateTokenParameters): void {
    if (!(parameters && Object.keys(parameters).length > 0)) {
      throw new RangeError('parameters must be set');
    }

    if (!parameters.code) {
      throw new RangeError('"code" must be passed as parameter');
    }
  }
}

export default AuthorizationCodeFlowTokenGenerator;
