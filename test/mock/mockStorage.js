export default class Storage {
  constructor() {
    this._map = [];
  }

  getItem(key) {
    return Promise.resolve(this._map && this._map[key]);
  }

  setItem(key, value) {
    return Promise.resolve(this._map[key] = value);
  }
}
