/* eslint-disable @typescript-eslint/no-unused-vars */
import ClassMetadata from '../Mapping/ClassMetadata';
import Serializer from './Serializer';

class JsSerializer extends Serializer {
  encodeItem(
    object: Record<string, unknown>,
    classMetadata: ClassMetadata
  ): string {
    return JSON.stringify(object);
  }

  decodeItem(
    rawData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): Record<string, unknown> {
    return JSON.parse(rawData);
  }

  decodeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): Iterable<Record<string, unknown>> {
    return JSON.parse(rawListData);
  }
}

export default JsSerializer;
