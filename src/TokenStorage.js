class TokenStorage {
  constructor(tokenGenerator, asyncStorage, accessTokenKey = 'rest_client_sdk.api.access_token') {
    this._tokenGenerator = tokenGenerator;
    this._hasATokenBeenGenerated = false;
    this._tokenExpiresAtMap = {};
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

  /**
   * Return the number of second when the token will expire
   * return value can be negative if the token is already expired
  */
  getTokenExpiresIn(token) {
    return this._tokenExpiresAtMap[token.access_token] - (Date.now() / 1000);
  }

  _storeAccessToken(responseData, callTimestamp) {
    if (typeof responseData === 'object') {
      this._tokenExpiresAtMap[responseData.access_token] = null;
      if (typeof responseData.expires_in !== 'undefined' && responseData.expires_in >= 0) {
        this._tokenExpiresAtMap[responseData.access_token] = (Date.now() / 1000) + responseData.expires_in;
      }
    }

    return this._asyncStorage.setItem(
      this.accessTokenKey,
      JSON.stringify(responseData)
    );
  }
}

export default TokenStorage;
