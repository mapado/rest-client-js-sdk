/* global fetch */
import URI from 'urijs';
import AbstractTokenGenerator from './AbstractTokenGenerator';

class ProvidedTokenGenerator extends AbstractTokenGenerator {

  constructor(token, params = {}) {
    super();
    this._token = token;
    this.canAutogenerateToken = true;
    this._params = params;
  }

  generateToken() {
    return Promise.resolve({
      access_token: this._token,
    });
  }

  refreshToken() {
    if (this._params && this._params.refreshTokenUrl) {
      const uri = new URI(this._params.refreshTokenUrl);

      const url = uri.toString();

      return fetch(url, {
        method: 'POST',
      })
        .then((response) => {
          if (response.status !== 200) {
            return response.json()
              .then(responseData => Promise.reject(responseData));
          }

          return response.json();
        })
      ;
    }

    return this.generateToken();
  }
}

export default ProvidedTokenGenerator;
