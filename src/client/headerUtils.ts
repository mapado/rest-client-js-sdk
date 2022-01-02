/* eslint-disable consistent-return */
export function removeAuthorization(
  headers: undefined | HeadersInit
): undefined | HeadersInit {
  if (!headers) {
    return;
  }

  if (headers instanceof Headers) {
    headers.delete('Authorization');
    return headers;
  }

  const filterAuthorization = (entries: string[][]): string[][] =>
    entries.filter((header) => header[0] !== 'Authorization');

  if (Array.isArray(headers)) {
    return filterAuthorization(headers);
  }

  return Object.fromEntries(filterAuthorization(Object.entries(headers)));
}

/**
 * remove undefined key, usefull to remove Content-Type for example.
 * Does not apply on "Headers" instance as values are string in there.
 */
export function removeUndefinedHeaders(headers: HeadersInit): HeadersInit {
  if (headers instanceof Headers) {
    return headers;
  }

  const filterEntries = (entries: string[][]): string[][] =>
    entries.filter((header) => header[1] !== undefined);

  if (Array.isArray(headers)) {
    return filterEntries(headers);
  }

  return Object.fromEntries(filterEntries(Object.entries(headers)));
}

export function convertToRecord(headers: HeadersInit): Record<string, string> {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}
