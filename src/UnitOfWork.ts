/* eslint-disable @typescript-eslint/no-explicit-any */
import { diff } from 'deep-diff';
import { isImmutable } from './isImmutable';
import Mapping from './Mapping';
import ClassMetadata, {
  DefaultSerializedModelType,
} from './Mapping/ClassMetadata';
import Attribute from './Mapping/Attribute';

type Id = string | number;
type StringKeyObject = Record<string, any>;

/**
 * deep comparaison between objects
 */
function objectDiffers(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean {
  const result = diff(left, right);

  return result ? result.length > 0 : false;
}

/**
 * get the id of an entity or return itself if string
 */
function getEntityId(
  stringOrEntity: string | Record<string, unknown>,
  idSerializedKey: string
): Id {
  if (typeof stringOrEntity !== 'object') {
    return stringOrEntity;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return stringOrEntity[idSerializedKey] as Id;
}

/**
 * find old relation value from the new relation id
 * if not found, returs the default serilazed model
 */
function findOldRelation(
  newRelationValue: any[],
  oldRelationValue: any[],
  classMetadata: ClassMetadata
): DefaultSerializedModelType {
  const idSerializedKey = classMetadata.getIdentifierAttribute().serializedKey;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const relationValueId = getEntityId(newRelationValue, idSerializedKey);

  const foundValue =
    oldRelationValue &&
    oldRelationValue.find((innerOldRelationValue) => {
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
function getIdentifierForList(
  newValue: any[],
  idSerializedKey: string
): StringKeyObject | string {
  return newValue.map((value) => {
    if (Object.keys(value).includes(idSerializedKey)) {
      return {
        [idSerializedKey]: value[idSerializedKey],
      };
    }

    if (typeof value === 'string') {
      return value;
    }

    throw new TypeError(
      'new value should include a list of string or objects containing the serialized key'
    );
  });
}

class UnitOfWork {
  mapping: Mapping;

  #storage: { [key in Id]: Record<string, unknown> };

  #enabled: boolean;

  constructor(mapping: Mapping, enabled = false) {
    this.mapping = mapping;

    this.#enabled = enabled;
    this.#storage = {};
  }

  registerClean(id: Id, entity: Record<string, unknown>): void {
    if (!this.#enabled) {
      return;
    }
    if (isImmutable(entity)) {
      this.#storage[id] = entity;
    } else {
      this.#storage[id] = { ...entity };
    }
  }

  getDirtyEntity(id: Id): Record<string, unknown> {
    return this.#storage[id];
  }

  clear(id: Id): void {
    delete this.#storage[id];
  }

  getDirtyData(
    newSerializedModel: Record<string, unknown>,
    oldSerializedModel: Record<string, unknown>,
    classMetadata: ClassMetadata
  ): StringKeyObject {
    return this._getDirtyFields(
      newSerializedModel,
      oldSerializedModel,
      classMetadata
    );
  }

  private _getDirtyFieldsForAttribute(
    dirtyFieldsParam: StringKeyObject,
    key: string,
    attribute: Attribute,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>
  ): StringKeyObject {
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

  private _getDirtyFieldsForManyToOne(
    dirtyFieldsParam: StringKeyObject,
    key: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
    relationMetadata: ClassMetadata,
    idSerializedKey: string
  ): StringKeyObject {
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

  private _getDirtyFieldsForOneToMany(
    dirtyFieldsParam: StringKeyObject,
    key: string,
    idSerializedKey: string,
    relationMetadata: ClassMetadata,
    oldValue: any[],
    newValue: any[]
  ): StringKeyObject {
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

  private _getDirtyFields(
    newSerializedModel: StringKeyObject,
    oldSerializedModel: StringKeyObject,
    classMetadata: ClassMetadata
  ): StringKeyObject {
    let dirtyFields = {};

    Object.values(classMetadata.getAttributeList()).forEach((attribute) => {
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
          `relation metadata is not set for relation ${classMetadata.key}.${currentRelation.targetMetadataKey}`
        );
      }

      const idSerializedKey = relationMetadata.getIdentifierAttribute()
        .serializedKey;

      // MANY_TO_ONE relation
      if (currentRelation.isRelationToOne()) {
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

      // *_TO_MANY relation
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
