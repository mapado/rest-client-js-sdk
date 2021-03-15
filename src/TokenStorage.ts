/* eslint-disable camelcase */
import TokenGeneratorInterface from './TokenGenerator/TokenGeneratorInterface';
import { Token } from './TokenGenerator/types';
import AsyncStorageInterface from './AsyncStorageInterface';
import { memoizePromise } from './decorator';
import type TokenStorageInterface from './TokenStorageInterface';

interface HasExpiresAt {
  expires_at: null | number;
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
      .then((responseData) => {
        const updatedResponseData = this._addExpiresAtToResponseData(
          responseData,
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
      if (!token) {
          throw new Error('Unable to refresh a token for an unexistant token');
      }
      const callTimestamp = Date.now();
      return this.#tokenGenerator
        .refreshToken(JSON.parse(token))
        .then((responseData) => {
          const updatedResponseData = this._addExpiresAtToResponseData(
            responseData,
            callTimestamp
          );
          return this._storeAccessToken(updatedResponseData).then(
            () => updatedResponseData
          );
        });
    });
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
}

export default TokenStorage;
