export interface Token {
  access_token: string;
  expires_in?: null | number;
}

export default interface TokenGeneratorInterface<T extends Token, P> {
  generateToken(parameters: P): Promise<T>;

  refreshToken(accessToken: T, parameters: P): Promise<T>;

  autoGenerateToken?(): Promise<T>;
}
