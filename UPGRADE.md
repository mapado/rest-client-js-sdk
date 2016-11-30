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
