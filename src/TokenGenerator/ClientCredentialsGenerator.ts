/* eslint-disable camelcase */
import AbstractTokenGenerator from './AbstractTokenGenerator';
import { memoizePromise } from '../decorator';
import { Token, TokenResponse } from './types';

const ERROR_CONFIG_EMPTY = 'TokenGenerator config must be set';
const ERROR_CONFIG_PATH_SCHEME =
  'TokenGenerator config is not valid, it should contain a "path", a "scheme" parameter';
const ERROR_CONFIG_CLIENT_INFORMATIONS =
  'TokenGenerator config is not valid, it should contain a "clientId", a "clientSecret" parameter';

type Config = {
  clientId: string;
  clientSecret: string;
  path: string;
  scheme: string;
  port?: string;
  scope?: string;
};

type BaseParameters = {
  scope?: string;
};

type Parameters = BaseParameters & {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
};

interface ClientCredentialToken extends Token {
  access_token: string;
  token_type: string;
  refresh_token: never;
  expires_in?: number;
  scope?: string;
}

type ClientCredentialResponse = TokenResponse<ClientCredentialToken>;

class ClientCredentialsGenerator extends AbstractTokenGenerator<
  ClientCredentialToken,
  Config
> {
  constructor(tokenGeneratorConfig: Config) {
    super(tokenGeneratorConfig);
    this.generateToken = memoizePromise(this.generateToken);
  }

  generateToken(
    baseParameters: BaseParameters = {}
  ): Promise<ClientCredentialResponse> {
    const parameters: Parameters = {
      grant_type: 'client_credentials',
      client_id: this.tokenGeneratorConfig.clientId,
      client_secret: this.tokenGeneratorConfig.clientSecret,
    };

    if (baseParameters.scope) {
      parameters.scope = baseParameters.scope;
    } else if (this.tokenGeneratorConfig.scope) {
      parameters.scope = this.tokenGeneratorConfig.scope;
    }

    const url = this.generateUrlFromConfig(this.tokenGeneratorConfig);

    const params = {
      method: 'POST',
      body: this.convertMapToFormData({ ...parameters }), // hack. See https://github.com/Microsoft/TypeScript/issues/15300
    };

    if (this.logger) {
      this.logger.logRequest({ url, ...params });
    }

    return fetch(url, params);
  }

  refreshToken(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessToken: null | ClientCredentialToken
  ): Promise<ClientCredentialResponse> {
    return this.generateToken({});
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
}

export default ClientCredentialsGenerator;
