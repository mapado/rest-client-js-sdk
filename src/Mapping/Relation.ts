enum RelationTypes {
  ONE_TO_ONE = 'ONE_TO_ONE',
  ONE_TO_MANY = 'ONE_TO_MANY',
  MANY_TO_MANY = 'MANY_TO_MANY',
  MANY_TO_ONE = 'MANY_TO_ONE',
}

class Relation {
  public static ONE_TO_ONE = RelationTypes.ONE_TO_ONE;

  public static ONE_TO_MANY = RelationTypes.ONE_TO_MANY;

  public static MANY_TO_ONE = RelationTypes.MANY_TO_ONE;

  public static MANY_TO_MANY = RelationTypes.MANY_TO_MANY;

  type: RelationTypes;

  readonly targetMetadataKey: string;

  readonly serializedKey: string;

  readonly attributeName: string;

  /**
   * @param {RelationTypes} type the type of relation
   * @param {string} targetMetadataKey must match the first argument of `ClassMetadata` constructor of the target entity
   * @param {string} serializedKey the key returned from your API
   * @param {string|null} attributeName the name in your entity, default to the `serializedKey` attribute
   */
  constructor(
    type: RelationTypes,
    targetMetadataKey: string,
    serializedKey: string,
    attributeName: string | null = null
  ) {
    this.type = type;
    this.targetMetadataKey = targetMetadataKey;
    this.serializedKey = serializedKey;
    this.attributeName = attributeName || this.serializedKey;
  }

  isOneToOne(): boolean {
    return this.type === Relation.ONE_TO_ONE;
  }

  isOneToMany(): boolean {
    return this.type === Relation.ONE_TO_MANY;
  }

  isManyToOne(): boolean {
    return this.type === Relation.MANY_TO_ONE;
  }

  isManyToMany(): boolean {
    return this.type === Relation.MANY_TO_MANY;
  }

  isRelationToMany(): boolean {
    return this.isManyToMany() || this.isOneToMany();
  }

  isRelationToOne(): boolean {
    return this.isManyToOne() || this.isOneToOne();
  }
}

export default Relation;
