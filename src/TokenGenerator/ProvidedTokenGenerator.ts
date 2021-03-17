/* eslint-disable camelcase */
import TokenGeneratorInterface from './TokenGeneratorInterface';
import { Token } from './types';

type RefreshTokenFunc = () => Promise<Token>;

class ProvidedTokenGenerator implements TokenGeneratorInterface<Token> {
  #token: Token;

  #refreshTokenFunc: null | RefreshTokenFunc;

  constructor(token: Token, refreshTokenFunc: null | RefreshTokenFunc = null) {
    this.#token = token;
    this.#refreshTokenFunc = refreshTokenFunc;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateToken(): Promise<Token> {
    return Promise.resolve(this.#token);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refreshToken(accessToken: null | Token): Promise<Token> {
    if (typeof this.#refreshTokenFunc === 'function') {
      return this.#refreshTokenFunc();
    }

    return this.generateToken();
  }

  autoGenerateToken(): Promise<Token> {
    return this.generateToken();
  }
}

export default ProvidedTokenGenerator;
