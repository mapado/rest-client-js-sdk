/* eslint no-unused-vars: 0 */
import {
  getHttpErrorFromResponse,
  InvalidGrantError,
  InvalidScopeError,
  OauthError,
} from '../ErrorFactory';
import TokenGeneratorInterface, {
  Token,
  TokenGeneratorParameters,
} from './TokenGeneratorInterface';

abstract class AbstractTokenGenerator<
  T extends Token,
  P extends TokenGeneratorParameters,
  C
> implements TokenGeneratorInterface<T, P> {
  readonly tokenGeneratorConfig: C;

  constructor(tokenGeneratorConfig: C) {
    this.tokenGeneratorConfig = tokenGeneratorConfig;
    if (typeof this.checkTokenGeneratorConfig === 'function') {
      this.checkTokenGeneratorConfig(this.tokenGeneratorConfig);
    }
  }

  abstract generateToken(parameters: P): Promise<T>;

  abstract refreshToken(accessToken: T): Promise<T>;

  abstract checkTokenGeneratorConfig(config: C): void;

  _manageOauthError(response: Response): Promise<never> {
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

  convertMapToFormData(parameters: {
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
