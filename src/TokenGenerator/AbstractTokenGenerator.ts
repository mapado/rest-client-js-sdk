/* eslint no-unused-vars: 0 */
import URI from 'urijs';
import {
  getHttpErrorFromResponse,
  InvalidGrantError,
  InvalidScopeError,
  OauthError,
} from '../ErrorFactory';
import TokenGeneratorInterface, {
  TokenBodyReturn,
} from './TokenGeneratorInterface';
import { ErrorBody, Token, TokenResponse } from './types';
import { Logger } from '../utils/logging';

interface UrlConfig {
  scheme: string;
  path: string;
  port?: string;
}
abstract class AbstractTokenGenerator<T extends Token, C>
  implements TokenGeneratorInterface<T> {
  readonly tokenGeneratorConfig: C;

  protected logger?: Logger;

  constructor(tokenGeneratorConfig: C, logger?: Logger) {
    if (logger) {
      this.logger = logger;
    }
    this.tokenGeneratorConfig = tokenGeneratorConfig;
    if (typeof this.checkTokenGeneratorConfig === 'function') {
      this.checkTokenGeneratorConfig(this.tokenGeneratorConfig);
    }
  }

  abstract generateToken(
    parameters: unknown
  ): Promise<TokenBodyReturn<T> | TokenResponse<T>>;

  abstract refreshToken(
    accessToken: null | T
  ): Promise<TokenBodyReturn<T> | TokenResponse<T>>;

  abstract checkTokenGeneratorConfig(config: C): void;

  /** @deprecated */
  protected _manageOauthError(response: Response): Promise<never> {
    return response
      .clone()
      .json()
      .then((body: ErrorBody) => {
        if (body.error === 'invalid_grant') {
          throw new InvalidGrantError(
            body.error,
            getHttpErrorFromResponse(response)
          );
        }
        if (body.error === 'invalid_scope') {
          throw new InvalidScopeError(
            body.error,
            getHttpErrorFromResponse(response)
          );
        }
        throw new OauthError(body.error, getHttpErrorFromResponse(response));
      })
      .catch((err) => {
        if (!(err instanceof OauthError)) {
          throw new OauthError(err.type, getHttpErrorFromResponse(response));
        }

        throw err;
      });
  }

  protected convertMapToFormData(parameters: {
    [key: string]: undefined | string | Blob;
  }): FormData {
    const keys = Object.keys(parameters);

    const formData = new FormData();

    keys.forEach((key) => {
      const value = parameters[key];

      if (typeof value !== 'undefined') {
        formData.append(key, value);
      }
    });

    return formData;
  }

  protected generateUrlFromConfig(config: UrlConfig): string {
    const uri = new URI(`${config.scheme}://${config.path}`);

    if (config.port) {
      uri.port(config.port);
    }

    return uri.toString();
  }
}

export default AbstractTokenGenerator;
