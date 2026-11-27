const CODE_VERIFIER_BYTE_COUNT = 32;
const STATE_BYTE_COUNT = 16;

/**
 * Random `state` of an authorization request: the callback must only accept
 * the code when it comes back with the state stored before the redirect.
 */
export function generateOAuthState(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(STATE_BYTE_COUNT));

  return Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

/**
 * SHA-256 hash of the verifier, base64url-encoded (RFC 7636 §4.2).
 */
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const bytes = new TextEncoder().encode(codeVerifier);
  const hash = await crypto.subtle.digest('SHA-256', bytes);

  return base64UrlEncode(new Uint8Array(hash));
}

/**
 * PKCE codes (verifier and its S256 challenge) for a single authorization
 * request (RFC 7636, S256 only). Returns null when `crypto.subtle` is
 * unavailable (insecure context, e.g. a page served over http): the caller
 * decides whether to go on without PKCE.
 */
export async function generatePkceCodes(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
} | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return null;
  }

  const randomBytes = crypto.getRandomValues(
    new Uint8Array(CODE_VERIFIER_BYTE_COUNT)
  );
  const codeVerifier = base64UrlEncode(randomBytes);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  return { codeVerifier, codeChallenge };
}

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
