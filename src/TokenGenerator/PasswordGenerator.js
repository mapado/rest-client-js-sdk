import URI from 'urijs';
import AbstractTokenGenerator from './AbstractTokenGenerator';
import { memoizePromise } from '../decorator';
import {
  UnauthorizedError,
  handleBadResponse,
  BadRequestError,
} from '../Error';

const ERROR_CONFIG_EMPTY = 'TokenGenerator config must be set';
const ERROR_CONFIG_PATH_SCHEME =
  'TokenGenerator config is not valid, it should contain a "path", a "scheme" parameter';
const ERROR_CONFIG_CLIENT_INFORMATIONS =
  'TokenGenerator config is not valid, it should contain a "clientId", a "clientSecret" parameter';

const ERROR_TOKEN_EMPTY = 'parameters must be set';
const ERROR_TOKEN_USERNAME_PASSWORD =
  'username and password must be passed as parameters';

class PasswordGenerator extends AbstractTokenGenerator {
  constructor(props) {
    super(props);
    this._doFetch = memoizePromise(this._doFetch);
    this._manageBadRequest = this._manageBadRequest.bind(this);
  }

  generateToken(baseParameters) {
    const parameters = baseParameters;
    this._checkGenerateParameters(parameters);

    parameters.grant_type = 'password';
    parameters.client_id = this.tokenGeneratorConfig.clientId;
    parameters.client_secret = this.tokenGeneratorConfig.clientSecret;

    if (this.tokenGeneratorConfig.scope && !parameters.scope) {
      parameters.scope = this.tokenGeneratorConfig.scope;
    }

    return this._doFetch(parameters).then(response => response.json());
  }

  _manageBadRequest(response) {
    return response
      .json()
      .then(body => {
        if (body.error === 'invalid_grant') {
          // bad params like wrong scopes sent to oauth server
          // will generate a 400, we want final clients to consider it
          // like 401 in order to take proper action
          throw new UnauthorizedError(body.error, response);
        }
        return handleBadResponse(response);
      })
      .catch(err => {
        if (err.type === 'invalid-json') {
          return handleBadResponse(response);
        }
        throw err;
      });
  }

  refreshToken(accessToken, baseParameters = {}) {
    if (!(accessToken && accessToken.refresh_token)) {
      throw new Error(
        'refresh_token is not set. Did you called `generateToken` before ?'
      );
    }

    const parameters = baseParameters;

    parameters.grant_type = 'refresh_token';
    parameters.client_id = this.tokenGeneratorConfig.clientId;
    parameters.client_secret = this.tokenGeneratorConfig.clientSecret;
    if (this.tokenGeneratorConfig.scope && !parameters.scope) {
      parameters.scope = this.tokenGeneratorConfig.scope;
    }

    parameters.refresh_token = accessToken.refresh_token;

    return this._doFetch(parameters).then(response => response.clone().json());
  }

  checkTokenGeneratorConfig(config) {
    if (!config || Object.keys(config).length === 0) {
      throw new RangeError(ERROR_CONFIG_EMPTY);
    }

    if (!(config.path && config.scheme)) {
      throw new RangeError(ERROR_CONFIG_PATH_SCHEME);
    }

    if (!(config.clientId && config.clientSecret)) {
      throw new RangeError(ERROR_CONFIG_CLIENT_INFORMATIONS);
    }
  }

  _doFetch(parameters) {
    const uri = new URI(this.tokenGeneratorConfig.path);
    uri.scheme(this.tokenGeneratorConfig.scheme);

    if (this.tokenGeneratorConfig.port) {
      uri.port(this.tokenGeneratorConfig.port);
    }

    const url = uri.toString();

    return fetch(url, {
      method: 'POST',
      body: this.convertMapToFormData(parameters),
    }).then(response => {
      if (response.status < 400) {
        return response;
      }

      if (response.status === 400) {
        return this._manageBadRequest(response);
      }

      if (response.status !== 400) {
        return handleBadResponse(response);
      }
    });
  }

  _checkGenerateParameters(parameters) {
    if (!(parameters && Object.keys(parameters).length > 0)) {
      throw new RangeError(ERROR_TOKEN_EMPTY);
    }

    if (!(parameters.username && parameters.password)) {
      throw new RangeError(ERROR_TOKEN_USERNAME_PASSWORD);
    }
  }
}

export default PasswordGenerator;
