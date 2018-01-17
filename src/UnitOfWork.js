import diff from 'deep-diff';
import { isImmutable } from './isImmutable';

/**
 * deep comparaison between objects
 */
function objectDiffers(left, right) {
  const result = diff(left, right);

  return result && result.length > 0;
}

/**
 * get the id of an entity or return itself if string
 */
function getEntityId(stringOrEntity, idSerializedKey) {
  if (typeof stringOrEntity !== 'object') {
    return stringOrEntity;
  }
  return stringOrEntity[idSerializedKey];
}

/**
 * find old relation value from the new relation id
 * if not found, returs the default serilazed model
 */
function findOldRelation(newRelationValue, oldRelationValue, classMetadata) {
  const idSerializedKey = classMetadata.getIdentifierAttribute().serializedKey;
  const relationValueId = getEntityId(newRelationValue, idSerializedKey);

  const foundValue =
    oldRelationValue &&
    oldRelationValue.find(innerOldRelationValue => {
      const oldRelationValueId = getEntityId(
        innerOldRelationValue,
        idSerializedKey
      );

      return relationValueId === oldRelationValueId;
    });

  if (foundValue) {
    return foundValue;
  }

  return classMetadata.getDefaultSerializedModel();
}

/**
 * add all identifier from one to many relation list
 */
function getIdentifierForList(newValue, idSerializedKey) {
  return newValue.map(value => {
    if (Object.keys(value).includes(idSerializedKey)) {
      return {
        [idSerializedKey]: value[idSerializedKey],
      };
    } else if (typeof value === 'string') {
      return value;
    }

    throw new TypeError(
      'new value should include a list of string or objects containing the serialized key'
    );
  });
}

class UnitOfWork {
  constructor(mapping) {
    this.mapping = mapping;

    this._storage = {};
  }

  registerClean(id, entity) {
    if (isImmutable(entity)) {
      this._storage[id] = entity;
    } else {
      this._storage[id] = Object.assign({}, entity);
    }
  }

  getDirtyEntity(id) {
    return this._storage[id];
  }

  clear(id) {
    delete this._storage[id];
  }

  getDirtyData(newSerializedModel, oldSerializedModel, classMetadata) {
    return this._getDirtyFields(
      newSerializedModel,
      oldSerializedModel,
      classMetadata
    );
  }

  _getDirtyFieldsForAttribute(
    dirtyFieldsParam,
    key,
    attribute,
    oldValue,
    newValue
  ) {
    const dirtyFields = dirtyFieldsParam;

    if (attribute.type === 'object') {
      if (oldValue === undefined || objectDiffers(oldValue, newValue)) {
        dirtyFields[key] = newValue;
      }
    } else if (oldValue !== newValue) {
      dirtyFields[key] = newValue;
    }

    return dirtyFields;
  }

  _getDirtyFieldsForManyToOne(
    dirtyFieldsParam,
    key,
    oldValue,
    newValue,
    relationMetadata,
    idSerializedKey
  ) {
    const dirtyFields = dirtyFieldsParam;
    if (oldValue !== newValue) {
      if (newValue === null) {
        dirtyFields[key] = null;

        return dirtyFields;
      }

      if (typeof oldValue === 'string' || typeof newValue === 'string') {
        dirtyFields[key] = newValue;
      }

      const recursiveDiff = this._getDirtyFields(
        newValue,
        oldValue,
        relationMetadata
      );

      if (Object.keys(recursiveDiff).length > 0) {
        recursiveDiff[idSerializedKey] = getEntityId(newValue, idSerializedKey);
        dirtyFields[key] = recursiveDiff;
      }
    }

    return dirtyFields;
  }

  _getDirtyFieldsForOneToMany(
    dirtyFieldsParam,
    key,
    idSerializedKey,
    relationMetadata,
    oldValue,
    newValue
  ) {
    const dirtyFields = dirtyFieldsParam;
    const newValueLength = newValue ? newValue.length : 0;
    const oldValueLength = oldValue ? oldValue.length : 0;

    // number of items changed
    if (newValueLength !== oldValueLength) {
      dirtyFields[key] = getIdentifierForList(newValue, idSerializedKey);
    }

    if (newValue && newValue.length > 0) {
      if (dirtyFields[key] === undefined) {
        dirtyFields[key] = [];
      }

      const relationList = newValue;

      relationList.forEach((newRelationValue, relationAttributeName) => {
        const oldRelationValue = findOldRelation(
          newRelationValue,
          oldValue,
          relationMetadata
        );

        if (newRelationValue !== oldRelationValue) {
          if (
            typeof newRelationValue === 'string' ||
            typeof oldRelationValue === 'string'
          ) {
            dirtyFields[key][relationAttributeName] = newRelationValue;

            return;
          }

          const recursiveDiff = this._getDirtyFields(
            newRelationValue,
            oldRelationValue,
            relationMetadata
          );

          if (Object.keys(recursiveDiff).length > 0) {
            const entityId = getEntityId(newRelationValue, idSerializedKey);

            if (entityId !== null) {
              recursiveDiff[idSerializedKey] = entityId;
            }

            if (dirtyFields[key][relationAttributeName]) {
              Object.assign(
                dirtyFields[key][relationAttributeName],
                recursiveDiff
              );
            } else {
              dirtyFields[key][relationAttributeName] = recursiveDiff;
            }
          }
        }
      });

      if (dirtyFields[key].length > 0) {
        // add identifier because one or more object linked has been updated
        // see test: 'get dirty data many to one update item'
        dirtyFields[key] = Object.assign(
          getIdentifierForList(newValue, idSerializedKey),
          dirtyFields[key]
        );
      } else {
        // no changes, no need to send the key with an empty array as value
        delete dirtyFields[key];
      }
    }

    return dirtyFields;
  }

  _getDirtyFields(newSerializedModel, oldSerializedModel, classMetadata) {
    let dirtyFields = {};

    Object.values(classMetadata.getAttributeList()).forEach(attribute => {
      const key = attribute.attributeName;
      const newValue = newSerializedModel[key];
      const oldValue = oldSerializedModel ? oldSerializedModel[key] : null;

      const currentRelation = classMetadata.getRelation(
        attribute.serializedKey
      );

      if (newValue === undefined) {
        return;
      }

      // not a relation
      if (!currentRelation) {
        dirtyFields = this._getDirtyFieldsForAttribute(
          dirtyFields,
          key,
          attribute,
          oldValue,
          newValue
        );

        return;
      }

      const relationMetadata = this.mapping.getClassMetadataByKey(
        currentRelation.targetMetadataKey
      );

      if (!relationMetadata) {
        throw new TypeError(
          `relation metadata is not set for relation ${classMetadata.key}.${
            currentRelation.targetMetadataKey
          }`
        );
      }

      const idSerializedKey = relationMetadata
        ? relationMetadata.getIdentifierAttribute().serializedKey
        : null;

      // MANY_TO_ONE relation
      if (currentRelation.isManyToOne()) {
        dirtyFields = this._getDirtyFieldsForManyToOne(
          dirtyFields,
          key,
          oldValue,
          newValue,
          relationMetadata,
          idSerializedKey
        );

        return;
      }

      // ONE_TO_MANY relation
      dirtyFields = this._getDirtyFieldsForOneToMany(
        dirtyFields,
        key,
        idSerializedKey,
        relationMetadata,
        oldValue,
        newValue
      );
    });

    return dirtyFields;
  }
}

export default UnitOfWork;
