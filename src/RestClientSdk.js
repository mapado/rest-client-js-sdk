import JsSerializer from './serializer/JsSerializer';

class RestClientSdk {
  constructor(tokenStorage, config, clientList = {}, serializer = new JsSerializer()) {
    this._checkConfigValidity(config);

    this.config = this._mergeWithBaseConfig(config);
    this.tokenStorage = tokenStorage;
    this.serializer = serializer;

    Object.keys(clientList).forEach((key) => {
      this[key] = new clientList[key](this);
    });
  }

  _mergeWithBaseConfig(config) {
    const newConfig = config;
    newConfig.useDefaultParameters = config.useDefaultParameters === undefined ?
      true :
      config.useDefaultParameters;

    newConfig.authorizationType = config.authorizationType || 'Bearer';

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
