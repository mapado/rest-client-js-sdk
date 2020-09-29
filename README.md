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

Using TypeScript ? You need to configure the mapping to benefits from TypeScript types detection.

```ts
type Product = {
  @id: string;
  name: string;
  categoryList: Category[];
};

type Category = {
  @id: string;
  name: string;
  product: Product;
};

type TSMetadata = {
  // first value is the entity object, second one is the listing type, it can be any Iterable<Entity>
  products: {
    entity: Product;
    list: Array<Product>;
  };
  categories: {
    entity: Category;
    list: Array<Category>;
  };
};
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
  unitOfWorkEnabled: true, // if key is missing, UnitOfWork will be disabled by default
}; // path and scheme are mandatory

const sdk = new RestClientSdk(tokenStorage, config, mapping);
```

Using TypeScript ? You should now pass the TSMetadata that you defined.

```ts
import RestClientSdk, { Token } from 'rest-client-sdk';

const sdk = new RestClientSdk<TSMetadata>(tokenStorage, config, mapping);
```

#### UnitOfWork

Adding the key `unitOfWorkEnabled` to the `config` object passed to the `RestClientSdk` constructor will enable or disable the UnitOfWork
The UnitOfWork keeps track of the changes made to entity props so as to only send dirty fields when updating that entity

```js
const productRepo = sdk.getRepository('products');
let product = await productRepo.find(1);
/*
    considering the json body of the response was

    {
      "category": "book",
      "name": "Tom Sawyer"
    }
  */

product = product.set('name', 'Huckleberry Finn');

productRepo.update(product);
/*
    The PUT call produced will be made with the json body : { "name": "Huckleberry Finn" }
    It will not include other unchanged props like "category" which could overwrite existing values
    (if not fetched and initialized with a default null value for example)
  */
```

When dealing with large collections of objects, the UnitOfWork can add a considerable memory overhead. If you do not plan to do updates, it is advised to leave it disabled

### Make calls

#### Find

You can now call the clients this way:

```js
sdk.getRepository('products').find(8); // will find the entity with id 8. ie. /v2/my_products/8

sdk.getRepository('products').findAll(); // will find all entities. ie. /v2/my_products

sdk.getRepository('products').findBy({ foo: 'bar' }); // will find all entities for the request: /v2/my_products?foo=bar
```

All these methods returns promises.
`find` returns a `Promise<Entity>`, `findBy` and `findAll` returns `Promise<Iterable<Entity>>`

#### Update / delete

```js
sdk.getRepository('products').create(entity);

sdk.getRepository('products').update(entity);

sdk.getRepository('products').delete(entity);
```

All these methods returns promises.
`create` and `update` returns a `Promise<Entity>` with the new entity.
`delete` returns `Promise<void>`.

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

Typescript users:

```ts
import { SdkMetadata } from 'rest-client-sdk';

class SomeEntityClient extends AbstractClient<TSMetadata['some_entities']> {
  getPathBase(pathParameters: object) {
    return '/v2/some_entities'; // you need to return the full query string for the collection GET query
  }

  getEntityURI(entity: SomeEntity) {
    return `${this.getPathBase()}/${entity.id}`; // this will be the URI used by update / delete script
  }

  findThisPost(params): Post {
    // do stuff
  }
}
```

TODO : For the moment, if you want to call a custom repository method, you have to cast it. (TODO : Find a way to get it from the mapping).

```ts
const repo = sdk.getRepository('posts') as PostRepository<TSMetadata, Token>;

repo.findThisPost();
```

### Custom serializer

The serializer is the object in charge of converting strings to object and vice-versa.

It deserializes strings from the API in two phases (for both items and lists) :

- converts a string to a plain object (decode)
- optionnally converts this object to a model object (denormalize), if you want to work with something different than plain JS object (like [immutable Record](https://immutable-js.github.io/immutable-js/docs/#/Record) or a [custom model class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)).

and on the other way serializes in two phase two:

- optionnaly converts the model object to a plain JavaScript object (normalize)
- converts this plain JavaScript object to a string that will be sent to the API (encode)

It has been greatly inspired by [PHP Symfony's serializer](https://symfony.com/doc/current/components/serializer.html).

#### Default implementation

The default serializer implementations deserializes JSON to plain JavaScript object and serializes plain JavaScript object to JSON.

#### Creating custom serializer implementation

You can create and inject a custom serializer to the SDK. The serializer must extends the base `Serializer` class and implement the following methods:

- `normalizeItem(entity: object, classMetadata: ClassMetadata): object`: convert an entity to a plain javascript object
- `encodeItem(object: object, classMetadata: ClassMetadata): string`: convert a plain javascript object to string
- `decodeItem(rawData: string, classMetadata: ClassMetadata, response: Response): object`: convert a string containing an object to a plain javascript object
- `denormalizeItem(object: object, classMetadata: ClassMetadata, response: Response): object`: convert a plain object to an entity
- `decodeList(rawListData: string, classMetadata: ClassMetadata, response: Response): object | object[]`: convert a string containing a list of objects to a list of plain javascript objects
- `denormalizeList(objectList: object | object[], classMetadata: ClassMetadata, response: Response): object[]`: convert a plain object list to an entity list

`classMetadata` is the instance of ClassMetadata you configured. `response` is the HTTP response object.

All text response from GET / PUT / POST request will be send to `decodeItem + denormalizeItem` or `decodeList + denormalizeList`. All content fom `update` and `create` call will be send to `encodeItem + normalizeItem`.

#### Example with the default serializer

```js
import { Serializer } from 'rest-client-sdk';

class JsSerializer extends Serializer {
  normalizeItem(entity, classMetadata) {
    return entity; // we don't have model object here, so return the plain JS object
  }

  encodeItem(object, classMetadata) {
    return JSON.stringify(object);
  }

  decodeItem(rawData, classMetadata, response) {
    return JSON.parse(rawData);
  }

  denormalizeItem(object, classMetadata, response) {
    return object; // we don't have any model object here, so return the plain JS object
  }

  decodeList(rawListData, classMetadata, response) {
    return JSON.parse(rawListData);
  }

  denormalizeList(objectList, classMetadata, response) {
    return objectList; // we don't have any model object here, so return the plain JS object
  }
}

const serializer = new JsSerializer();

const sdk = new RestClientSdk(tokenStorage, config, clients, serializer);
```

Typescript users:

```ts
import { Serializer, ClassMetadata } from 'rest-client-sdk';

class JsSerializer extends Serializer {
  normalizeItem(entity: object, classMetadata: ClassMetadata): object {
    return entity; // we don't have model object here, so return the plain JS object
  }

  encodeItem(object: object, classMetadata: ClassMetadata): string {
    return JSON.stringify(object);
  }

  decodeItem(
    rawData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object {
    return JSON.parse(rawData);
  }

  denormalizeItem(
    object: object,
    classMetadata: ClassMetadata,
    response: Response
  ): object {
    return object; // we don't have any model object here, so return the plain JS object
  }

  decodeList(
    rawListData: string,
    classMetadata: ClassMetadata,
    response: Response
  ): object | object[] {
    return JSON.parse(rawListData);
  }

  denormalizeList(
    objectList: object | object[],
    classMetadata: ClassMetadata,
    response: Response
  ): object | object[] {
    return objectList; // we don't have any model object here, so return the plain JS object
  }
}

const serializer = new JsSerializer();

const sdk = new RestClientSdk<TSMetadata>(
  tokenStorage,
  config,
  clients,
  serializer
);
```
