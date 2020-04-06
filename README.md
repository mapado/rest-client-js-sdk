# Mapado Rest Client JS SDK [![Build Status](https://travis-ci.org/mapado/rest-client-js-sdk.svg?branch=master)](https://travis-ci.org/mapado/rest-client-js-sdk)

Rest client SDK for API for Javascript usage.

This client tries to avoid the complexity of implementing a custom SDK for every
API you have. You just have to implements your model and a little configuration
and it will hide the complexity for you.

## Installation

`npm install rest-client-sdk`

## Usage

### Declare your mapping

```js
import { Mapping, Attribute, Relation, ClassMetadata } from 'rest-client-sdk';

const mapping = new Mapping('/v1');

const productMetadata = new ClassMetadata(
  'products', // key: mandatory, will be passed in your serializer
  'my_products', // pathRoot: optional, the endpoint of your API: will be added to the mapping prefix ('/v1' here)
  SomeRepositoryClass // repositoryClass: optional, See "Overriding repository" for more detail
);

const idAttr = new Attribute(
  '@id', // serializedKey: mandatory, the key returned from your API
  'id', // attributeName: optional, the name in your entity, default to the `serializedKey` attribute
  'string', // type: optional, default to `string`
  true // isIdentifier: optional, default to `false`
);
const name = new Attribute('name');
productMetadata.setAttributeList([idAttr, name]);
productMetadata.setRelationList([
  new Relation(
    Relation.ONE_TO_MANY, // type: Relation.ONE_TO_MANY or Relation.MANY_TO_ONE
    'categories', // targetMetadataKey: must match the first argument of `ClassMetadata` constructor of the target entity
    'category_list', // serializedKey: the key returned from your API
    'categoryList' // attributeName: optional, the name in your entity, default to the `serializedKey` attribute
  ),
]);

const categoryMetadata = new ClassMetadata('categories');
categoryMetadata.setAttributeList([
  new Attribute('id', 'id', 'string', true),
  new Attribute('name'),
]);
categoryMetadata.setRelationList([
  new Relation(Relation.MANY_TO_ONE, 'product', 'product'),
]);

mapping.setMapping([productMetadata, categoryMetadata]);
```

### Create the SDK

#### Create the token storage

```js
import { TokenStorage } from 'rest-client-sdk';

const tokenGeneratorConfig = { path: 'oauth.me', foo: 'bar' };
const tokenGenerator = new SomeTokenGenerator(tokenGeneratorConfig); // Some token generators are defined in `src/TokenGenerator/`
const storage = AsyncStorage; // create a storage instance if you are not on RN. In browser and node, localforage works fine
const tokenStorage = new TokenStorage(tokenGenerator, storage);
```

The token generator is a class implementing `generateToken` and `refreshToken`.
Those methods must return an array containing an `access_token` key.

The storage needs to be a class implementing `setItem(key, value)`,
`getItem(key)` and `removeItem(key)`. Those functions must return a promise.

At Mapado we use [localforage](http://mozilla.github.io/localForage/) in a
browser environment and
[React Native AsyncStorage](https://facebook.github.io/react-native/docs/asyncstorage.html)
for React Native.

#### Configure the SDK

```js
import RestClientSdk from 'rest-client-sdk';

const config = {
  path: 'api.me',
  scheme: 'https',
  port: 443,
  segment: '/my-api',
  authorizationType: 'Bearer', // default to "Bearer", but can be "Basic" or anything
  useDefaultParameters: true,
}; // path and scheme are mandatory

const sdk = new RestClientSdk(tokenStorage, config, mapping);
```

### Make calls

#### Find

You can now call the clients this way:

```js
sdk.getRepository('products').find(8); // will find the entity with id 8. ie. /v2/my_products/8

sdk.getRepository('products').findAll(); // will find all entities. ie. /v2/my_products

sdk.getRepository('products').findBy({ foo: 'bar' }); // will find all entities for the request: /v2/my_products?foo=bar
```

#### Update / delete

```js
sdk.getRepository('products').create(entity);

sdk.getRepository('products').update(entity);

sdk.getRepository('products').delete(entity);
```

### Overriding repository

You can override the default repository

```js
import { AbstractClient } from 'rest-client-sdk';

class SomeEntityClient extends AbstractClient {
  getPathBase(pathParameters) {
    return '/v2/some_entities'; // you need to return the full query string for the collection GET query
  }

  getEntityURI(entity) {
    return `${this.getPathBase()}/${entity.id}`; // this will be the URI used by update / delete script
  }
}

export default SomeEntityClient;
```

### Custom serializer

You can inject a custom serializer to the SDK. The serializer must extends the
base `Serializer` class and implement 3 methods:

- `deserializeItem(rawData, classMetadata)` (`classMetadata` is the instance of ClassMetadata you configured)
- `deserializeList(rawListData, classMetadata)` (`classMetadata` is the instance of ClassMetadata you configured)
- `serializeItem(item, classMetadata)` (`classMetadata` is the instance of ClassMetadata you configured)

All text response from GET / PUT / POST request will be send to
`deserializeItem` or `deserializeList`. All content fom `update` and `create`
call will be send to `serializeItem`.

The default serializer uses `JSON.parse` and `JSON.stringify`, so it converts
string to JSON objects.

#### Example with the default serializer

```js
import { Serializer } from 'rest-client-sdk';

class JsSerializer extends Serializer {
  deserializeItem(rawData, classMetadata) {
    // do stuff with your item input
    return JSON.parse(rawData);
  }

  deserializeList(rawListData, classMetadata) {
    // do stuff with your list input
    return JSON.parse(rawListData);
  }

  serializeItem(entity, classMetadata) {
    // prepare item for being sent in a request
    return JSON.stringify(entity);
  }
}

const serializer = new JsSerializer();

const sdk = new RestClientSdk(tokenStorage, config, clients, serializer);
```
