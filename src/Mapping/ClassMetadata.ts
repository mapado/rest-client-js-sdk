import AbstractClient from '../client/AbstractClient';
import Attribute from './Attribute';
import Relation from './Relation';

type AttributeListType = { [key: string]: Attribute };
type RelationListType = { [key: string]: Relation };
export type DefaultSerializedModelType = {
  [key: string]: null | null[];
};

class ClassMetadata {
  readonly key: string;

  readonly pathRoot: string;

  repositoryClass: typeof AbstractClient;

  #attributeList: AttributeListType;

  #relationList: RelationListType;

  #identifierAttribute?: Attribute;

  /**
   * @param {string} key mandatory, will be passed in your serializer
   * @param {string|null} pathRoot the endpoint of your API: will be added to the mapping prefix ('/v1' here)
   * @param {typeof AbstractClient} repositoryClass [Overriding repository]{@link https://github.com/mapado/rest-client-js-sdk/tree/5.x#overriding-repository} for more detail
   */
  constructor(
    key: string,
    pathRoot: string | null = null,
    //  modelName,
    repositoryClass: typeof AbstractClient = AbstractClient
  ) {
    if (!key) {
      throw new TypeError('key attribute are required');
    }

    this.key = key;
    this.pathRoot = pathRoot || key;
    // this.modelName = modelName;
    this.repositoryClass = repositoryClass;

    this.#attributeList = {};
    this.#relationList = {};
  }

  getAttribute(name: string): Attribute {
    return this.#attributeList[name];
  }

  hasIdentifierAttribute(): boolean {
    return !!this.#identifierAttribute;
  }

  getIdentifierAttribute(): Attribute {
    if (!this.#identifierAttribute) {
      throw new TypeError(
        `"${this.key}" has no identifier attribute set. Did you call "setAttributeList" first ?`
      );
    }

    return this.#identifierAttribute;
  }

  getAttributeList(): AttributeListType {
    return this.#attributeList;
  }

  setAttributeList(attributeList: Attribute[]): void {
    this.#attributeList = {};
    this.#identifierAttribute = undefined;

    attributeList.forEach((attribute) => {
      this.#attributeList[attribute.serializedKey] = attribute;

      if (attribute.isIdentifier) {
        this.#identifierAttribute = attribute;
      }
    });

    if (!this.#identifierAttribute) {
      throw new TypeError(
        `"${this.key}" has no identifier attribute set. You must set all your attributes in one time and send an attribute with "isIdentifier=true"`
      );
    }
  }

  setRelationList(relationList: Relation[]): void {
    this.#relationList = {};

    relationList.forEach((relation) => {
      this.#relationList[relation.serializedKey] = relation;
      this.#attributeList[relation.serializedKey] = new Attribute(
        relation.serializedKey,
        relation.serializedKey,
        relation.isOneToMany() ? 'array' : 'object'
      );
    });
  }

  getRelation(key: string): Relation {
    return this.#relationList[key];
  }

  getDefaultSerializedModel(): DefaultSerializedModelType {
    const out: DefaultSerializedModelType = {};

    Object.keys(this.#attributeList).forEach((serializedKey) => {
      out[serializedKey] = null;
    });

    Object.keys(this.#relationList).forEach((serializedKey) => {
      const relation = this.#relationList[serializedKey];

      if (relation.isOneToMany()) {
        out[serializedKey] = [];
      }
    });

    return out;
  }
}

export default ClassMetadata;
