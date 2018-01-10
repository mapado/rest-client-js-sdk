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
   * convert a plain javascript object string that will be sent as the request content
   * @param {object} object - The object to convert to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {string} the content of the request
   */
  serializeItem(object, classMetadata) {
    throw new TypeError('`serializeItem` method must be implemented');
  }

  /**
   * convert a string containing an object to a plain javascript object
   * @param {string} rawData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object} the normalized object
   */
  deserializeItem(rawData, classMetadata, response) {
    throw new TypeError('`deserializeItem` method must be implemented');
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
   * convert a string containing a list of objects to a list of plain javascript objects
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {any} a list of normalized objects
   */
  deserializeList(rawListData, type, response) {
    throw new TypeError('`deserializeList` method must be implemented');
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
}

export default Serializer;
