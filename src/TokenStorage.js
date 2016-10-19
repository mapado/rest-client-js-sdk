const ACCESS_TOKEN_KEY = 'rest_client_sdk.api.access_token';

class TokenStorage {
  constructor(tokenGenerator, asyncStorage) {
    this._tokenGenerator = tokenGenerator;
    this._hasATokenBeenGenerated = false;
    this.setAsyncStorage(asyncStorage);
  }

  setAsyncStorage(asyncStorage) {
    this._asyncStorage = asyncStorage;
  }

  hasAccessToken() {
    return this._asyncStorage.getItem(ACCESS_TOKEN_KEY)
      .then(accessToken => !!accessToken);
  }

  getAccessToken() {
    return this._asyncStorage.getItem(ACCESS_TOKEN_KEY)
      .then(token => {
        if (!token) {
          if (!this._hasATokenBeenGenerated && !this._tokenGenerator.canAutogenerateToken) {
            throw new Error('No token has been generated yet.');
          }

          if (!this._hasATokenBeenGenerated && this._tokenGenerator.canAutogenerateToken) {
            return this.generateToken()
              .then(generatedToken => generatedToken && generatedToken.access_token)
            ;
          }
        }

        return token && JSON.parse(token).access_token;
      })
    ;
  }

  logout() {
    return this._asyncStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  generateToken(parameters) {
    this._hasATokenBeenGenerated = true;
    return this._tokenGenerator.generateToken(parameters)
      .then(responseData =>
        this._storeAccessToken(responseData)
          .then(() => responseData)
      )
    ;
  }

  refreshToken(parameters) {
    return this._asyncStorage.getItem(ACCESS_TOKEN_KEY)
      .then(token =>
        this._tokenGenerator
          .refreshToken(JSON.parse(token), parameters)
          .then(responseData =>
            this._storeAccessToken(responseData)
              .then(() => responseData)
          )
      )
    ;
  }

  _storeAccessToken(responseData) {
    return this._asyncStorage
      .setItem(ACCESS_TOKEN_KEY, JSON.stringify(responseData))
    ;
  }
}

export default TokenStorage;
