class TokenStorage {
  constructor(tokenGenerator, asyncStorage, accessTokenKey = 'rest_client_sdk.api.access_token') {
    this._tokenGenerator = tokenGenerator;
    this._hasATokenBeenGenerated = false;
    this._currentTokenExpiresAt = null;
    this.setAsyncStorage(asyncStorage);
    this.accessTokenKey = accessTokenKey;
  }

  setAsyncStorage(asyncStorage) {
    this._asyncStorage = asyncStorage;
  }

  hasAccessToken() {
    return this._asyncStorage
      .getItem(this.accessTokenKey)
      .then(accessToken => !!accessToken);
  }

  getAccessToken() {
    return this.getAccessTokenObject().then(
      token => token && token.access_token
    );
  }

  getAccessTokenObject() {
    return this._asyncStorage.getItem(this.accessTokenKey).then(token => {
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

  generateToken(parameters) {
    this._hasATokenBeenGenerated = true;
    const callTimestamp = Date.now();
    return this._tokenGenerator
      .generateToken(parameters)
      .then(responseData =>
        this._storeAccessToken(responseData, callTimestamp).then(() => responseData)
      );
  }

  refreshToken(parameters) {
    return this._asyncStorage
      .getItem(this.accessTokenKey)
      .then(token => {
        const callTimestamp = Date.now();
        return this._tokenGenerator
          .refreshToken(JSON.parse(token), parameters)
          .then(responseData =>
            this._storeAccessToken(responseData, callTimestamp).then(() => responseData)
          )
      }
      );
  }

  getCurrentTokenExpiresAt() {
    return this._currentTokenExpiresAt;
  }

  _storeAccessToken(responseData, callTimestamp) {
    if (typeof responseData === 'object') {
      this._currentTokenExpiresAt = null;
      if (typeof responseData.expires_in !== 'undefined' && responseData.expires_in >= 0) {
        this._currentTokenExpiresAt = callTimestamp + responseData.expires_in;
      }
    }

    return this._asyncStorage.setItem(
      this.accessTokenKey,
      JSON.stringify(responseData)
    );
  }
}

export default TokenStorage;
