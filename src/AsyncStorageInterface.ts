export default interface AsyncStorageInterface {
  setItem(key: string, value: string): Promise<unknown>;

  getItem(key: string): Promise<string>;

  removeItem(key: string): Promise<void>;
}
