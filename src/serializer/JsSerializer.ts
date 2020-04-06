/* eslint-disable @typescript-eslint/no-unused-vars */
import Serializer from './Serializer';
import ClassMetadata from '../Mapping/ClassMetadata';

class JsSerializer extends Serializer<object, object[]> {
  encodeItem(object: object, classMetadata: ClassMetadata): string {
    return JSON.stringify(object);
  }

  decodeItem(
    rawData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object {
    return JSON.parse(rawData);
  }

  decodeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object | object[] {
    return JSON.parse(rawListData);
  }
}

export default JsSerializer;
