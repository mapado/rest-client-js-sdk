class TokenStorage {
  constructor(
    tokenGenerator,
    asyncStorage,
    accessTokenKey = 'rest_client_sdk.api.access_token'
  ) {
    this._tokenGenerator = tokenGenerator;
    this._hasATokenBeenGenerated = false;
    this.setAsyncStorage(asyncStorage);
    this.accessTokenKey = accessTokenKey;
  }

  setAsyncStorage(asyncStorage) {
    this._asyncStorage = asyncStorage;
  }

  hasAccessToken() {
    return this._asyncStorage
      .getItem(this.accessTokenKey)
      .then((accessToken) => !!accessToken);
  }

  getAccessToken() {
    return this.getAccessTokenObject().then(
      (token) => token && token.access_token
    );
  }

  getAccessTokenObject() {
    return this._asyncStorage.getItem(this.accessTokenKey).then((token) => {
      if (token) {
        const tokenObject = JSON.parse(token);

        if (typeof tokenObject !== 'object') {
          return null;
        }

        return tokenObject;
      }

      if (this._hasATokenBeenGenerated) {
        return null;
      }

      if (!this._tokenGenerator.canAutogenerateToken) {
        throw new Error('No token has been generated yet.');
      }

      return this.generateToken();
    });
  }

  logout() {
    return this._asyncStorage.removeItem(this.accessTokenKey);
  }

  _addExpiresAtToResponseData(responseData, callTimestamp) {
    if (!responseData) {
      return responseData;
    }

    const updatedResponseData = { ...responseData };
    updatedResponseData.expires_at = null;

    if (
      typeof updatedResponseData.expires_in !== 'undefined' &&
      updatedResponseData.expires_in !== null &&
      updatedResponseData.expires_in >= 0
    ) {
      updatedResponseData.expires_at =
        Math.round(callTimestamp / 1000) + updatedResponseData.expires_in;
    }

    return updatedResponseData;
  }

  generateToken(parameters) {
    this._hasATokenBeenGenerated = true;
    const callTimestamp = Date.now();
    return this._tokenGenerator
      .generateToken(parameters)
      .then((responseData) => {
        const updatedResponseData = this._addExpiresAtToResponseData(
          responseData,
          callTimestamp
        );
        return this._storeAccessToken(updatedResponseData, callTimestamp).then(
          () => updatedResponseData
        );
      });
  }

  refreshToken(parameters) {
    return this._asyncStorage.getItem(this.accessTokenKey).then((token) => {
      const callTimestamp = Date.now();
      return this._tokenGenerator
        .refreshToken(JSON.parse(token), parameters)
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
  getCurrentTokenExpiresIn() {
    return this.getAccessTokenObject().then((accessTokenObject) => {
      if (accessTokenObject === null) {
        throw new Error('No token has been stored.');
      }

      if (typeof accessTokenObject.expires_at === 'undefined') {
        return null;
      }

      const now = Math.round(Date.now() / 1000);
      return accessTokenObject.expires_at - now;
    });
  }

  _storeAccessToken(responseData) {
    return this._asyncStorage.setItem(
      this.accessTokenKey,
      JSON.stringify(responseData)
    );
  }
}

export default TokenStorage;
