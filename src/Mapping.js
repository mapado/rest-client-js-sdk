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
    return this._classMetadataList.map((classMetadata) => classMetadata.key);
  }

  getClassMetadataByKey(key) {
    const filterList = this._classMetadataList.filter(
      (classMetadata) => classMetadata.key === key
    );

    return filterList.length > 0 ? filterList[0] : null;
  }

  isMappingValid() {
    return !this._classMetadataList.some((classMetadata) => {
      // check that the relations exists
      const errorList = Object.values(classMetadata.getAttributeList()).map(
        (attribute) => {
          const relation = classMetadata.getRelation(attribute.serializedKey);

          if (!relation) {
            // attribute can not be "invalid" (for now ?)
            return false;
          }

          const relationMetadata = this.getClassMetadataByKey(
            relation.targetMetadataKey
          );

          // relation name seems weird
          if (
            relation.isManyToOne() &&
            attribute.attributeName.endsWith('List')
          ) {
            return `"${classMetadata.key}.${attribute.serializedKey} is defined as a MANY_TO_ONE relation, but the attribute name ends with "List".`;
          }

          if (relation.isOneToMany()) {
            const message = `"${classMetadata.key}.${attribute.serializedKey} is defined as a ONE_TO_MANY relation, but the attribute name is nor plural not ends with "List".`;

            const endsWithList = attribute.attributeName.endsWith('List');

            try {
              // eslint-disable-next-line global-require, import/no-extraneous-dependencies
              const pluralize = require('pluralize');
              if (
                !endsWithList &&
                !pluralize.isPlural(attribute.attributeName)
              ) {
                return message;
              }
            } catch (e) {
              if (!endsWithList) {
                return `${message}.\nIf your keys does not ends with "List", then you should install the "pluralize" package.`;
              }
            }
          }

          // no error if there is metadata linked
          if (!relationMetadata) {
            return `"${classMetadata.key}.${attribute.serializedKey}" defined a relation to the metadata named "${relation.targetMetadataKey}" but this metadata is not knowned by the mapping`;
          }

          return false;
        }
      );

      if (!classMetadata.getIdentifierAttribute()) {
        errorList.push(
          `"${classMetadata.key}" has no identifier attribute set`
        );
      }

      const nbError = errorList.filter((error) => {
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
