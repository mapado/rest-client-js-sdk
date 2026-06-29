/**
 * Ambient declarations for the few environment-specific globals the SDK touches.
 *
 * The SDK is isomorphic — it runs both in the browser and in Node — so instead of
 * pulling in all of `@types/node` (which would assert a Node environment for the
 * whole library and silently hide any accidental use of Node-only APIs), we declare
 * only what is actually used, and only as optional / guarded values.
 */

interface ErrorConstructor {
  /**
   * V8-only (Node, Chromium). Absent in Firefox/Safari, so it must always be
   * guarded before being called: `if (Error.captureStackTrace) { ... }`.
   */
  captureStackTrace?(
    targetObject: object,
    constructorOpt?: new (...args: never[]) => unknown
  ): void;
}

/**
 * CommonJS loader: available in Node/CJS, absent in ESM/browser. The SDK only uses
 * it as an optional runtime fallback (guarded by `try/catch`) to load `pluralize`.
 */
declare function require(moduleName: string): unknown;
