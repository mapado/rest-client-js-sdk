interface HasExpiresAt {
  // eslint-disable-next-line camelcase
  expires_at: null | number;
}

export default interface TokenStorageInterface<T> {
  hasAccessToken(): Promise<boolean>;
  getAccessToken(): Promise<null | string>;
  getAccessTokenObject(): Promise<null | (T & HasExpiresAt)>;
  logout(): Promise<void>;
  generateToken(parameters: unknown): Promise<T & HasExpiresAt>;
  refreshToken(): Promise<T & HasExpiresAt>;
  getCurrentTokenExpiresIn(): Promise<number | null>;
}
