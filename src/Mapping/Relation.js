class Relation {
  constructor(type, relationKey, serializedKey /* , targetEntity */) {
    this.type = type;
    this.serializedKey = serializedKey;
    this.relationKey = relationKey;
    // this.targetEntity = targetEntity;
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
