export interface Token {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export interface TokenGeneratorParameters {
  grant_type: string;
}

export default interface TokenGeneratorInterface<
  T extends Token,
  P extends TokenGeneratorParameters
> {
  generateToken(parameters: P): Promise<T>;

  refreshToken(accessToken: T): Promise<T>;

  autoGenerateToken?(): Promise<T>;
}
