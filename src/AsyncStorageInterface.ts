export default interface AsyncStorageInterface {
  setItem(key: string, value: string): Promise<unknown>;

  getItem(key: string): Promise<string | null>;

  removeItem(key: string): Promise<void>;
}
