import { Serializer } from '../src';

class Collection {
  constructor(data) {
    this.data = data;
    this.members = data.members;
    this.index = 0;
  }

  [Symbol.iterator]() {
    return {
      next: () => {
        if (this.index < this.members.length) {
          return { value: this.members[this.index++], done: false };
        } else {
          this.index = 0; //If we would like to iterate over this again without forcing manual update of the index
          return { done: true };
        }
      },
    };
  }
}

class CollectionSerializer extends Serializer {
  encodeItem(object, classMetadata) {
    return JSON.stringify(object);
  }

  decodeItem(rawData, classMetadata, response) {
    return JSON.parse(rawData);
  }

  decodeList(rawListData, classMetadata, response) {
    return JSON.parse(rawListData);
  }

  denormalizeList(objectList, classMetadata, response) {
    return new Collection(objectList);
  }
}

export default CollectionSerializer;
