import URI from 'urijs';
import { handleBadResponse } from '../Error';
import AbstractTokenGenerator from './AbstractTokenGenerator';
import { memoizePromise } from '../decorator';

const ERROR_CONFIG_EMPTY = 'TokenGenerator config must be set';
const ERROR_CONFIG_PATH_SCHEME =
  'TokenGenerator config is not valid, it should contain a "path", a "scheme" parameter';
const ERROR_CONFIG_CLIENT_INFORMATIONS =
  'TokenGenerator config is not valid, it should contain a "clientId", a "clientSecret" parameter';

class ClientCredentialsGenerator extends AbstractTokenGenerator {
  constructor(props) {
    super(props);
    this.generateToken = memoizePromise(this.generateToken);
  }

  generateToken(baseParameters = {}) {
    const parameters = baseParameters;
    parameters.grant_type = 'client_credentials';
    parameters.client_id = this.tokenGeneratorConfig.clientId;
    parameters.client_secret = this.tokenGeneratorConfig.clientSecret;

    if (this.tokenGeneratorConfig.scope && !parameters.scope) {
      parameters.scope = this.tokenGeneratorConfig.scope;
    }

    const uri = new URI(this.tokenGeneratorConfig.path).scheme(
      this.tokenGeneratorConfig.scheme
    );

    if (this.tokenGeneratorConfig.port) {
      uri.port(this.tokenGeneratorConfig.port);
    }

    const url = uri.toString();

    return fetch(url, {
      method: 'POST',
      body: this.convertMapToFormData(parameters),
    }).then(response => {
      if (response.status >= 400) {
        return handleBadResponse(response);
      }

      return response.json();
    });
  }

  refreshToken(accessToken, parameters) {
    return this.generateToken(parameters);
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
}

export default ClientCredentialsGenerator;
