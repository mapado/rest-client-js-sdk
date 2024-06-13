export default class Storage {
  constructor() {
    this._map = [];
  }

  getItem(key) {
    return Promise.resolve(this._map && this._map[key]);
  }

  setItem(key, value) {
    // eslint-disable-next-line no-return-assign
    return Promise.resolve((this._map[key] = value));
  }

  removeItem(key) {
    return Promise.resolve(delete this._map[key]);
  }
}
