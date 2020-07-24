/* eslint no-unused-vars: 0 */
import {
  getHttpErrorFromResponse,
  InvalidGrantError,
  InvalidScopeError,
  OauthError,
} from '../ErrorFactory';
import TokenGeneratorInterface from './TokenGeneratorInterface';
import { Token } from './types';

abstract class AbstractTokenGenerator<T extends Token, C>
  implements TokenGeneratorInterface<T> {
  readonly tokenGeneratorConfig: C;

  constructor(tokenGeneratorConfig: C) {
    this.tokenGeneratorConfig = tokenGeneratorConfig;
    if (typeof this.checkTokenGeneratorConfig === 'function') {
      this.checkTokenGeneratorConfig(this.tokenGeneratorConfig);
    }
  }

  abstract generateToken(parameters: unknown): Promise<T>;

  abstract refreshToken(accessToken: T): Promise<T>;

  abstract checkTokenGeneratorConfig(config: C): void;

  protected _manageOauthError(response: Response): Promise<never> {
    return response
      .json()
      .then((body) => {
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
}

export default AbstractTokenGenerator;
