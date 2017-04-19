/* eslint no-unused-vars: 0 */
import { fromJS, List } from 'immutable';
import { Serializer } from '../src/';

class ImmutableSerializer extends Serializer {
  serializeItem(item, type) {
    const input = JSON.parse(item);

    const out = fromJS(input);
    return out.set('customName', input.name);
  }

  serializeList(list, type) {
    const input = JSON.parse(list);

    return List(input.map(item => fromJS(item).set('customName', item.name)));
  }

  deserializeItem(value) {
    return value.toJSON();
  }
}

export default ImmutableSerializer;
