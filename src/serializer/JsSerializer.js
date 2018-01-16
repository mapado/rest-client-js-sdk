/* eslint no-unused-vars: 0 */
import Serializer from './Serializer';

class JsSerializer extends Serializer {
  encodeItem(object, classMetadata) {
    return JSON.stringify(object);
  }

  decodeItem(rawData, classMetadata, response) {
    return JSON.parse(rawData);
  }

  decodeList(rawListData, classMetadata, response) {
    return JSON.parse(rawListData);
  }
}

export default JsSerializer;
