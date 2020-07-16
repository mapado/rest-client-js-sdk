# Changelog

## 5.0.0-rc.7

### Changed

- `config.authorizationType` is in fact optional (default to "Bearer"), so update the types accordingly
- Update typescript-eslint and fix eslint issues
- Make `SerializerInterace` and `Serializer` input and output understandable

## 5.0.0-rc.6

### Changed

- Improve JSDoc

## 5.0.0-rc.5

### Changed

- Simplify configuration for TypeScript (serializer, AbstractClient, etc.)

## 5.0.0-rc.1

### Changed

- [BREAKING] TokenGenerator's `refreshToken` method signature changed from `refreshToken(accessToken, parameters)` to `refreshToken(accessToken)`.
  If you did extend the `AbstractToken` generator, you shouldn't relly on the second parameter.
  As a matter of fact, the auto-refreshed token in `AbstractClient` did not send any parameters either, so it should not have been working before !
- [BREAKING] Accordingly The `refreshToken` method of `TokenStorage` signature changed from `refreshToken(parameters)` to `refreshToken()`
- Migrate codebase to TypeScript. It should not change anything to users, exept a more robust code for TypeScript users. Some small undocumented cases might break:
  - [Might Break] `ClassMetadata`, `Attribute` and `Relation` attributes are now `readonly`. You can not change them after initialization.
  - [Might Break] `AbstractTokenGenerator` is now abstract. It should not have been used directly anyway. It implies that the method that previously did thrown errors are not callable (`generateToken`, `refreshToken` and `checkTokenGeneratorConfig`). They should not have been called.
  - `canAutogenerateToken` has been removed from the token storages and replaced by a `autogenerateToken()` method (it's not real POO, but I did not manage to deal with instance of for now)
  - [Might Break] AbstractClient.\_refreshTokenAndRefetch does not take the response as a first argument (it wan unused). The method was supposed to be private be the way.

## 4.1.2

### Fixed

- Fix issue with urijs 1.19.2

## 4.1.1

### Changed

- replace object spread with Object.assign for build to work

## 4.1.0

### Changed

- main AbstractClient CRUD methods accept additional requestParams for overriding fetch params like method, headers, etc.

## 4.0.1

### Changed

- downgraded jest and babel-jest to ^23.6.0 in order to fix tests

## 4.0.0

### Changed

- Do not generate token expires_at in \_storeAccessToken since it is sometimes used from outside, in tests for instance (even though it is supposed to be private)
- [Breaking] throw new error types when oauth calls fail, they all wrap the originalError => InvalidGrantError, InvalidScopeError which both extend OauthError. Original error can be found at error.previousError. If it was an HttpError the response is at error.previousError.baseResponse

## 3.2.1

### Changed

- Refactor error handling with error factory and handle 400's in refreshToken of PasswordGenerator

## 3.2.0

### Changed

- Pre-emptively refresh the access token if it is close to expiration before doing any request

## 3.1.1

### Changed

- Read json response in \_manageUnauthorized when www-authenticate header is not available

## 3.1.0

### Changed

- Store a new key `expires_at` in the access token (which is accessible with `TokenStorage.getAccessTokenObject`) to have the timestamp after which the access token will be invalid, based on the `expires_in`
- Add `TokenStorage.getCurrentTokenExpiresIn` function to known how many seconds are remaining for the access token currently stored

## 3.0.0

### Changed

- [Breaking] `AccessDeniedError` is now `UnauthorizedError`
- [Breaking] Default error is now `HttpError`
- Add `ConflictError` to react to 409

## 2.3.0

### Changed

- `TokenStorage` add possibility to pass access_token async storage key as constructor param
- `AbstractClient._manageAccessDenied` checks headers instead of json to ensure refreshing the token is required

## 2.2.1

### Changed

- `TokenStorage.getAccessTokenObject()` returns an object and null if the stored token is not an object
- [Might Break] `TokenStorage.getAccessTokenObject()` does not return `undefined` anymore but `null` if no token object is found

## 2.2.0

### Changed

- Add possibility to pass null as tokenStorage argument of the sdk
- switch method names \_doFetch and \_fetchWithToken in AbstractClient for coherence

## 2.1.0

### Changed

- Add method getAccessTokenObject to TokenStorage

## 2.0.1

### Changed

- Better packaging system [#48](https://github.com/mapado/rest-client-js-sdk/pull/48)

## 2.0.0

### Added

- [Might break] Custom serializer can:
  - `serializeItem` has been splitted into `normalizeItem` + `encodeItem`
  - `deserializeItem` has been splitted into `denormalizeItem` + `decodeItem`
  - `deserializeList` has been splitted into `denormalizeList` + `decodeList`

You must implement them if you have a custom serialization that do not use plain javascript objects.

### Changed

- [Breaking] Calling `restClientSdk.foo.xxx` is deprecated, you must now call `restClientSdk.getRepository('foo').xxx`
- [Breaking] RestClientSdk now takes a Mapping instance instead of a clientList. This instance is required
- [Breaking] `getName` has been removed and replaced by the classmetadata key. Its return was previously sent to the serializer, it's now the mapping that is sent now.
  Beware that now, the `key` is now used both to call the repository name, and passed to the serializer
  Before:

```js
class SomeClient extends AbstractClient {
  getName() {
    return 'SomeClient';
  }
}

new RestClientSdk(
  // ...
  {
    foo: SomeClient,
  }
);
```

Now:

```js
  const metadata = new ClassMetadata('foo', 'some_endpoint');
  mapping = new Mapping();
  mapping.setMapping([ metadata ]);

  const sdk = new RestClientSdk(/* ... */, mapping); // `foo` will be used in serializer too
  sdk.foo.find();
```

- [Breaking] Custom Serializer: If you had a Collection entity containing the result of you entities, you will need to implement the [iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#The_iterable_protocol) on this object, this way, we can register all entities in the unit of work.

### Removed

- Dropped support for node 6
- AbstractClient does not need to specify `getPathBase` anymore: this is generated via the classmetata. You can still override it.
- `getEntityURI` is not mandatory anymore. it will be autogenerate by the AbstractClient. You can still override it
- There is no need to create an empty client extending `AbstractClient` now, the default will be `AbstractClient`
- config `prefix` is not used anymore, you should specify your prefix in the mapping: `new Mapping('/v1')`

## 2.0.0-rc.14

Check relations in `isValidMapping`

## 2.0.0-rc.13

Fix issue when setting a ManyToOne relatossue when setting a ManyToOne relation to `null`n to `null`

## 2.0.0-rc.12

add a function to test mapping validity

## 2.0.0-rc.10 + 2.0.0-rc.11

deserialize + normalize item in unitofwork

## 2.0.0-rc.9

creating or updating an "complex" entity (not a basic JS object) would throw an error

## 2.0.0-rc.8

remove `async` method (that already returned a Promise object)

## 2.0.0-rc.7

Fix issue when posting a ManyToOne relation with only the id as string

## 2.0.0-rc.6

Fix bug in delete call (not returning the response)

## 2.0.0-rc.5

Fix bug in serializer

## 2.0.0-rc.4

Fix issue with list denormalized oo objects

## 2.0.0-rc.3

Cleaner relations, matches the Arguments attributes

## 2.0.0-rc.2

### Changed

- `ONE_TO_MANY` and `MANY_TO_ONE` constant are now exported via the `Relation.ONE_TO_MANY` and `Relation.MANY_TO_ONE`, not in the main package

## 2.0.0-rc.1

See release note for 2.0.0

## [1.3.2] - 2017-12-04

### Changed

- fix simultaneous refresh token throwing error when trying to access to
  response body twice

## [1.3.1] - 2017-12-04

### Changed

- add error message to AccessDeniedError in PasswordGenerator's refreshToken

## [1.3.0] - 2017-11-29

### Changed

- throw AccessDeniedError only on BadRequestError in PasswordGenerator
  refreshToken

## [1.2.0] - 2017-11-10

### Changed

- fix response passed as error message in Errors
- throw AccessDeniedError on any Error in PasswordGenerator refreshToken
- allow to pass scope param in tokenGeneratorConfig

## [1.1.1] - 2017-10-08

### Changed

- upgrade rollup to 0.50.0

## [1.1.0] - 2017-08-30

### Changed

- Pass on response to serializer
- Upgrade dependencies (rollup 0.49, eslint 4, etc.)
- Add prettier to project

## [1.0.5] - 2017-08-30

### Changed

- Fix token loop when token is not valid anymore

## [1.0.4] - 2017-07-28

### Changed

- Remove undefined headers

## [1.0.3] - 2017-07-27

### Changed

- Allow overriding base headers
  [#24](https://github.com/mapado/rest-client-js-sdk/pull/24)

## [1.0.2] - 2017-07-04

This release is the same as 0.15.0 and though fully compatible

### Changed

- Rolled back to urijs because domurl use the default node implementation which
  is not compatible with the stack we use. The real future solution will be to
  use Javascript `URL` object but too early and unstable for now

## [1.0.1] - 2017-07-03 - [YANKED]

### Changed

- Make urijs implementation work again but might be breaking
- Url constructor passed with `noTransform = true` for better perf and avoid
  potential bugs

## [1.0.0] - 2017-07-03 - [YANKED]

### Changed

- Replace [urijs](https://medialize.github.io/URI.js/) dependency by smaller
  [domurl](https://github.com/Mikhus/domurl)

## [0.15.0] - 2017-06-27

### Added

- Added the current URI as referer for http calls

## [0.14.x]

### breaking changes

Error responses in PasswordGenerator and ClientCredentialsGenerator now throw
proper js errors instead of returning the response in the promise rejection

## [0.13.x]

### breaking changes

The library does not depends on `immutablejs` anymore, so we needed to make a
few breaking changes:

- Do not depend on `@id` anymore: The `AbstractClient` need to implements a
  `getEntityURI(entity)` and return an query string from it. This is not a great
  pattern, but it will do for now.
  (https://github.com/mapado/rest-client-js-sdk/pull/19)
- The `entityFactory` does not exists anymore. It has been replaced by a
  `Serializer`: (https://github.com/mapado/rest-client-js-sdk/pull/21)
  - If you used the default entityFactory, you will now receive plain Javascript
    objects instead of immutable's Map or List
  - If you previously overrided the `entityFactory`, you will need to switch to
    the new `Serializer` object: It is much more extensible but is a bit more
    complex to extend. See README to know how to do it.
  - the `createEntityFromJsonResponse` method has been renamed to
    `deserializeResponse`
- The library moved from ES5 to bundling with rollupjs, that should not break
  anything and should improve size of bundle but I am not so sure of this, so
  patch may follow (https://github.com/mapado/rest-client-js-sdk/pull/20)

## [0.12.x]

### breaking changes

- a `delete` does not call `createEntityFromJsonResponse` anymore as it should
  return a "204 No Content" or a "404 Not Found"

## [0.11.x]

### breaking changes

- `ProviderTokenGenerator` does not accept a param object anymore on its second
  argument.

### new features

- `ProviderTokenGenerator` now accept a function on its second argument which
  will be called on `refreshToken`, so you can fully customize the behavior. The
  function must return a Promise.

## [0.9.x]

### breaking changes

- if the response status is 4xx or 5xx: an error is thrown
  [#13](https://github.com/mapado/rest-client-js-sdk/pull/13)

### new features

- memoize token generation and refresh
  [#12](https://github.com/mapado/rest-client-js-sdk/pull/12)

## [0.6.x]

### breaking changes

The `queryParam` argument was added where needed in the AbstractClient class:

- `findAll(queryParam = {}, pathParameters = {})`
- `create(entity, queryParam = {}, pathParameters = {})`

### new features

The `queryParam` argument was added where needed in the AbstractClient class:

- `update(entity, queryParam = {})`
