/* eslint-disable camelcase */

/**
 * See {@link https://tools.ietf.org/html/rfc6749#section-5.1 Successful Response}
 */
export type Token = {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
};

/**
 * see {@link https://tools.ietf.org/html/rfc6749#section-5.2 Error Response}
 */
export type ErrorBody = {
  error:
    | 'invalid_request'
    | 'invalid_client'
    | 'invalid_grant'
    | 'unauthorized_client'
    | 'unsupported_grant_type'
    | 'invalid_scope';
  error_description?: string;
  error_uri?: string;
};

export type TokenBody<T> = T | ErrorBody;

export interface TokenResponse<T extends Token> extends Response {
  json(): Promise<TokenBody<T>>;
}
