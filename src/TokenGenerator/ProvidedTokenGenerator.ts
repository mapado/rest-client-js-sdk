/* eslint-disable camelcase */
import TokenGeneratorInterface from './TokenGeneratorInterface';
import { Token } from './types';

type RefreshTokenFunc = (oldAccessToken: null | Token) => Promise<Token>;

/**
 * @deprecated ProvidedTokenGenerator is not an Oauth valid generator.
 * You should use one of the official generator or implement your own custom generator.
 */
class ProvidedTokenGenerator implements TokenGeneratorInterface<Token> {
  #token: Token;

  #refreshTokenFunc: null | RefreshTokenFunc;

  constructor(token: Token, refreshTokenFunc: null | RefreshTokenFunc = null) {
    this.#token = token;
    this.#refreshTokenFunc = refreshTokenFunc;
  }

  set token(token: Token) {
    this.#token = token;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateToken(): Promise<Token> {
    return Promise.resolve(this.#token);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refreshToken(accessToken: null | Token): Promise<Token> {
    if (typeof this.#refreshTokenFunc === 'function') {
      return this.#refreshTokenFunc(accessToken);
    }

    return this.generateToken();
  }

  autoGenerateToken(): Promise<Token> {
    return this.generateToken();
  }
}

export default ProvidedTokenGenerator;
