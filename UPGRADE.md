# breaking changes
## v0.6.x

The `queryParam` argument was added where needed in the AbstractClient class:

- `findAll(queryParam = {}, pathParameters = {})`
- `create(entity, queryParam = {}, pathParameters = {})`

# new features
## v0.6.x
The `queryParam` argument was added where needed in the AbstractClient class:

- `update(entity, queryParam = {})`