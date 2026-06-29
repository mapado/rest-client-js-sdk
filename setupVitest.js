import { blockAllCalls, resetMocks } from 'metch-fock';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

export const NOW_TIMESTAMP_MOCK = 1487076708000;

beforeAll(() => {
  // Lock Time
  vi.spyOn(Date, 'now').mockImplementation(() => NOW_TIMESTAMP_MOCK);
});

afterAll(() => {
  // Unlock Time
  vi.restoreAllMocks();
});

beforeEach(() => {
  // block all network calls
  blockAllCalls();
});

afterEach(() => {
  // empty the mock call stack
  resetMocks();
});
