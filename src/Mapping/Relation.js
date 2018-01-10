const ONE_TO_MANY = 'ONE_TO_MANY';
const MANY_TO_ONE = 'MANY_TO_ONE';

class Relation {
  constructor(type, relationKey, serializedKey /* , targetEntity */) {
    this.type = type;
    this.serializedKey = serializedKey;
    this.relationKey = relationKey;
    // this.targetEntity = targetEntity;
  }

  isOneToMany() {
    return this.type === ONE_TO_MANY;
  }

  isManyToOne() {
    return this.type === MANY_TO_ONE;
  }
}

export default Relation;
export { ONE_TO_MANY, MANY_TO_ONE };
