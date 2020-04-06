import ClassMetadata from './Mapping/ClassMetadata';

const DEFAULT_CONFIG = {
  collectionKey: 'hydra:member',
};

class Mapping {
  readonly idPrefix: string;

  #config: object;

  #classMetadataList: ClassMetadata[];

  constructor(idPrefix = '', config = {}) {
    this.idPrefix = idPrefix;

    this.#classMetadataList = [];

    this.#config = { ...DEFAULT_CONFIG, ...config }; // might be a call to setConfig but TypeScript report an error on #config
  }

  getConfig(): object {
    return this.#config;
  }

  setConfig(config: object): void {
    this.#config = { ...DEFAULT_CONFIG, ...config };
  }

  setMapping(classMetadataList: ClassMetadata[] = []): void {
    this.#classMetadataList = classMetadataList;
  }

  getMappingKeys(): string[] {
    return this.#classMetadataList.map((classMetadata) => classMetadata.key);
  }

  getClassMetadataByKey(key: string): null | ClassMetadata {
    const filterList = this.#classMetadataList.filter(
      (classMetadata) => classMetadata.key === key
    );

    return filterList.length > 0 ? filterList[0] : null;
  }

  isMappingValid(): boolean {
    return !this.#classMetadataList.some((classMetadata) => {
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
              // eslint-disable-next-line global-require, import/no-extraneous-dependencies, @typescript-eslint/no-var-requires
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
