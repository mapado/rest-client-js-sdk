/* eslint no-unused-vars: 0 */
import { Serializer } from '../src/';

class WeirdSerializer extends Serializer {
  serializeItem(item, type) {
    return this._serializeItem(JSON.parse(item));
  }

  serializeList(list, type) {
    const input = JSON.parse(list);

    return input.map(this._serializeItem);
  }

  deserializeItem(value) {
    return JSON.stringify(value);
  }

  _serializeItem(item) {
    return Object.assign({}, item, { customName: `${item.name}${item.name}` });
  }
}

export default WeirdSerializer;

