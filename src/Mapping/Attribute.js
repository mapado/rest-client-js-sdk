class Attribute {
  constructor(
    serializedKey,
    attributeName = null,
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
