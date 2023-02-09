/* eslint-disable camelcase */
import { memoizePromise } from '../decorator';
import AbstractTokenGenerator from './AbstractTokenGenerator';
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
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.tokenGeneratorConfig.clientId,
      client_secret: this.tokenGeneratorConfig.clientSecret,
    });
    if (baseParameters.scope) {
      body.append('scope', baseParameters.scope);
    } else if (this.tokenGeneratorConfig.scope) {
      body.append('scope', this.tokenGeneratorConfig.scope);
    }

    const params = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    };

    const url = this.generateUrlFromConfig(this.tokenGeneratorConfig);

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
