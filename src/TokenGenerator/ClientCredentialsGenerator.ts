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

type Config = {
  clientId: string;
  clientSecret: string;
  path: string;
  scheme: string;
  port?: string;
  scope?: string;
};

type Parameters = {
  client_id: string;
  client_secret: string;
  path: string;
  scheme: string;
  grant_type: string;
  scope?: string;
};

type BaseParameters = {
  path: string;
  scheme: string;
  scope?: string;
};

class ClientCredentialsGenerator<
  T extends Token
> extends AbstractTokenGenerator<T, Config> {
  constructor(tokenGeneratorConfig: Config) {
    super(tokenGeneratorConfig);
    this.generateToken = memoizePromise(this.generateToken);
  }

  generateToken(baseParameters: BaseParameters): Promise<T> {
    const parameters: Parameters = {
      ...baseParameters,
      grant_type: 'client_credentials',
      client_id: this.tokenGeneratorConfig.clientId,
      client_secret: this.tokenGeneratorConfig.clientSecret,
    };

    if (this.tokenGeneratorConfig.scope && !parameters.scope) {
      parameters.scope = this.tokenGeneratorConfig.scope;
    }

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
        return response.json();
      }

      return this._manageOauthError(response);
    });
  }

  refreshToken(accessToken: T, parameters: Config): Promise<T> {
    return this.generateToken(parameters);
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
