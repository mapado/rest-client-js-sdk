import { ErrorBody, Token, TokenBody, TokenResponse } from './types';

/** @deprecated */
export type TokenBodyReturn<T> = TokenBody<T>;

export default interface TokenGeneratorInterface<T extends Token> {
  /**
   * This function needs no generate an access token
   */
  generateToken(
    parameters: unknown
  ): Promise<TokenBodyReturn<T> | TokenResponse<T>>;

  /**
   * This function needs to refresh the current possibly expired access token
   * and return a Promise that will be resolved with a fresh access token
   */
  refreshToken(
    accessToken: null | T
  ): Promise<TokenBodyReturn<T> | TokenResponse<T>>;

  /**
   * If defined, this function will be called automatically if we try to get an access token object
   * even if we did not call `generateToken` before
   */
  autoGenerateToken?(): Promise<T>;
}
