# Changelog

## Unreleased
### Changed

## [1.2.0] - 2017-11-10
### Changed
  * fix response passed as error message in Errors
  * throw AccessDeniedError on any Error in PasswordGenerator refreshToken
  * allow to pass scope param in tokenGeneratorConfig

## [1.1.1] - 2017-10-08
### Changed
  * upgrade rollup to 0.50.0

## [1.1.0] - 2017-08-30
### Changed
  * Pass on response to serializer
  * Upgrade dependencies (rollup 0.49, eslint 4, etc.)
  * Add prettier to project

## [1.0.5] - 2017-08-30
### Changed
  * Fix token loop when token is not valid anymore

## [1.0.4] - 2017-07-28
### Changed
  * Remove undefined headers

## [1.0.3] - 2017-07-27
### Changed
  * Allow overriding base headers [#24](https://github.com/mapado/rest-client-js-sdk/pull/24)

## [1.0.2] - 2017-07-04

This release is the same as 0.15.0 and though fully compatible

### Changed
  * Rolled back to urijs because domurl use the default node implementation which is not compatible with the stack we use.
  The real future solution will be to use Javascript `URL` object but too early and unstable for now


## [1.0.1] - 2017-07-03 - [YANKED]
### Changed
  * Make urijs implementation work again but might be breaking
  * Url constructor passed with `noTransform = true` for better perf and avoid potential bugs

## [1.0.0] - 2017-07-03 - [YANKED]
### Changed
  * Replace [urijs](https://medialize.github.io/URI.js/) dependency by smaller [domurl](https://github.com/Mikhus/domurl)

## [0.15.0] - 2017-06-27
### Added
  * Added the current URI as referer for http calls

## [0.14.x]
### breaking changes
Error responses in PasswordGenerator and ClientCredentialsGenerator now throw proper js errors instead of returning the response in the promise rejection

## [0.13.x]
### breaking changes

The library does not depends on `immutablejs` anymore, so we needed to make a few breaking changes:

  * Do not depend on `@id` anymore: The `AbstractClient` need to implements a `getEntityURI(entity)` and return an query string from it. This is not a great pattern, but it will do for now. (https://github.com/mapado/rest-client-js-sdk/pull/19)
  * The `entityFactory` does not exists anymore. It has been replaced by a `Serializer`: (https://github.com/mapado/rest-client-js-sdk/pull/21)
    * If you used the default entityFactory, you will now receive plain Javascript objects instead of immutable's Map or List
    * If you previously overrided the `entityFactory`, you will need to switch to the new `Serializer` object: It is much more extensible but is a bit more complex to extend. See README to know how to do it.
    * the `createEntityFromJsonResponse` method has been renamed to `deserializeResponse`
  * The library moved from ES5 to bundling with rollupjs, that should not break anything and should improve size of bundle but I am not so sure of this, so patch may follow (https://github.com/mapado/rest-client-js-sdk/pull/20)


## [0.12.x]
### breaking changes

- a `delete` does not call `createEntityFromJsonResponse` anymore as it should return a "204 No Content" or a "404 Not Found"


## [0.11.x]
### breaking changes

- `ProviderTokenGenerator` does not accept a param object anymore on its second argument.

### new features

- `ProviderTokenGenerator` now accept a function on its second argument which will be called on `refreshToken`, so you can fully customize the behavior. The function must return a Promise.

## [0.9.x]
### breaking changes

- if the response status is 4xx or 5xx: an error is thrown [#13](https://github.com/mapado/rest-client-js-sdk/pull/13)

### new features

- memoize token generation and refresh [#12](https://github.com/mapado/rest-client-js-sdk/pull/12)


## [0.6.x]
### breaking changes

The `queryParam` argument was added where needed in the AbstractClient class:

- `findAll(queryParam = {}, pathParameters = {})`
- `create(entity, queryParam = {}, pathParameters = {})`

### new features
The `queryParam` argument was added where needed in the AbstractClient class:

- `update(entity, queryParam = {})`
