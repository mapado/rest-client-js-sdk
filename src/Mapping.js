const DEFAULT_CONFIG = {
  collectionKey: 'hydra:member',
};

class Mapping {
  constructor(idPrefix = '', config = {}) {
    this.idPrefix = idPrefix;

    this._idPrefixLength = idPrefix.length;
    this._classMetadataList = [];

    this.setConfig(config);
  }

  getConfig() {
    return this._config;
  }

  setConfig(config) {
    this._config = Object.assign({}, DEFAULT_CONFIG, config);
  }

  setMapping(classMetadataList = []) {
    this._classMetadataList = classMetadataList;
  }

  getMappingKeys() {
    return this._classMetadataList.map(classMetadata => classMetadata.key);
  }

  getClassMetadataByKey(key) {
    const filterList = this._classMetadataList.filter(
      classMetadata => classMetadata.key === key
    );

    return filterList.length > 0 ? filterList[0] : null;
  }
}

export default Mapping;
