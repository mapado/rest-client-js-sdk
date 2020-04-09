/* eslint-disable @typescript-eslint/camelcase */
import URI from 'urijs';
import AbstractTokenGenerator from './AbstractTokenGenerator';
import { memoizePromise } from '../decorator';
import { Token } from './TokenGeneratorInterface';

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

type DefaultParameters = {
  client_id: string;
  client_secret: string;
  grant_type: string;
  scope?: string;
};

type GenerateTokenParameters = {
  username: string;
  password: string;
};

type RefreshTokenParameters = {
  refresh_token: string;
};

interface PasswordToken extends Token {
  access_token: string;
  token_type: string;
  refresh_token: never;
  expires_in?: number;
  scope?: string;
}

type CallParameters = DefaultParameters &
  (GenerateTokenParameters | RefreshTokenParameters);

class PasswordGenerator extends AbstractTokenGenerator<
  PasswordToken,
  DefaultParameters & GenerateTokenParameters,
  Config
> {
  constructor(props: Config) {
    super(props);
    this._doFetch = memoizePromise(this._doFetch);
  }

  generateToken(
    baseParameters: GenerateTokenParameters
  ): Promise<PasswordToken> {
    this._checkGenerateParameters(baseParameters);

    const parameters: CallParameters = {
      ...baseParameters,
      grant_type: 'password',
      client_id: this.tokenGeneratorConfig.clientId,
      client_secret: this.tokenGeneratorConfig.clientSecret,
    };

    if (this.tokenGeneratorConfig.scope && !parameters.scope) {
      parameters.scope = this.tokenGeneratorConfig.scope;
    }

    return this._doFetch(parameters).then((response) => response.json());
  }

  refreshToken(accessToken: PasswordToken): Promise<PasswordToken> {
    if (!(accessToken && accessToken.refresh_token)) {
      throw new Error(
        'refresh_token is not set. Did you called `generateToken` before ?'
      );
    }

    const parameters: CallParameters = {
      grant_type: 'refresh_token',
      client_id: this.tokenGeneratorConfig.clientId,
      client_secret: this.tokenGeneratorConfig.clientSecret,
      refresh_token: accessToken.refresh_token,
    };

    if (this.tokenGeneratorConfig.scope) {
      parameters.scope = this.tokenGeneratorConfig.scope;
    }

    return this._doFetch(parameters).then((response) =>
      response.clone().json()
    );
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

  _doFetch(parameters: CallParameters): Promise<Response> {
    const uri = new URI(
      `${this.tokenGeneratorConfig.scheme}://${this.tokenGeneratorConfig.path}`
    );

    if (this.tokenGeneratorConfig.port) {
      uri.port(this.tokenGeneratorConfig.port);
    }

    const url = uri.toString();

    return fetch(url, {
      method: 'POST',
      body: this.convertMapToFormData(parameters),
    }).then((response) => {
      if (response.status < 400) {
        return response;
      }

      return this._manageOauthError(response);
    });
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
