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
