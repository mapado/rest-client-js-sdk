import ClassMetadata from '../Mapping/ClassMetadata';

export default interface SerializerInterface {
  /**
   * convert an entity to a plain javascript object
   * @param {object} entity - The entity to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {object} the object to serialize
   */
  normalizeItem(entity: object, classMetadata: ClassMetadata): object;

  /**
   * convert a plain javascript object to string
   * @param {object} object - The object to convert to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {string} the content of the request
   */
  encodeItem(object: object, classMetadata: ClassMetadata): string;

  /**
   * convert a plain object to an entity
   * @param {string} object - The plain javascript object
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object} an entity
   */
  denormalizeItem(
    object: object,
    classMetadata: ClassMetadata,
    response: Response
  ): object;

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
  ): object;

  /**
   * convert a plain object list to an entity list
   * @param {object|object[]} objectList - The plain javascript object list (or an iterable object)
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object | object[]} a list of entities
   */
  denormalizeList(
    objectList: object | object[],
    classMetadata: ClassMetadata,
    response: Response
  ): object | object[];

  /**
   * convert a string containing a list of objects to a list of plain javascript objects
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object|object[]} a list of normalized objects or an iterable object containint the list
   */
  decodeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object | object[];

  /**
   * convert a string containing a list of objects to a list of entities
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {L} a list of entities
   */
  deserializeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object | object[];
}
