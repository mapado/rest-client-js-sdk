class Relation {
  constructor(type, targetMetadataKey, serializedKey, attributeName = null) {
    this.type = type;
    this.targetMetadataKey = targetMetadataKey;
    this.serializedKey = serializedKey;
    this.attributeName = attributeName || this.serializedKey;
  }

  isOneToMany() {
    return this.type === Relation.ONE_TO_MANY;
  }

  isManyToOne() {
    return this.type === Relation.MANY_TO_ONE;
  }
}

Relation.ONE_TO_MANY = 'ONE_TO_MANY';
Relation.MANY_TO_ONE = 'MANY_TO_ONE';

export default Relation;
