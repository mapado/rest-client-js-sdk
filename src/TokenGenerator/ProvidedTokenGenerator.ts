/* eslint-disable @typescript-eslint/camelcase */
import TokenGeneratorInterface, { Token } from './TokenGeneratorInterface';

interface ProvidedToken extends Token {
  access_token: string;
  token_type: string;
  refresh_token?: never;
  expires_in?: never;
  scope?: never;
}

type Parameters = {
  grant_type: 'provided';
};

class ProvidedTokenGenerator
  implements TokenGeneratorInterface<ProvidedToken, Parameters> {
  #token: string;

  #refreshTokenFunc: null | Function;

  constructor(token: string, refreshTokenFunc: null | Function = null) {
    this.#token = token;
    this.#refreshTokenFunc = refreshTokenFunc;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateToken(parameters: Parameters): Promise<ProvidedToken> {
    return Promise.resolve({
      access_token: this.#token,
      token_type: 'bearer',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  refreshToken(accessToken: ProvidedToken): Promise<ProvidedToken> {
    if (typeof this.#refreshTokenFunc === 'function') {
      return this.#refreshTokenFunc();
    }

    return this.generateToken({ grant_type: 'provided' });
  }

  autoGenerateToken(): Promise<ProvidedToken> {
    return this.generateToken({ grant_type: 'provided' });
  }
}

export default ProvidedTokenGenerator;
