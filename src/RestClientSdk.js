import { fromJS } from 'immutable';

function createEntity(val, type = null) {
  return fromJS(val);
}

class RestClientSdk {
  constructor(oauthClient, config, clientList = {}, entityFactory = createEntity) {
    this._checkConfigValidity(config);

    this.config = this._mergeWithBaseConfig(config);
    this.oauthClient = oauthClient;
    this.entityFactory = entityFactory;

    Object.keys(clientList).forEach((key) => {
      this[key] = new clientList[key](this);
    });
  }

  _mergeWithBaseConfig(config) {
    const newConfig = config;
    newConfig.useDefaultParameters = config.useDefaultParameters === undefined ?
      true :
      config.useDefaultParameters;

    return newConfig;
  }

  _checkConfigValidity(config) {
    if (!(config && config.path && config.scheme)) {
      throw new RangeError(
        `SDK config is not valid, it should contain a "path", a "scheme" parameter,
        and may contain a "port" and a "useDefaultParameters" parameter`
      );
    }
  }
}

export default RestClientSdk;
