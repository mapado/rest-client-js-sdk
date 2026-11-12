// Type-only checks, compiled by `yarn lint:types` (tsconfig.test.json) and never run:
// generators written outside of the SDK must keep compiling with their own config type,
// and a `fetch` key of that config must be a fetch function.
import { AbstractTokenGenerator, Token } from '../../src/index';

const token: Token = { access_token: 'foo', token_type: 'bearer' };

type ConfigWithoutFetch = { path: string; scheme: string };

export class ConfigWithoutFetchGenerator extends AbstractTokenGenerator<
  Token,
  ConfigWithoutFetch
> {
  generateToken(): Promise<Token> {
    return Promise.resolve(token);
  }

  refreshToken(): Promise<Token> {
    return this.generateToken();
  }

  checkTokenGeneratorConfig(): void {
    // no config to check
  }
}

export class NoConfigGenerator extends AbstractTokenGenerator<
  Token,
  undefined
> {
  constructor() {
    super(undefined);
  }

  generateToken(): Promise<Token> {
    return Promise.resolve(token);
  }

  refreshToken(): Promise<Token> {
    return this.generateToken();
  }

  checkTokenGeneratorConfig(): void {
    // no config to check
  }
}

export type OptionalFetchConfig = AbstractTokenGenerator<
  Token,
  { path: string; fetch?: typeof fetch }
>;

type StringFetch = { fetch: string };
type WrongSignatureFetch = { path: string; fetch?: (url: string) => string };
type NumberFetch = { path: string; fetch: number | undefined };

// @ts-expect-error -- `fetch` is not a function
export type StringFetchGenerator = AbstractTokenGenerator<Token, StringFetch>;

// prettier-ignore
// @ts-expect-error -- `fetch` does not have the signature of the global fetch
export type WrongSignatureFetchGenerator = AbstractTokenGenerator<Token, WrongSignatureFetch>;

// @ts-expect-error -- `fetch` is not a function
export type NumberFetchGenerator = AbstractTokenGenerator<Token, NumberFetch>;
