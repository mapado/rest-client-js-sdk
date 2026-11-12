/* eslint no-unused-vars: 0 */
import URI from 'urijs';
import {
  getHttpErrorFromResponse,
  InvalidGrantError,
  InvalidScopeError,
  OauthError,
} from '../ErrorFactory';
import { Logger } from '../utils/logging';
import TokenGeneratorInterface, {
  TokenBodyReturn,
} from './TokenGeneratorInterface';
import { ErrorBody, Token, TokenResponse } from './types';

interface UrlConfig {
  scheme: string;
  path: string;
  port?: string;
}
// accepts any config type, but a `fetch` key must be a fetch function when there is one
type WithOptionalFetch<C> = 'fetch' extends keyof C
  ? { fetch?: typeof fetch }
  : unknown;

abstract class AbstractTokenGenerator<
  T extends Token,
  C extends WithOptionalFetch<C>,
> implements TokenGeneratorInterface<T> {
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

  protected _fetch(input: string, init: RequestInit): Promise<Response> {
    // WithOptionalFetch guarantees this type, but TypeScript cannot read a key from a conditional constraint
    const config = this.tokenGeneratorConfig as { fetch?: typeof fetch };
    // eslint-disable-next-line no-restricted-globals -- default for the injectable fetch
    const fetchFn = config?.fetch ?? fetch;
    return fetchFn(input, init);
  }

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

  protected generateUrlFromConfig(config: UrlConfig): string {
    const uri = new URI(`${config.scheme}://${config.path}`);

    if (config.port) {
      uri.port(config.port);
    }

    return uri.toString();
  }
}

export default AbstractTokenGenerator;
