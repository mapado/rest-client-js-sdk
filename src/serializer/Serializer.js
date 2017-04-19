/* eslint no-unused-vars: 0 */

class Serializer {
  /**
   * convert an entity to a string that will be sent as the request content
   * @param {any} entity - The entity to convert
   * @param {string} type - The result of the `getName` method of the Repository
   * @return {string} the content of the request
   */
  serializeItem(entity, type) {
    throw new TypeError('`serializeItem` method must be implemented');
  }

  /**
   * convert a string containing a `type` objects to an entity
   * @param {string} rawData - The string fetched from the response
   * @param {string} type - The result of the `getName` method of the Repository
   * @return {any} an entity
   */
  deserializeItem(rawData, type) {
    throw new TypeError('`deserializeItem` method must be implemented');
  }

  /**
   * convert a string containing a list of `type` objects to a list of entities
   * @param {string} rawListData - The string fetched from the response
   * @param {string} type - The result of the `getName` method of the Repository
   * @return {any} a list of entities
   */
  deserializeList(rawListData, type) {
    throw new TypeError('`deserializeList` method must be implemented');
  }
}

export default Serializer;
