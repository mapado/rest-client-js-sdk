import { Token } from './types';

export default interface TokenGeneratorInterface<T extends Token> {
  generateToken(parameters: unknown): Promise<T>;

  refreshToken(accessToken: null | T): Promise<T>;

  autoGenerateToken?(): Promise<T>;
}
