import JsSerializer from './serializer/JsSerializer';
import UnitOfWork from './UnitOfWork';
import Mapping from './Mapping';

class RestClientSdk {
  constructor(
    tokenStorage = null,
    config,
    mapping,
    serializer = new JsSerializer()
  ) {
    this._checkConfigValidity(config);

    if (!(mapping instanceof Mapping)) {
      throw new TypeError('mapping should be an instance of `Mapping`');
    }

    this.config = this._mergeWithBaseConfig(config);
    this.tokenStorage = tokenStorage;
    this.serializer = serializer;
    this.mapping = mapping;

    this.unitOfWork = new UnitOfWork(this.mapping);

    this._repositoryList = {};
  }

  getRepository(key) {
    if (!this._repositoryList[key]) {
      const metadata = this.mapping.getClassMetadataByKey(key);
      // eslint-disable-next-line new-cap
      this._repositoryList[key] = new metadata.repositoryClass(this, metadata);
    }

    return this._repositoryList[key];
  }

  _mergeWithBaseConfig(config) {
    const newConfig = config;
    newConfig.useDefaultParameters =
      config.useDefaultParameters === undefined
        ? true
        : config.useDefaultParameters;

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
