# v0.13.x
## breaking changes

The library does not depends on `immutablejs` anymore, so we needed to make a few breaking changes:

  * Do not depend on `@id` anymore: The `AbstractClient` need to implements a `getEntityURI(entity)` and return an query string from it. This is not a great pattern, but it will do for now. (https://github.com/mapado/rest-client-js-sdk/pull/19)
  * The `entityFactory` does not exists anymore. It has been replaced by a `Serializer`: (https://github.com/mapado/rest-client-js-sdk/pull/21)
    * If you used the default entityFactory, you will now receive plain Javascript objects instead of immutable's Map or List
    * If you previously overrided the `entityFactory`, you will need to switch to the new `Serializer` object: It is much more extensible but is a bit more complex to extend. See README to know how to do it.
    * the `createEntityFromJsonResponse` method has been renamed to `deserializeResponse`
  * The library moved from ES5 to bundling with rollupjs, that should not break anything and should improve size of bundle but I am not so sure of this, so patch may follow (https://github.com/mapado/rest-client-js-sdk/pull/20)


# v0.12.x
## breaking changes

- a `delete` does not call `createEntityFromJsonResponse` anymore as it should return a "204 No Content" or a "404 Not Found"


# v0.11.x
## breaking changes

- `ProviderTokenGenerator` does not accept a param object anymore on its second argument.

## new features

- `ProviderTokenGenerator` now accept a function on its second argument which will be called on `refreshToken`, so you can fully customize the behavior. The function must return a Promise.

# v0.9.x
## breaking changes

- if the response status is 4xx or 5xx: an error is thrown [#13](https://github.com/mapado/rest-client-js-sdk/pull/13)

## new features

- memoize token generation and refresh [#12](https://github.com/mapado/rest-client-js-sdk/pull/12)


# v0.6.x
## breaking changes

The `queryParam` argument was added where needed in the AbstractClient class:

- `findAll(queryParam = {}, pathParameters = {})`
- `create(entity, queryParam = {}, pathParameters = {})`

## new features
The `queryParam` argument was added where needed in the AbstractClient class:

- `update(entity, queryParam = {})`
