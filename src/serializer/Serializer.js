/* eslint no-unused-vars: 0 */

class Serializer {
  serializeItem(item, type) {
    throw new TypeError('`serializeItem` method must be implemented');
  }

  serializeList(list, type) {
    throw new TypeError('`serializeList` method must be implemented');
  }


  deserializeItem(value) {
    throw new TypeError('`deserializeItem` method must be implemented');
  }
}

export default Serializer;
