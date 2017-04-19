/* eslint no-unused-vars: 0 */
import { Serializer } from '../src/';

class WeirdSerializer extends Serializer {
  deserializeItem(rawData, type) {
    return this._serializeItem(JSON.parse(rawData));
  }

  deserializeList(rawListData, type) {
    const input = JSON.parse(rawListData);

    return input.map(this._serializeItem);
  }

  serializeItem(entity, type) {
    return JSON.stringify(entity);
  }

  _serializeItem(item) {
    return Object.assign({}, item, { customName: `${item.name}${item.name}` });
  }
}

export default WeirdSerializer;

