/* eslint-disable camelcase */
import AbstractTokenGenerator from './AbstractTokenGenerator';
import { Token, TokenResponse } from './types';

const ERROR_CONFIG_EMPTY = 'TokenGenerator config must be set';
const ERROR_CONFIG_PATH_SCHEME =
  'TokenGenerator config is not valid, it should contain a "path", a "scheme" parameter';
const ERROR_CONFIG_CLIENT_INFORMATIONS =
  'TokenGenerator config is not valid, it should contain a "clientId", a "clientSecret" parameter';

const ERROR_TOKEN_EMPTY = 'parameters must be set';
const ERROR_TOKEN_USERNAME_PASSWORD =
  'username and password must be passed as parameters';

type Config = {
  clientId: string;
  clientSecret: string;
  path: string;
  scheme: string;
  port?: string;
  scope?: string;
};

type GenerateTokenParameters = {
  username: string;
  password: string;
  scope?: string;
};

interface PasswordToken extends Token {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

type PasswordTokenResponse = TokenResponse<PasswordToken>;

class PasswordGenerator extends AbstractTokenGenerator<PasswordToken, Config> {
  generateToken(
    baseParameters: GenerateTokenParameters
  ): Promise<PasswordTokenResponse> {
    this._checkGenerateParameters(baseParameters);

    const body = new URLSearchParams({
      grant_type: 'password',
      username: baseParameters.username,
      password: baseParameters.password,
      client_id: this.tokenGeneratorConfig.clientId,
      client_secret: this.tokenGeneratorConfig.clientSecret,
    });

    if (baseParameters.scope) {
      body.append('scope', baseParameters.scope);
    } else if (this.tokenGeneratorConfig.scope) {
      body.append('scope', this.tokenGeneratorConfig.scope);
    }

    const url = this.generateUrlFromConfig(this.tokenGeneratorConfig);

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  refreshToken(
    accessToken: null | PasswordToken
  ): Promise<PasswordTokenResponse> {
    const refreshToken = accessToken?.refresh_token;
    if (!refreshToken) {
      throw new Error(
        'refresh_token is not set. Did you called `generateToken` before ?'
      );
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.tokenGeneratorConfig.clientId,
      client_secret: this.tokenGeneratorConfig.clientSecret,
      refresh_token: refreshToken,
    });

    if (this.tokenGeneratorConfig.scope) {
      body.append('scope', this.tokenGeneratorConfig.scope);
    }

    const url = this.generateUrlFromConfig(this.tokenGeneratorConfig);

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  }

  checkTokenGeneratorConfig(config: Config): void {
    if (!config || Object.keys(config).length === 0) {
      throw new RangeError(ERROR_CONFIG_EMPTY);
    }

    if (!(config.path && config.scheme)) {
      throw new RangeError(ERROR_CONFIG_PATH_SCHEME);
    }

    if (!(config.clientId && config.clientSecret)) {
      throw new RangeError(ERROR_CONFIG_CLIENT_INFORMATIONS);
    }
  }

  _checkGenerateParameters(parameters: GenerateTokenParameters): void {
    if (!(parameters && Object.keys(parameters).length > 0)) {
      throw new RangeError(ERROR_TOKEN_EMPTY);
    }

    if (!(parameters.username && parameters.password)) {
      throw new RangeError(ERROR_TOKEN_USERNAME_PASSWORD);
    }
  }
}

export default PasswordGenerator;
