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
const cartMetadata = new ClassMetadata('cart');
const cartItemMetadata = new ClassMetadata('cartItem');
const orderMetadata = new ClassMetadata('order');

testMetadata.setAttributeList([new Attribute('@id', '@id', 'string', true)]);
mapping.setMapping([
  testMetadata,
  cartMetadata,
  cartItemMetadata,
  orderMetadata,
]);

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
    expect(sdk.getRepository('test').getPathBase()).toBe('/test');
    expect(sdk.getRepository('test').sdk).toBe(sdk);
  });

  test('Mapping not found', () => {
    const sdk = new RestClientSdk(
      tokenStorage,
      { path: 'my.api.com', scheme: 'https' },
      mapping
    );

    expect(() => sdk.getRepository('toast')).toThrowError(
      'Unable to get metadata for repository "toast". Did you mean "test"?'
    );

    expect(() => sdk.getRepository('Cart')).toThrowError(
      'Unable to get metadata for repository "Cart". Did you mean "cart"?'
    );

    expect(() => sdk.getRepository('cart_items')).toThrowError(
      'Unable to get metadata for repository "cart_items". Did you mean "cartItem"?'
    );

    // word is too far from any other words
    expect(() => sdk.getRepository('zargiblou')).toThrowError(
      'Unable to get metadata for repository "zargiblou".'
    );
  });
});
