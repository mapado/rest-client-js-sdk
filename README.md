Mapado Rest Client JS SDK [![Build Status](https://travis-ci.org/mapado/rest-client-js-sdk.svg?branch=master)](https://travis-ci.org/mapado/rest-client-js-sdk)
=================

[![Greenkeeper badge](https://badges.greenkeeper.io/mapado/rest-client-js-sdk.svg)](https://greenkeeper.io/)

Rest client SDK for API for Javascript usage.

This client tries to avoid the complexity of implementing a custom SDK for every API you have. You just have to implements your model and a little configuration and it will hide the complexity for you.

## Installation
`npm install rest-client-sdk`

## Usage

### Declare your clients
```js
import { AbstractClient } from 'rest-client-sdk';

class SomeEntityClient extends AbstractClient {
  getPathBase() {
    return '/v2/some_entities'; // this is the URI used for querying
  }

  getEntityURI(entity) {
      return `${this.getPathBase}/${entity.id}`; // this will be the URI used by update / delete script
  }

  getName() {
      return 'SomeEntity'; // this will be passed to the serializer
  }
}

export default SomeEntityClient;
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

The storage needs to be a class implementing `setItem(key, value)`, `getItem(key)` and `removeItem(key)`. Those functions must return a promise.

At Mapado we use [localforage](http://mozilla.github.io/localForage/) in a browser environment and [React Native AsyncStorage](https://facebook.github.io/react-native/docs/asyncstorage.html) for React Native.

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

const clients = {
    someEntity: SomeEntityClient,
    // ...
};

const sdk = new RestClientSdk(tokenStorage, config, clients);
```

### Make calls
#### Find
You can now call the clients this way: 
```js
sdk.someEntity.find(8); // will find the entity with id 8. ie. /v2/some_entities/8

sdk.someEntity.findAll(); // will find all entities. ie. /v2/some_entities

sdk.someEntity.findBy({ foo: 'bar' }); // will find all entities for the request: /v2/some_entities?foo=bar
```

#### Update / delete
```js
sdk.someEntity.update(entity);

sdk.someEntity.delete(entity);
```

### Custom serializer
You can inject a custom serializer to the SDK.
The serializer must extends the base `Serializer` class and implement 3 methods:
  * `deserializeItem(rawData, type)` (type is the result of `getName`)
  * `deserializeList(rawListData, type)` (type is the result of `getName`)
  * `serializeItem(item, type)` (type is the result of `getName`)

All text response from GET / PUT / POST request will be send to `deserializeItem` or `deserializeList`.
All content fom `update` and `create` call will be send to `serializeItem`.

The default serializer uses `JSON.parse` and `JSON.stringify`, so it converts string to JSON objects.

#### Example with the default serializer
```js
import { Serializer } from 'rest-client-sdk';

class JsSerializer extends Serializer {
  deserializeItem(rawData, type) {
    // do stuff with your item input
    return JSON.parse(rawData);
  }

  deserializeList(rawListData, type) {
    // do stuff with your list input
    return JSON.parse(rawListData);
  }


  serializeItem(entity, type) {
    // prepare item for being sent in a request
    return JSON.stringify(entity);
  }
}

const serializer = new JsSerializer();

const sdk = new RestClientSdk(tokenStorage, config, clients, serializer);
```
