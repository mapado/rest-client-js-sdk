/* global describe, it, afterEach */
import { expect } from 'chai';
import MapadoSdk, { AbstractClient } from '../src';
import oauthClient from './mock/OauthClient';

class SomeTestClient extends AbstractClient {
  getPathBase() {
    return '/v2/test';
  }

  getName() {
    return 'SomeTest';
  }
}


// const SomeSdk = new MapadoSdk(oauthClient);
describe('Test wrong SDK configuration', () => {
  expect(() => new MapadoSdk(oauthClient)).to.throw(RangeError);
});

describe('Good sdk configuration', () => {
  const sdk = new MapadoSdk(
    oauthClient,
    { path: 'my.api.com', scheme: 'https' }
  );

  expect(sdk.config.path).to.equal('my.api.com');
  expect(sdk.config.scheme).to.equal('https');
  expect(sdk.config.useDefaultParameters).to.be.true;

  const specifyDefParam = new MapadoSdk(
    oauthClient,
    { path: 'my.api.com', scheme: 'https', useDefaultParameters: true }
  );
  expect(specifyDefParam.config.useDefaultParameters).to.be.true;

  const noDefParamSdk = new MapadoSdk(
    oauthClient,
    { path: 'my.api.com', scheme: 'https', useDefaultParameters: false }
  );
  expect(noDefParamSdk.config.useDefaultParameters).to.be.false;
});


describe('Inject client into SDK', () => {
  const sdk = new MapadoSdk(
    oauthClient,
    { path: 'my.api.com', scheme: 'https' },
    { testClient: SomeTestClient }
  );

  expect(sdk.testClient).to.be.instanceof(SomeTestClient);
  expect(sdk.testClient.find).to.be.be.a('function');
  expect(sdk.testClient.getPathBase()).to.equal('/v2/test');
  expect(sdk.testClient.sdk).to.equal(sdk);
});

