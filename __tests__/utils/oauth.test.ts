import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  generateCodeChallenge,
  generateOAuthState,
  generatePkceCodes,
} from '../../src/index';

describe('generateCodeChallenge', () => {
  test('returns the S256 challenge of a known verifier (RFC 7636 appendix B)', async () => {
    await expect(
      generateCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')
    ).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('generateOAuthState', () => {
  test('generates a different 32-character hexadecimal state on each call', () => {
    const state = generateOAuthState();

    expect(state).toMatch(/^[0-9a-f]{32}$/);
    expect(generateOAuthState()).not.toBe(state);
  });
});

describe('generatePkceCodes', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('generates a URL-safe code verifier and the challenge that matches it', async () => {
    const pkce = await generatePkceCodes();

    expect(pkce).not.toBeNull();
    expect(pkce?.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await expect(generateCodeChallenge(pkce?.codeVerifier ?? '')).resolves.toBe(
      pkce?.codeChallenge
    );
  });

  test('returns null when crypto.subtle is unavailable (insecure context)', async () => {
    vi.stubGlobal('crypto', {
      getRandomValues: crypto.getRandomValues.bind(crypto),
    });

    await expect(generatePkceCodes()).resolves.toBeNull();
  });
});
