/* eslint-disable camelcase */
import TokenGeneratorInterface from './TokenGenerator/TokenGeneratorInterface';
import {
  ErrorBody,
  Token,
  TokenBody,
  TokenResponse,
} from './TokenGenerator/types';
import AsyncStorageInterface from './AsyncStorageInterface';
import { memoizePromise } from './decorator';
import type TokenStorageInterface from './TokenStorageInterface';
import {
  getHttpErrorFromResponse,
  InvalidGrantError,
  InvalidScopeError,
  isOauthError,
  OauthError,
} from './ErrorFactory';

interface HasExpiresAt {
  expires_at: null | number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isResponse(response: any): response is Response {
  return typeof response?.json === 'function';
}

class TokenStorage<T extends Token> implements TokenStorageInterface<T> {
  #tokenGenerator: TokenGeneratorInterface<T>;

  #hasATokenBeenGenerated: boolean;

  accessTokenKey: string;

  #asyncStorage!: AsyncStorageInterface;

  constructor(
    tokenGenerator: TokenGeneratorInterface<T>,
    asyncStorage: AsyncStorageInterface,
    accessTokenKey = 'rest_client_sdk.api.access_token'
  ) {
    this.#tokenGenerator = tokenGenerator;
    this.#hasATokenBeenGenerated = false;
    this.setAsyncStorage(asyncStorage);
    this.accessTokenKey = accessTokenKey;

    this.generateToken = memoizePromise(this.generateToken);
    this.refreshToken = memoizePromise(this.refreshToken);
  }

  setAsyncStorage(asyncStorage: AsyncStorageInterface): void {
    this.#asyncStorage = asyncStorage;
  }

  hasAccessToken(): Promise<boolean> {
    return this.#asyncStorage
      .getItem(this.accessTokenKey)
      .then((accessToken) => !!accessToken);
  }

  getAccessToken(): Promise<null | string> {
    return this.getAccessTokenObject().then(
      (token) => token && token.access_token
    );
  }

  getAccessTokenObject(): Promise<null | (T & HasExpiresAt)> {
    return this.#asyncStorage.getItem(this.accessTokenKey).then((token) => {
      if (token) {
        const tokenObject = JSON.parse(token);

        if (typeof tokenObject !== 'object') {
          return null;
        }

        return tokenObject;
      }

      if (this.#hasATokenBeenGenerated) {
        return null;
      }

      if (typeof this.#tokenGenerator.autoGenerateToken === 'function') {
        return this.#tokenGenerator.autoGenerateToken();
      }

      throw new Error('No token has been generated yet.');
    });
  }

  logout(): Promise<void> {
    return this.#asyncStorage.removeItem(this.accessTokenKey);
  }

  private _addExpiresAtToResponseData(
    responseData: T,
    callTimestamp: number
  ): T & HasExpiresAt {
    if (!responseData) {
      return responseData;
    }

    const updatedResponseData: T & HasExpiresAt = {
      ...responseData,
      expires_at: null,
    };

    if (
      typeof updatedResponseData.expires_in !== 'undefined' &&
      updatedResponseData.expires_in !== null
      // && updatedResponseData.expires_in >= 0
    ) {
      updatedResponseData.expires_at =
        Math.round(callTimestamp / 1000) + updatedResponseData.expires_in;
    }

    return updatedResponseData;
  }

  generateToken(parameters: unknown): Promise<T & HasExpiresAt> {
    const callTimestamp = Date.now();

    return this.#tokenGenerator
      .generateToken(parameters)
      .then(async (response) => {
        const body = await this.handleTokenResponse(response);

        const updatedResponseData = this._addExpiresAtToResponseData(
          body,
          callTimestamp
        );

        return this._storeAccessToken(updatedResponseData).then(() => {
          this.#hasATokenBeenGenerated = true;
          return updatedResponseData;
        });
      });
  }

  refreshToken(): Promise<T & HasExpiresAt> {
    return this.#asyncStorage.getItem(this.accessTokenKey).then((token) => {
      const callTimestamp = Date.now();
      return this.#tokenGenerator
        .refreshToken(token ? JSON.parse(token) : null)
        .then(async (response) => {
          const body = await this.handleTokenResponse(response);

          const updatedResponseData = this._addExpiresAtToResponseData(
            body,
            callTimestamp
          );
          return this._storeAccessToken(updatedResponseData).then(
            () => updatedResponseData
          );
        });
    });
  }

  private async handleTokenResponse(
    response: TokenBody<T> | TokenResponse<T>
  ): Promise<T> {
    let body: TokenBody<T>;
    if (isResponse(response)) {
      try {
        body = await response.json();

        if (isOauthError(body)) {
          // throw error if response body is an oauth error
          this._manageOauthError(body, response);
        } else if (response.status >= 400) {
          // throw an error if response status code is an "error" status code
          throw getHttpErrorFromResponse(response);
        }
      } catch (err) {
        if (!(err instanceof OauthError)) {
          throw new OauthError(err.type, getHttpErrorFromResponse(response));
        }

        throw err;
      }
    } else {
      body = response;

      if (isOauthError(body)) {
        // throw error if response body is an oauth error
        this._manageOauthError(body);
      }
    }

    return body;
  }

  /**
   * Return the number of second when the token will expire
   * return value can be negative if the token is already expired
   */
  getCurrentTokenExpiresIn(): Promise<number | null> {
    return this.getAccessTokenObject().then((accessTokenObject) => {
      if (accessTokenObject === null) {
        throw new Error('No token has been stored.');
      }

      if (
        typeof accessTokenObject.expires_at === 'undefined' ||
        accessTokenObject.expires_at === null
      ) {
        return null;
      }

      const now = Math.round(Date.now() / 1000);
      return accessTokenObject.expires_at - now;
    });
  }

  private _storeAccessToken(responseData: T): Promise<unknown> {
    return this.#asyncStorage.setItem(
      this.accessTokenKey,
      JSON.stringify(responseData)
    );
  }

  private _manageOauthError(body: ErrorBody, response?: Response): never {
    let error;
    if (response) {
      error = getHttpErrorFromResponse(response);
    }

    if (body.error === 'invalid_grant') {
      throw new InvalidGrantError(body.error, error);
    }
    if (body.error === 'invalid_scope') {
      throw new InvalidScopeError(body.error, error);
    }

    throw new OauthError(body.error, error);
  }
}

export default TokenStorage;
