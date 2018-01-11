/* eslint no-unused-expressions: 0 */
import RestClientSdk, {
  AbstractClient,
  Mapping,
  ClassMetadata,
  Attribute,
} from '../src';
import tokenStorage from '../__mocks__/tokenStorage';

const mapping = new Mapping('/v2');
const testMetadata = new ClassMetadata('test');
testMetadata.setAttributeList([new Attribute('@id', '@id', 'string', true)]);
mapping.setMapping([testMetadata]);

describe('Mapado Sdk tests', () => {
  test('Test wrong SDK configuration', () => {
    expect(() => new RestClientSdk(tokenStorage)).toThrowError(RangeError);
  });

  test('Good sdk configuration', () => {
    const sdk = new RestClientSdk(
      tokenStorage,
      {
        path: 'my.api.com',
        scheme: 'https',
      },
      mapping
    );

    expect(sdk.config.path).toBe('my.api.com');
    expect(sdk.config.scheme).toBe('https');
    expect(sdk.config.useDefaultParameters).toBe(true);

    const specifyDefParam = new RestClientSdk(
      tokenStorage,
      {
        path: 'my.api.com',
        scheme: 'https',
        useDefaultParameters: true,
      },
      mapping
    );
    expect(specifyDefParam.config.useDefaultParameters).toBe(true);

    const noDefParamSdk = new RestClientSdk(
      tokenStorage,
      {
        path: 'my.api.com',
        scheme: 'https',
        useDefaultParameters: false,
      },
      mapping
    );
    expect(noDefParamSdk.config.useDefaultParameters).toBe(false);
  });

  test('Inject client into SDK', () => {
    const sdk = new RestClientSdk(
      tokenStorage,
      { path: 'my.api.com', scheme: 'https' },
      mapping
    );

    expect(sdk.getRepository('test')).toBeInstanceOf(AbstractClient);
    expect(typeof sdk.getRepository('test').find).toBe('function');
    expect(sdk.getRepository('test').getPathBase()).toBe('/v2/test');
    expect(sdk.getRepository('test').sdk).toBe(sdk);
  });
});
