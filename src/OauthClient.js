import URI from 'urijs';

const ACCESS_TOKEN_KEY = 'mapado.api.access_token';

class OauthClient {
  constructor(config, clientId, clientSecret, asyncStorage) {
    this._oauthConfig = config;
    this._checkConfigValidity(config);

    this._clientId = clientId;
    this._clientSecret = clientSecret;

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
      .then(token => token && JSON.parse(token).access_token)
    ;
  }

  logout() {
    return this._asyncStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  getToken(formData) {
    formData.append('client_id', this._clientId);
    formData.append('client_secret', this._clientSecret);
    const uri = (new URI(this._oauthConfig.path))
      .scheme(this._oauthConfig.scheme)
    ;

    if (this._oauthConfig.port) {
      uri.port(this._oauthConfig.port);
    }

    const url = uri.toString();

    return fetch(url, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (response.status !== 200) {
        return response.json()
        .then(responseData => Promise.reject(responseData));
      }

      return response.json();
    })
    .then(responseData => {
      return this._storeAccessToken(responseData)
        .then(() => responseData)
      ;
    });
  }

  refreshToken(scope) {
    return this._asyncStorage.getItem(ACCESS_TOKEN_KEY)
      .then(data => {
        const json = JSON.parse(data);
        const accessToken = json.access_token;
        const refreshToken = json.refresh_token;

        const formData = new FormData();
        formData.append('grant_type', 'refresh_token');
        formData.append('access_token', accessToken);
        formData.append('refresh_token', refreshToken);

        if (typeof scope !== 'undefined') {
          formData.append('scope', scope);
        }

        return this.getToken(formData);
      })
    ;
  }

  _storeAccessToken(responseData) {
    return this._asyncStorage
      .setItem(ACCESS_TOKEN_KEY, JSON.stringify(responseData))
    ;
  }

  _checkConfigValidity(config) {
    if (!(config && config.path && config.scheme)) {
      throw new RangeError(
        'OauthClient config is not valid, it should contain a "path", a "scheme" parameter'
      );
    }
  }
}

export default OauthClient;
