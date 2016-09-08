import AbstractTokenGenerator from './AbstractTokenGenerator';

class ProvidedTokenGenerator extends AbstractTokenGenerator {

  constructor(token) {
    super();
    this._token = token;
    this.canAutogenerateToken = true;
  }

  generateToken() {
    return Promise.resolve({
      access_token: this._token,
    });
  }

  refreshToken() {
    return this.generateToken();
  }
}

export default ProvidedTokenGenerator;
