// memoize promise returning function so that it returns
// the same promise if called again before resolve / reject
export function memoizePromise(callback) {
  const cache = {};
  function memoized(...parameters) {
    const cacheKey = JSON.stringify(parameters);

    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    // Get and add the value to the cache
    const value = callback.apply(this, parameters);
    cache[cacheKey] = value;

    if (!value || !(value instanceof Promise)) {
      throw new Error('Memoization Error, Async function returned non-promise value');
    }

    // Delete the value regardless of whether it resolves or rejects
    return value.then(internalValue => {
      cache[cacheKey] = false;
      return internalValue;
    }, err => {
      cache[cacheKey] = false;
      throw err;
    });
  }

  memoized.cache = cache;
  return memoized;
}
