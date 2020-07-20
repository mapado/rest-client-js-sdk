import AbstractTokenGenerator from './AbstractTokenGenerator';

class ProvidedTokenGenerator extends AbstractTokenGenerator {
  constructor(token, refreshTokenFunc = null) {
    super();
    if (typeof token === 'string') {
      // eslint-disable-next-line no-console
      console.warn(
        'passing a string to ProvidedTokenGenerator is deprecated and has a weird comportment. You should pass an object containing a token object with an `access_token` key'
      );
    }

    this._token = token;
    this.canAutogenerateToken = true;
    this._refreshTokenFunc = refreshTokenFunc;
  }

  generateToken() {
    const accessToken =
      typeof this._token === 'string'
        ? {
            access_token: this._token,
          }
        : this._token;

    return Promise.resolve(accessToken);
  }

  refreshToken() {
    if (typeof this._refreshTokenFunc === 'function') {
      return this._refreshTokenFunc();
    }

    return this.generateToken();
  }
}

export default ProvidedTokenGenerator;
