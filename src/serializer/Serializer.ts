/* eslint-disable @typescript-eslint/no-unused-vars */
import SerializerInterface from './SerializerInterface';
import ClassMetadata from '../Mapping/ClassMetadata';

class Serializer implements SerializerInterface {
  /**
   * convert an entity to a plain javascript object
   * @param {any} entity - The entity to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {object} the object to serialize
   */
  normalizeItem(entity: object, classMetadata: ClassMetadata): object {
    return entity;
  }

  /**
   * convert a plain javascript object to string
   * @param {object} object - The object to convert to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {string} the content of the request
   */
  encodeItem(object: object, classMetadata: ClassMetadata): string {
    throw new TypeError('`encodeItem` method must be implemented');
  }

  /**
   * convert an entity to string that will be sent as the request content
   * @param {any} entity - The entity to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {string} the content of the request
   */
  serializeItem<E extends object>(
    object: E,
    classMetadata: ClassMetadata
  ): string {
    const noralizedData = this.normalizeItem(object, classMetadata);
    return this.encodeItem(noralizedData, classMetadata);
  }

  /**
   * convert a plain object to an entity
   * @param {string} object - The plain javascript object
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {any} an entity
   */
  denormalizeItem<E>(
    object: object,
    classMetadata: ClassMetadata,
    response: Response
  ): E {
    return (object as unknown) as E;
  }

  /**
   * convert a string containing an object to a plain javascript object
   * @param {string} rawData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object} the normalized object
   */
  decodeItem(
    rawData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object {
    throw new TypeError('`decodeItem` method must be implemented');
  }

  /**
   * convert a string containing an object to an entity
   * @param {string} rawData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {E} the entity
   */
  deserializeItem<E>(
    rawData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): E {
    const object = this.decodeItem(rawData, classMetadata, response);
    return this.denormalizeItem(object, classMetadata, response);
  }

  /**
   * convert a plain object list to an entity list
   * @param {object|object[]} objectList - The plain javascript object list (or an iterable object)
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {L} a list of entities
   */
  denormalizeList<L>(
    objectList: object | object[],
    classMetadata: ClassMetadata,
    response: Response
  ): L {
    return (objectList as unknown) as L; // weird conversion as the declaration of list type is fuzzy
  }

  /**
   * convert a string containing a list of objects to a list of plain javascript objects
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {any} a list of normalized objects
   */
  decodeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object | object[] {
    throw new TypeError('`deserializeList` method must be implemented');
  }

  /**
   * convert a string containing a list of objects to a list of entities
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {any} a list of entities
   */
  deserializeList<L>(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): L {
    const objectList = this.decodeList(rawListData, classMetadata, response);
    return this.denormalizeList(objectList, classMetadata, response);
  }
}

export default Serializer;
