Mapado Rest Client JS SDK [![Build Status](https://travis-ci.org/mapado/rest-client-js-sdk.svg?branch=master)](https://travis-ci.org/mapado/rest-client-js-sdk)
=================

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
    return '/v2/some_entities';
  }

  getName() {
      return 'SomeEntity'; // this will be passed to the entity factory
  }
}
```

### Create the SDK
#### Create the token storage
```js
import { TokenStorage } from 'rest-client-sdk';

const tokenGeneratorConfig = { path: 'oauth.me', foo: 'bar' }
const tokenGenerator = new SomeTokenGenerator(tokenGeneratorConfig); // Some token generators are defined in `src/TokenGenerator/`
const storage = AsyncStorage; // create a storage instance if you are not on RN. In browser and node, localforage works fine
const tokenStorage = new TokenStorage(tokenGenerator, asyncStorage);
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
}; // path and scheme are mandatory

const clients = {
    someEntity: SomeEntityClient,
    // ...
};

const sdk = new RestClientSdk(tokenStorage, config, clients);
```

You can now call the clients this way: 
```js
sdk.someEntity.find(8); // will find the entity with id 8. ie. /v2/some_entities/8

sdk.someEntity.findAll(); // will find all entities. ie. /v2/some_entities

sdk.someEntity.findBy({ foo: 'bar' }); // will find all entities for the request: /v2/some_entities?foo=bar
```

### Custom entity factory
You can inject a custom entity factory to the SDK. All entities will be send to the entityFactory.

The default entity factory is the immutable function [`fromJS`](https://facebook.github.io/immutable-js/docs/#/fromJS)

```js
function entityFactory(input, listOrItem, clientName = null) {
    if (listOrItem === 'list') {
        // do stuff with your list input

        return output;
    } else { // listOrItem === 'item'
        const output = // ... do stuff with your input

        return output;
    }
}

const sdk = new RestClientSdk(tokenStorage, config, clients, entityFactory);
```
