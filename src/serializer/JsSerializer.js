/* eslint no-unused-vars: 0 */
import Serializer from './Serializer';

class JsSerializer extends Serializer {
  serializeItem(object, classMetadata) {
    return JSON.stringify(object);
  }

  deserializeItem(rawData, classMetadata, response) {
    return JSON.parse(rawData);
  }

  deserializeList(rawListData, classMetadata, response) {
    return JSON.parse(rawListData);
  }
}

export default JsSerializer;
