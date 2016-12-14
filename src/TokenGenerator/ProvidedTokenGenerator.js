/* global fetch */
import AbstractTokenGenerator from './AbstractTokenGenerator';

class ProvidedTokenGenerator extends AbstractTokenGenerator {

  constructor(token, refreshTokenFunc = null) {
    super();
    this._token = token;
    this.canAutogenerateToken = true;
    this._refreshTokenFunc = refreshTokenFunc;
  }

  generateToken() {
    return Promise.resolve({
      access_token: this._token,
    });
  }

  refreshToken() {
    if (typeof this._refreshTokenFunc === 'function') {
      return this._refreshTokenFunc();
    }

    return this.generateToken();
  }
}

export default ProvidedTokenGenerator;
