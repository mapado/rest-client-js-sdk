class Attribute {
  readonly serializedKey: string;

  readonly attributeName: string;

  readonly type: string;

  readonly isIdentifier: boolean;

  /**
   * @param {string} serializedKey the key returned from your API
   * @param {null|string} attributeName the name in your entity, default to the `serializedKey` attribute
   * @param {string} type type of the attribute
   * @param {boolean} isIdentifier is this attribute the entity identifier
   */
  constructor(
    serializedKey: string,
    attributeName: null | string = null,
    type = 'string',
    isIdentifier = false
  ) {
    if (!serializedKey) {
      throw new TypeError('`serializedKey` must not be empty');
    }

    this.serializedKey = serializedKey;
    this.attributeName = attributeName || this.serializedKey;
    this.type = type;
    this.isIdentifier = isIdentifier;
  }
}

export default Attribute;
