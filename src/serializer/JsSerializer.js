/* eslint no-unused-vars: 0 */
import Serializer from './Serializer';

class JsSerializer extends Serializer {
  serializeItem(item, type) {
    return JSON.parse(item);
  }

  serializeList(list, type) {
    return JSON.parse(list);
  }


  deserializeItem(value) {
    return JSON.stringify(value);
  }
}

export default JsSerializer;
