import AbstractClient from '../client/AbstractClient';
import Attribute from './Attribute';

class ClassMetadata {
  constructor(key, pathRoot = null /* , modelName */, repositoryClass = null) {
    if (!key) {
      throw new TypeError('key attribute are required');
    }

    this.key = key;
    this.pathRoot = pathRoot || key;
    // this.modelName = modelName;
    this.repositoryClass = repositoryClass || AbstractClient;

    this._attributeList = {};
    this._relationList = {};
    this._identifierAttribute = null;
  }

  getAttribute(name) {
    return this._attributeList[name];
  }

  getIdentifierAttribute() {
    return this._identifierAttribute;
  }

  getAttributeList() {
    return this._attributeList;
  }

  setAttributeList(attributeList) {
    this._attributeList = {};
    this._identifierAttribute = null;

    attributeList.forEach((attribute) => {
      this._attributeList[attribute.serializedKey] = attribute;

      if (attribute.isIdentifier) {
        this._identifierAttribute = attribute;
      }
    });

    if (!this._identifierAttribute) {
      throw new TypeError(
        `"${this.key}" has no identifier attribute set. You must set all your attributes in one time and send an attribute with "isIdentifier=true"`
      );
    }
  }

  setRelationList(relationList) {
    this._relationList = {};

    relationList.forEach((relation) => {
      this._relationList[relation.serializedKey] = relation;
      this._attributeList[relation.serializedKey] = new Attribute(
        relation.serializedKey,
        relation.serializedKey,
        relation.isOneToMany() ? 'array' : 'object'
      );
    });
  }

  getRelation(key) {
    return this._relationList[key];
  }

  getDefaultSerializedModel() {
    const out = {};

    Object.keys(this._attributeList).forEach((serializedKey) => {
      out[serializedKey] = null;
    });

    Object.keys(this._relationList).forEach((serializedKey) => {
      const relation = this._relationList[serializedKey];

      if (relation.isOneToMany()) {
        out[serializedKey] = [];
      }
    });

    return out;
  }
}

export default ClassMetadata;
