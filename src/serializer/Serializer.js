/* eslint no-unused-vars: 0 */

class Serializer {
  /**
   * convert an entity to a plain javascript object
   * @param {any} entity - The entity to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {object} the object to serialize
   */
  normalizeItem(entity, classMetadata) {
    return entity;
  }

  /**
   * convert a plain javascript object to string
   * @param {object} object - The object to convert to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {string} the content of the request
   */
  encodeItem(object, classMetadata) {
    throw new TypeError('`encodeItem` method must be implemented');
  }

  /**
   * convert an entity to string that will be sent as the request content
   * @param {any} entity - The entity to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {string} the content of the request
   */
  serializeItem(object, classMetadata) {
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
  denormalizeItem(object, classMetadata, response) {
    return object;
  }

  /**
   * convert a string containing an object to a plain javascript object
   * @param {string} rawData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object} the normalized object
   */
  decodeItem(rawData, classMetadata, response) {
    throw new TypeError('`decodeItem` method must be implemented');
  }

  /**
   * convert a string containing an object to an entity
   * @param {string} rawData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object} the entity
   */
  deserializeItem(rawData, classMetadata, response) {
    const object = this.decodeItem(rawData, classMetadata, response);
    return this.denormalizeItem(object, classMetadata, response);
  }

  /**
   * convert a plain object list to an entity list
   * @param {array} objectList - The plain javascript object list
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {any} a list of entities
   */
  denormalizeList(objectList, classMetadata, response) {
    return objectList;
  }

  /**
   * convert a string containing a list of objects to a list of plain javascript objects
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {any} a list of normalized objects
   */
  decodeList(rawListData, classMetadata, response) {
    throw new TypeError('`deserializeList` method must be implemented');
  }

  /**
   * convert a string containing a list of objects to a list of entities
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {any} a list of entities
   */
  deserializeList(rawListData, classMetadata, response) {
    const objectList = this.decodeList(rawListData, classMetadata, response);
    return this.denormalizeList(objectList, classMetadata, response);
  }
}

export default Serializer;
