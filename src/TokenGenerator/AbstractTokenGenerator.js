/* eslint no-unused-vars: 0 */
import {
  getHttpErrorFromResponse,
  InvalidGrantError,
  InvalidScopeError,
  OauthError,
} from '../ErrorFactory';

class AbstractTokenGenerator {
  constructor(tokenGeneratorConfig = {}) {
    this.tokenGeneratorConfig = tokenGeneratorConfig;
    this.canAutogenerateToken = false;
    this.checkTokenGeneratorConfig(this.tokenGeneratorConfig);
  }

  generateToken(parameters) {
    throw new Error(`AbstractTokenGenerator::generateToken can not be called directly.
                    You must implement "generateToken" method.`);
  }

  refreshToken(accessToken, parameters) {
    throw new Error(`AbstractTokenGenerator::refreshToken can not be called directly.
                    You must implement "refreshToken" method.`);
  }

  checkTokenGeneratorConfig(config) {
    return true;
  }

  _manageOauthError(response) {
    return response
      .json()
      .then(body => {
        if (body.error === 'invalid_grant') {
          throw new InvalidGrantError(body.error, getHttpErrorFromResponse(response));
        }
        if (body.error === 'invalid_scope') {
          throw new InvalidScopeError(body.error, getHttpErrorFromResponse(response));
        }
        throw new OauthError(body.error, getHttpErrorFromResponse(response));
      })
      .catch((err) => {
        if (!(err instanceof OauthError)) {
          throw new OauthError(err.type, getHttpErrorFromResponse(response));
        }

        throw err;
      });
  }

  convertMapToFormData(parameters) {
    const keys = Object.keys(parameters);

    const formData = new FormData();

    keys.forEach(key => {
      formData.append(key, parameters[key]);
    });

    return formData;
  }
}

export default AbstractTokenGenerator;
