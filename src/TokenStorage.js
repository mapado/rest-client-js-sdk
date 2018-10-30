class TokenStorage {
  constructor(tokenGenerator, asyncStorage, accessTokenKey = 'rest_client_sdk.api.access_token') {
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
    return this._tokenGenerator
      .generateToken(parameters)
      .then(responseData =>
        this._storeAccessToken(responseData).then(() => responseData)
      );
  }

  refreshToken(parameters) {
    return this._asyncStorage
      .getItem(this.accessTokenKey)
      .then(token =>
        this._tokenGenerator
          .refreshToken(JSON.parse(token), parameters)
          .then(responseData =>
            this._storeAccessToken(responseData).then(() => responseData)
          )
      );
  }

  _storeAccessToken(responseData) {
    return this._asyncStorage.setItem(
      this.accessTokenKey,
      JSON.stringify(responseData)
    );
  }
}

export default TokenStorage;
