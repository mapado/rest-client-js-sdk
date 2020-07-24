/* eslint-disable import/prefer-default-export */

// memoize promise returning function so that it returns
// the same promise if called again before resolve / reject

interface MemoizableFunction<P, R> {
  (...params: P[]): Promise<R> | false;
}

type FalsableCallbackReturn<R> = false | Promise<R>;

export function memoizePromise<P, R>(
  callback: MemoizableFunction<P, R>
): () => Promise<R> {
  const cache: { [key: string]: FalsableCallbackReturn<R> } = {};

  function memoized(this: unknown, ...parameters: P[]): Promise<R> {
    const cacheKey = JSON.stringify(parameters);
    const cacheValue = cache[cacheKey];

    if (cacheValue) {
      return cacheValue;
    }

    // Get and add the value to the cache
    const value = callback.apply(this, parameters);
    cache[cacheKey] = value;

    if (!value || typeof value.then !== 'function') {
      throw new Error(
        'Memoization Error, Async function returned non-promise value'
      );
    }

    // Delete the value regardless of whether it resolves or rejects
    return value.then(
      (internalValue: R) => {
        cache[cacheKey] = false;

        return internalValue;
      },
      (err: Error) => {
        cache[cacheKey] = false;

        throw err;
      }
    );
  }

  memoized.cache = cache;

  return memoized;
}
