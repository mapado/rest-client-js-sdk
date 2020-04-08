/* eslint-disable @typescript-eslint/camelcase */
import AbstractTokenGenerator from './AbstractTokenGenerator';

class ProvidedTokenGenerator extends AbstractTokenGenerator {
  constructor(token, refreshTokenFunc = null) {
    super();
    this._token = token;
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

  autoGenerateToken() {
    return this.generateToken();
  }
}

export default ProvidedTokenGenerator;
