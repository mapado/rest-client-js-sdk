/* eslint no-unused-expressions: 0 */
import RestClientSdk, { AbstractClient } from '../src';
import tokenStorage from '../__mocks__/tokenStorage';

class SomeTestClient extends AbstractClient {
  getPathBase() {
    return '/v2/test';
  }

  getName() {
    return 'SomeTest';
  }
}

describe('Mapado Sdk tests', () => {
  test('Test wrong SDK configuration', () => {
    expect(() => new RestClientSdk(tokenStorage)).toThrowError(RangeError);
  });

  test('Good sdk configuration', () => {
    const sdk = new RestClientSdk(tokenStorage, {
      path: 'my.api.com',
      scheme: 'https',
    });

    expect(sdk.config.path).toBe('my.api.com');
    expect(sdk.config.scheme).toBe('https');
    expect(sdk.config.useDefaultParameters).toBe(true);

    const specifyDefParam = new RestClientSdk(tokenStorage, {
      path: 'my.api.com',
      scheme: 'https',
      useDefaultParameters: true,
    });
    expect(specifyDefParam.config.useDefaultParameters).toBe(true);

    const noDefParamSdk = new RestClientSdk(tokenStorage, {
      path: 'my.api.com',
      scheme: 'https',
      useDefaultParameters: false,
    });
    expect(noDefParamSdk.config.useDefaultParameters).toBe(false);
  });

  describe('Inject client into SDK', () => {
    const sdk = new RestClientSdk(
      tokenStorage,
      { path: 'my.api.com', scheme: 'https' },
      { testClient: SomeTestClient }
    );

    expect(sdk.testClient).toBeInstanceOf(SomeTestClient);
    expect(typeof sdk.testClient.find).toBe('function');
    expect(sdk.testClient.getPathBase()).toBe('/v2/test');
    expect(sdk.testClient.sdk).toBe(sdk);
  });
});
