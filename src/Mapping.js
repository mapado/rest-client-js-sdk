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

  isMappingValid() {
    return !this._classMetadataList.some(classMetadata => {
      // check that the relations exists
      const errorList = Object.values(classMetadata.getAttributeList()).map(
        attribute => {
          const relation = classMetadata.getRelation(attribute.serializedKey);

          if (!relation) {
            // attribute can not be "invalid" (for now ?)
            return false;
          }

          const relationMetadata = this.getClassMetadataByKey(
            relation.targetMetadataKey
          );

          // no error if there is metadata linked
          if (relationMetadata) {
            return false;
          }

          return `"${classMetadata.key}.${
            attribute.serializedKey
          }" defined a relation to the metadata named "${
            relation.targetMetadataKey
          }" but this metadata is not knowned by the mapping`;
        }
      );

      if (!classMetadata.getIdentifierAttribute()) {
        errorList.push(
          `"${classMetadata.key}" has no identifier attribute set`
        );
      }

      const nbError = errorList.filter(error => {
        if (error) {
          // eslint-disable-next-line no-console
          console.warn(error);
        }

        return error;
      });

      return nbError.length > 0;
    });
  }
}

export default Mapping;
