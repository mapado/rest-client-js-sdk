/* eslint no-unused-vars: 0 */
import Serializer from './Serializer';

class JsSerializer extends Serializer {
  serializeItem(entity, type) {
    return JSON.stringify(entity);
  }

  deserializeItem(rawData, type, response) {
    return JSON.parse(rawData);
  }

  deserializeList(rawListData, type, response) {
    return JSON.parse(rawListData);
  }
}

export default JsSerializer;
