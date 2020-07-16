import ClassMetadata from '../Mapping/ClassMetadata';

export type Entity = Record<string, unknown>;
export type NormalizedObject = Record<string, unknown>;
export type NormalizedList = Iterable<Record<string, unknown>>;
export type EntityList = Iterable<Entity>;

export default interface SerializerInterface {
  /**
   * convert an entity to a plain javascript object
   * @param {object} entity - The entity to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {object} the object to serialize
   */
  normalizeItem(entity: Entity, classMetadata: ClassMetadata): NormalizedObject;

  /**
   * convert a plain javascript object to string
   * @param {object} object - The object to convert to convert
   * @param {ClassMetadata} classMetadata - the class metadata
   * @return {string} the content of the request
   */
  encodeItem(object: NormalizedObject, classMetadata: ClassMetadata): string;

  /**
   * convert a plain object to an entity
   * @param {object} object - The plain javascript object
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {object} an entity
   */
  denormalizeItem(
    object: NormalizedObject,
    classMetadata: ClassMetadata,
    response: Response
  ): Entity;

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
  ): NormalizedObject;

  /**
   * convert a plain object list to an entity list
   * @param {Iterable<object>} objectList - The plain javascript object list (or an iterable object)
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {Iterable<object>} a list of entities
   */
  denormalizeList(
    objectList: NormalizedList,
    classMetadata: ClassMetadata,
    response: Response
  ): EntityList;

  /**
   * convert a string containing a list of objects to a list of plain javascript objects
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {Iterable<object>} a list of normalized objects or an iterable object containint the list
   */
  decodeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): NormalizedList;

  /**
   * convert a string containing a list of objects to a list of entities
   * @param {string} rawListData - The string fetched from the response
   * @param {ClassMetadata} classMetadata - the class metadata
   * @param {object} response - the HTTP response
   * @return {Iterable<object>} a list of entities
   */
  deserializeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): EntityList;
}
