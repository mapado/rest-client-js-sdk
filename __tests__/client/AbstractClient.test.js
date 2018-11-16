/* eslint no-unused-vars: 0, no-underscore-dangle: 0 */
import fetchMock from 'fetch-mock';
import * as errors from '../../src/ErrorFactory';
import RestClientSdk, {
  AbstractClient,
  Serializer,
  TokenStorage,
  PasswordGenerator,
  ProvidedTokenGenerator,
  Mapping,
  ClassMetadata,
  Attribute,
  Relation,
} from '../../src/index';
import tokenStorageMock from '../../__mocks__/tokenStorage';
import MockStorage from '../../__mocks__/mockStorage';
import unitOfWorkMapping from '../../__mocks__/unitOfWorkMapping';
import MemberSerializer from '../../__mocks__/memberSerializer';

class WeirdSerializer extends Serializer {
  encodeItem(entity) {
    return JSON.stringify(entity);
  }

  decodeItem(rawData) {
    return JSON.parse(rawData);
  }

  denormalizeItem(object) {
    return this._addInfoToItem(object);
  }

  decodeList(rawData) {
    return JSON.parse(rawData);
  }

  denormalizeList(objectList) {
    return objectList.map(this._addInfoToItem);
  }

  _addInfoToItem(item) {
    return Object.assign({}, item, { customName: `${item.name}${item.name}` });
  }
}

class SomeTestClient extends AbstractClient {
  getPathBase(pathParameters) {
    if (pathParameters.basePath) {
      return pathParameters.basePath;
    }

    return '/test';
  }
}

class DefaultParametersTestClient extends AbstractClient {
  getDefaultParameters() {
    return {
      _groups: 'test_read,test_write',
      dp: 'df',
    };
  }
}

const mapping = new Mapping('/v2');
const mappingNoPrefix = new Mapping();
const testMetadata = new ClassMetadata('test', 'test', SomeTestClient);
testMetadata.setAttributeList([new Attribute('@id', '@id', 'string', true)]);
const defParamMetadata = new ClassMetadata(
  'defParam',
  'def_param',
  DefaultParametersTestClient
);
defParamMetadata.setAttributeList([new Attribute('id', 'id', 'integer', true)]);
const noAtIdMetadata = new ClassMetadata('noAtId', 'no-at-id');
noAtIdMetadata.setAttributeList([new Attribute('id', 'id', 'integer', true)]);
mapping.setMapping([testMetadata, defParamMetadata, noAtIdMetadata]);
mappingNoPrefix.setMapping([testMetadata, defParamMetadata, noAtIdMetadata]);

const SomeSdk = new RestClientSdk(
  tokenStorageMock,
  { path: 'api.me', scheme: 'https' },
  mapping
);
SomeSdk.tokenStorage.generateToken();

afterEach(fetchMock.restore);
describe('Test Client', () => {
  test('handle find query', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
    });

    return Promise.all([
      SomeSdk.getRepository('test').find(8),
      SomeSdk.getRepository('test').find(8, { q: 'test', foo: 'bar' }),
      SomeSdk.getRepository('defParam').find(8),
      SomeSdk.getRepository('defParam').find(8, { q: 'test', foo: 'bar' }),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).toEqual('https://api.me/v2/test/8');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).toEqual('https://api.me/v2/test/8?q=test&foo=bar');

      const url3 = fetchMock.calls().matched[2][0];
      expect(url3).toEqual(
        'https://api.me/v2/def_param/8?_groups=test_read%2Ctest_write&dp=df'
      );

      const url4 = fetchMock.calls().matched[3][0];
      expect(url4).toEqual(
        'https://api.me/v2/def_param/8?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df'
      );
    });
  });

  test('have multiple SDKs with different token keys', () => {
    const someStorage = new MockStorage();
    const someOtherStorage = new MockStorage();

    const tokenGenerator1 = new ProvidedTokenGenerator();
    const tokenGenerator2 = new ProvidedTokenGenerator();

    const someTokenStorage = new TokenStorage(tokenGenerator1, someStorage);
    const someOtherTokenStorage = new TokenStorage(
      tokenGenerator2,
      someOtherStorage,
      'my-custom-token-key'
    );

    const storeTokensPromiseList = [
      someTokenStorage._storeAccessToken({
        access_token: 'my-token',
        expires_at: null,
      }),
      someOtherTokenStorage._storeAccessToken({
        access_token: 'my-other-token',
      }),
    ];

    const getTokenPromiseList = [
      someStorage.getItem('rest_client_sdk.api.access_token'),
      someOtherStorage.getItem('my-custom-token-key'),
    ];

    return Promise.all(storeTokensPromiseList).then(() => {
      return Promise.all(getTokenPromiseList).then(values => {
        expect(JSON.parse(values[0])).toEqual({
          access_token: 'my-token',
          expires_at: null,
        });
        expect(JSON.parse(values[1])).toEqual({
          access_token: 'my-other-token',
          expires_at: null,
        });
      });
    });
  });

  test('handle findBy query', () => {
    fetchMock.mock({
      matcher: '*',
      response: {
        body: [
          {
            '@id': '/v2/tests/8',
          },
        ],
      },
    });

    return Promise.all([
      SomeSdk.getRepository('test').findBy({ q: 'test', foo: 'bar' }),
      SomeSdk.getRepository('defParam').findBy({ q: 'test', foo: 'bar' }),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).toEqual('https://api.me/v2/test?q=test&foo=bar');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).toEqual(
        'https://api.me/v2/def_param?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df'
      );
    });
  });

  test('handle findAll query', () => {
    fetchMock.mock(() => true, [
      {
        '@id': '/v2/test/8',
      },
    ]);

    return Promise.all([
      SomeSdk.getRepository('test').findAll(),
      SomeSdk.getRepository('defParam').findAll(),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).toEqual('https://api.me/v2/test');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).toEqual(
        'https://api.me/v2/def_param?_groups=test_read%2Ctest_write&dp=df'
      );
    });
  });

  test('handle entityFactory', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
      name: 'foo',
    });

    return SomeSdk.getRepository('test')
      .find(8)
      .then(item =>
        Promise.all([
          expect(typeof item).toBe('object'),
          expect(item.name).toBe('foo'),
          expect(item.customName).toBeUndefined(),
        ])
      );
  });

  test('handle entityFactory with a custom serializer', () => {
    const EntityFactorySdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https' },
      mapping,
      new WeirdSerializer()
    );

    fetchMock
      .mock('https://api.me/v2/test/8', {
        '@id': '/v2/test/8',
        name: 'foo',
      })
      .mock('https://api.me/v2/test', [
        {
          '@id': '/v2/test/8',
          name: 'foo',
        },
        {
          '@id': '/v2/test/9',
          name: 'bar',
        },
      ]);

    return Promise.all([
      EntityFactorySdk.getRepository('test')
        .find(8)
        .then(item =>
          Promise.all([
            expect(typeof item).toBe('object'),
            expect(item.name).toBe('foo'),
            expect(item.customName).toBe('foofoo'),
          ])
        ),
      EntityFactorySdk.getRepository('test')
        .findAll()
        .then(itemList =>
          Promise.all([
            expect(Array.isArray(itemList)).toBe(true),
            expect(itemList[0].name).toBe('foo'),
            expect(itemList[0].customName).toBe('foofoo'),
          ])
        ),
    ]);
  });

  test('handle getPathBase with custom path parameters', () => {
    fetchMock
      .mock({
        matcher: 'end:/foo',
        response: {
          body: [
            {
              '@id': '/v2/tests/8',
            },
          ],
        },
      })
      .mock({
        matcher: 'end:/foo?q=test&foo=bar',
        response: {
          body: [
            {
              '@id': '/v2/tests/8',
            },
          ],
        },
      })
      .mock({
        matcher: 'end:/foo/8',
        response: {
          body: {
            '@id': '/v2/tests/8',
          },
        },
      });

    const SomeSdkNoPrefix = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https' },
      mappingNoPrefix
    );

    return Promise.all([
      SomeSdkNoPrefix.getRepository('test').find(8, {}, { basePath: '/foo' }),
      SomeSdkNoPrefix.getRepository('test').findBy(
        { q: 'test', foo: 'bar' },
        { basePath: '/foo' }
      ),
      SomeSdkNoPrefix.getRepository('test').findAll({}, { basePath: '/foo' }),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).toEqual('https://api.me/foo/8');
      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).toEqual('https://api.me/foo?q=test&foo=bar');
      const url3 = fetchMock.calls().matched[2][0];
      expect(url3).toEqual('https://api.me/foo');
    });
  });

  test('handle Authorization header', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
    });

    const BasicAuthSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', authorizationType: 'Basic' },
      mapping
    );
    BasicAuthSdk.tokenStorage.generateToken();

    return Promise.all([
      SomeSdk.getRepository('test').find(8),
      BasicAuthSdk.getRepository('test').find(8),
    ]).then(() => {
      const authHeader = fetchMock.calls().matched[0][1].headers.Authorization;
      expect(authHeader).toContain('Bearer ');
      const basicAuthHeader = fetchMock.calls().matched[1][1].headers
        .Authorization;
      expect(basicAuthHeader).toContain('Basic ');
    });
  });

  test('Sdk with no tokenStorage should not add Authorization header', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
    });

    const NoAuthSdk = new RestClientSdk(
      null,
      { path: 'api.me', scheme: 'https', authorizationType: 'Basic' },
      mapping
    );

    return NoAuthSdk.getRepository('test')
      .find(8)
      .then(json => {
        const authHeader = fetchMock.calls().matched[0][1].headers
          .Authorization;
        expect(authHeader).toBe(undefined);
        expect(json).toEqual({ '@id': '/v2/test/8' });
      });
  });
});

describe('Test errors', () => {
  test('handle 401 and 403 errors', () => {
    fetchMock
      .mock(/400$/, 400)
      .mock(/401$/, 401)
      .mock(/403$/, 403)
      .mock(/404$/, 404)
      .mock(/410$/, 410)
      .mock(/500$/, 500);

    return Promise.all([
      expect(SomeSdk.getRepository('test').find(400)).rejects.toBeInstanceOf(
        errors.BadRequestError
      ),
      expect(SomeSdk.getRepository('test').find(401)).rejects.toBeInstanceOf(
        errors.UnauthorizedError
      ),
      expect(SomeSdk.getRepository('test').find(403)).rejects.toBeInstanceOf(
        errors.ForbiddenError
      ),
      expect(SomeSdk.getRepository('test').find(404)).rejects.toBeInstanceOf(
        errors.ResourceNotFoundError
      ),
      expect(SomeSdk.getRepository('test').find(404)).rejects.toBeInstanceOf(
        errors.BadRequestError
      ),
      expect(SomeSdk.getRepository('test').find(410)).rejects.toBeInstanceOf(
        errors.BadRequestError
      ),
      expect(SomeSdk.getRepository('test').find(500)).rejects.toBeInstanceOf(
        errors.InternalServerError
      ),
    ]);
  });
});

describe('Update and delete function trigger the good urls', () => {
  test('handle updating and deleting entities with @ids', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
      foo: 'bar',
    });

    const data = {
      '@id': '/v2/test/8',
      foo: 'foo',
    };

    const dataNoArobase = {
      id: 9,
      foo: 'foo',
    };

    return Promise.all([
      SomeSdk.getRepository('test').update(data),
      SomeSdk.getRepository('noAtId').update(dataNoArobase),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).toEqual('https://api.me/v2/test/8');
      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).toEqual('https://api.me/v2/no-at-id/9');
    });
  });
});
describe('Fix bugs', () => {
  test('generate good url', () => {
    const SomeInnerSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https' },
      mapping
    );
    SomeInnerSdk.tokenStorage.generateToken();

    expect(
      SomeInnerSdk.getRepository('test')
        .makeUri('foo')
        .toString()
    ).toEqual('https://api.me/v2/foo');
  });

  test('allow base header override', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
      foo: 'bar',
    });

    return SomeSdk.getRepository('test')
      .authorizedFetch('foo', {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(() => {
        expect(fetchMock.lastOptions().headers['Content-Type']).toEqual(
          'multipart/form-data'
        );
      });
  });

  test('allow removing base header', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
      foo: 'bar',
    });

    return SomeSdk.getRepository('test')
      .authorizedFetch('foo', {
        headers: {
          'Content-Type': undefined,
          foo: undefined,
          bar: null,
          baz: '',
          bad: 0,
        },
      })
      .then(() => {
        expect(Object.keys(fetchMock.lastOptions().headers)).toEqual([
          'Authorization',
          'Referer',
          'bar',
          'baz',
          'bad',
        ]);
      });
  });

  test('check that the request done after refreshing a token contains the refreshed token', () => {
    fetchMock
      .mock({
        name: 'generate_token',
        matcher: (url, opts) =>
          url === 'https://oauth.me' && opts.body._streams[7] === 'password',
        response: {
          body: {
            access_token: 'an_access_token',
            expires_in: 3600,
            token_type: 'bearer',
            scope: 'scope1 scope2',
            refresh_token: 'refresh_token',
          },
          status: 200,
        },
      })
      .mock({
        name: 'refresh_token',
        matcher: (url, opts) =>
          url === 'https://oauth.me' &&
          opts.body._streams[1].match('refresh_token'),
        response: {
          body: {
            access_token: 'a_refreshed_token',
            expires_in: 3600,
            token_type: 'bearer',
            scope: 'scope1 scope2',
            refresh_token: 're_refresh_token',
          },
          status: 200,
        },
      })
      .mock({
        name: 'access_denied',
        matcher: (url, opts) =>
          url.match(/\/1$/) &&
          opts.headers.Authorization !== 'Bearer a_refreshed_token',
        response: {
          status: 401,
          body: {
            error: 'invalid_grant',
            error_description: 'The access token provided has expired.',
          },
        },
      })
      .mock({
        name: 'success',
        matcher: (url, opts) =>
          url.match(/\/1$/) &&
          opts.headers.Authorization === 'Bearer a_refreshed_token',
        response: {
          status: 200,
          body: {
            foofoo: 'barbarbar',
          },
        },
      });

    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });

    const storage = new MockStorage();

    const SomeInnerSdk = new RestClientSdk(
      new TokenStorage(tokenGenerator, storage),
      { path: 'api.me', scheme: 'https' },
      mapping
    );

    return SomeInnerSdk.tokenStorage
      .generateToken({
        username: 'foo',
        password: 'bar',
      })
      .then(() => SomeInnerSdk.getRepository('test').find(1))
      .then(() => {
        expect(
          fetchMock.lastOptions('access_denied').headers.Authorization
        ).toEqual('Bearer an_access_token');
        expect(fetchMock.lastOptions('success').headers.Authorization).toEqual(
          'Bearer a_refreshed_token'
        );
      });
  });

  test('check that the request done after refreshing a token contains the refreshed token, headers version', () => {
    const oauthHeaders = {
      'www-authenticate':
        'Bearer realm="Service", error="invalid_grant", error_description="The access token provided has expired."',
    };
    fetchMock
      .mock({
        name: 'generate_token',
        matcher: (url, opts) =>
          url === 'https://oauth.me' && opts.body._streams[7] === 'password',
        response: {
          body: {
            access_token: 'an_access_token',
            expires_in: 3600,
            token_type: 'bearer',
            scope: 'scope1 scope2',
            refresh_token: 'refresh_token',
          },
          status: 200,
        },
      })
      .mock({
        name: 'refresh_token',
        matcher: (url, opts) =>
          url === 'https://oauth.me' &&
          opts.body._streams[1].match('refresh_token'),
        response: {
          body: {
            access_token: 'a_refreshed_token',
            expires_in: 3600,
            token_type: 'bearer',
            scope: 'scope1 scope2',
            refresh_token: 're_refresh_token',
          },
          status: 200,
        },
      })
      .mock({
        name: 'access_denied',
        matcher: (url, opts) =>
          url.match(/\/1$/) &&
          opts.headers.Authorization !== 'Bearer a_refreshed_token',
        response: {
          status: 401,
          headers: oauthHeaders,
        },
      })
      .mock({
        name: 'success',
        matcher: (url, opts) =>
          url.match(/\/1$/) &&
          opts.headers.Authorization === 'Bearer a_refreshed_token',
        response: {
          status: 200,
          body: {
            foofoo: 'barbarbar',
          },
        },
      });

    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });

    const storage = new MockStorage();

    const SomeInnerSdk = new RestClientSdk(
      new TokenStorage(tokenGenerator, storage),
      { path: 'api.me', scheme: 'https' },
      mapping
    );

    return SomeInnerSdk.tokenStorage
      .generateToken({
        username: 'foo',
        password: 'bar',
      })
      .then(() => SomeInnerSdk.getRepository('test').find(1))
      .then(() => {
        expect(
          fetchMock.lastOptions('access_denied').headers.Authorization
        ).toEqual('Bearer an_access_token');
        expect(fetchMock.lastOptions('success').headers.Authorization).toEqual(
          'Bearer a_refreshed_token'
        );
      });
  });

  test('If the token is close to expiration, it should automatically refresh', () => {
    fetchMock
      .mock({
        name: 'generate_token',
        matcher: (url, opts) =>
          url === 'https://oauth.me' && opts.body._streams[7] === 'password',
        response: {
          body: {
            access_token: 'an_access_token',
            expires_in: -1,
            token_type: 'bearer',
            scope: 'scope1 scope2',
            refresh_token: 'refresh_token',
          },
          status: 200,
        },
      })
      .mock({
        name: 'refresh_token',
        matcher: (url, opts) =>
          url === 'https://oauth.me' &&
          opts.body._streams[1].match('refresh_token'),
        response: {
          body: {
            access_token: 'a_refreshed_token',
            expires_in: 3600,
            token_type: 'bearer',
            scope: 'scope1 scope2',
            refresh_token: 're_refresh_token',
          },
          status: 200,
        },
      })
      .mock({
        name: 'success',
        matcher: (url, opts) =>
          url.match(/\/1$/) &&
          opts.headers.Authorization === 'Bearer a_refreshed_token',
        response: {
          status: 200,
          body: {
            foofoo: 'barbarbar',
          },
        },
      });

    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });

    const storage = new MockStorage();

    const SomeInnerSdk = new RestClientSdk(
      new TokenStorage(tokenGenerator, storage),
      { path: 'api.me', scheme: 'https' },
      mapping
    );

    return SomeInnerSdk.tokenStorage
      .generateToken({
        username: 'foo',
        password: 'bar',
      })
      .then(() => SomeInnerSdk.getRepository('test').find(1))
      .then(() => {
        expect(fetchMock.lastOptions('success').headers.Authorization).toEqual(
          'Bearer a_refreshed_token'
        );
      });
  });
});

describe('Test unit of work', () => {
  let unitOfWorkSdk = null;

  beforeEach(() => {
    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });
    unitOfWorkSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https' },
      unitOfWorkMapping
    );
  });

  test('posting data with unit of work', () => {
    const cart = {
      '@id': '/v2/carts/1',
      status: null,
      cartItemList: [
        {
          '@id': null,
          quantity: 1,
          cart: null,
        },
      ],
    };

    fetchMock.mock(() => true, {});

    return unitOfWorkSdk
      .getRepository('carts')
      .create(cart)
      .then(() => {
        expect(fetchMock.lastOptions().body).toEqual(
          JSON.stringify({
            '@id': '/v2/carts/1',
            cartItemList: [
              {
                '@id': null,
                quantity: 1,
              },
            ],
          })
        );
      });
  });

  test('updating data with unit of work', async () => {
    fetchMock
      .mock({
        name: 'get_cart',
        matcher: 'end:/v12/carts/1',
        method: 'GET',
        response: JSON.stringify({
          '@id': '/v12/carts/1',
          status: null,
          cartItemList: [
            {
              '@id': null,
              quantity: 1,
              cart: null,
            },
          ],
        }),
      })
      .mock({
        name: 'put_cart',
        matcher: 'end:/v12/carts/1',
        method: 'PUT',
        response: JSON.stringify({
          '@id': '/v12/carts/1',
          status: 'foo',
          cartItemList: [
            {
              '@id': null,
              quantity: 1,
              cart: null,
            },
          ],
        }),
      });

    const repo = unitOfWorkSdk.getRepository('carts');
    const cart = await repo.find('/v12/carts/1');
    cart.status = 'foo';

    let updatedCart = await repo.update(cart);
    expect(fetchMock.lastOptions('put_cart').body).toEqual(
      JSON.stringify({ status: 'foo' })
    );

    updatedCart = await repo.update(cart);
    expect(fetchMock.lastOptions('put_cart').body).toEqual('{}');
  });

  test('updating partial data with unit of work', async () => {
    fetchMock
      .mock({
        name: 'get_cart',
        matcher: 'end:/v12/carts/1',
        method: 'GET',
        response: JSON.stringify({
          '@id': '/v12/carts/1',
          status: 'foo',
          cartItemList: [
            {
              '@id': null,
              quantity: 1,
              cart: null,
            },
          ],
        }),
      })
      .mock({
        name: 'put_cart',
        matcher: 'end:/v12/carts/1',
        method: 'PUT',
        response: JSON.stringify({
          '@id': '/v12/carts/1',
          status: null,
          cartItemList: [
            {
              '@id': null,
              quantity: 1,
              cart: null,
            },
          ],
        }),
      });

    const repo = unitOfWorkSdk.getRepository('carts');
    const cart = await repo.find('/v12/carts/1');

    await repo.update({ '@id': '/v12/carts/1', status: null });
    expect(fetchMock.lastOptions('put_cart').body).toEqual(
      JSON.stringify({ status: null })
    );
  });

  test('find all register', async () => {
    fetchMock
      .mock({
        name: 'get_carts',
        matcher: 'end:/v12/carts',
        method: 'GET',
        response: JSON.stringify([
          {
            '@id': '/v12/carts/1',
            status: 'foo',
            cartItemList: [
              {
                '@id': null,
                quantity: 1,
                cart: null,
              },
            ],
          },
        ]),
      })
      .mock({
        name: 'put_cart',
        matcher: 'end:/v12/carts/1',
        method: 'PUT',
        response: JSON.stringify({
          '@id': '/v12/carts/1',
          status: null,
          cartItemList: [
            {
              '@id': null,
              quantity: 1,
              cart: null,
            },
          ],
        }),
      });

    const repo = unitOfWorkSdk.getRepository('carts');
    const cartList = await repo.findAll();
    const cart = cartList[0];

    cart.status = 'bar';

    await repo.update(cart);
    expect(fetchMock.lastOptions('put_cart').body).toEqual(
      JSON.stringify({ status: 'bar' })
    );
  });

  test('find all with object as response', async () => {
    unitOfWorkSdk.serializer = new MemberSerializer();
    fetchMock
      .mock({
        name: 'get_carts',
        matcher: 'end:/v12/carts',
        method: 'GET',
        response: JSON.stringify({
          members: [
            {
              '@id': '/v12/carts/1',
              status: 'foo',
              phone_number: '01234',
              cartItemList: [
                {
                  '@id': null,
                  quantity: 1,
                  cart: null,
                },
              ],
            },
          ],
        }),
      })
      .mock({
        name: 'put_cart',
        matcher: 'end:/v12/carts/1',
        method: 'PUT',
        response: JSON.stringify({
          '@id': '/v12/carts/1',
          status: null,
          phone_number: '01234',
          cartItemList: [
            {
              '@id': null,
              quantity: 1,
              cart: null,
            },
          ],
        }),
      });

    const repo = unitOfWorkSdk.getRepository('carts');
    const cartList = await repo.findAll();
    const cart = cartList.members[0];

    cart.status = 'bar';

    await repo.update(cart);
    expect(fetchMock.lastOptions('put_cart').body).toEqual(
      JSON.stringify({ status: 'bar' })
    );
  });

  test('delete entity will clear the unit of work', async () => {
    fetchMock
      .mock({
        matcher: 'end:/v12/carts/1',
        method: 'DELETE',
        response: {
          status: 204,
          body: null,
        },
      })
      .mock({
        matcher: 'end:/v12/carts/1',
        method: 'GET',
        response: JSON.stringify({
          '@id': '/v12/carts/1',
          status: 'foo',
        }),
      });

    const repo = unitOfWorkSdk.getRepository('carts');
    const cart = await repo.find(1);

    expect(repo.sdk.unitOfWork.getDirtyEntity('/v12/carts/1')).toBeTruthy();

    const response = await repo.delete(cart);

    expect(response).not.toBeUndefined();
    expect(response.status).toEqual(204);
    expect(repo.sdk.unitOfWork.getDirtyEntity('/v12/carts/1')).toBeUndefined();
  });

  test('posting a many-to-one with only the id', async () => {
    fetchMock.mock({
      matcher: 'end:/v12/carts',
      method: 'POST',
      response: {
        status: 201,
        body: { '@id': '/v1/carts/3', order: '/v12/orders/1' },
      },
    });
    const cartToPost = {
      order: '/v12/orders/1',
    };

    const repo = unitOfWorkSdk.getRepository('carts');
    const cart = await repo.create(cartToPost);

    expect(cart.order).toEqual('/v12/orders/1');
    expect(fetchMock.lastOptions().body).toEqual(
      JSON.stringify({ order: '/v12/orders/1' })
    );
  });

  test('posting a many-to-one with an object', async () => {
    fetchMock.mock({
      matcher: 'end:/v12/carts',
      method: 'POST',
      response: {
        status: 201,
        body: { '@id': '/v1/carts/3', order: '/v12/orders/1' },
      },
    });
    const cartToPost = {
      order: {
        '@id': '/v12/orders/1',
        status: 'waiting',
        customerPaidAmount: null,
      },
    };

    const repo = unitOfWorkSdk.getRepository('carts');
    const cart = await repo.create(cartToPost);

    expect(fetchMock.lastOptions().body).toEqual(
      JSON.stringify({ order: { '@id': '/v12/orders/1', status: 'waiting' } })
    );
  });

  describe('Test unit of work with entity conversion', () => {
    class TestEntity {
      constructor(value) {
        this._value = value;
        this['@id'] = value['@id'];
      }

      set(key, value) {
        this._value[key] = value;
      }

      toJSON() {
        return this._value;
      }
    }

    class EntitySerializer extends Serializer {
      normalizeItem(entity) {
        return entity.toJSON();
      }

      encodeItem(entity) {
        return JSON.stringify(entity);
      }

      decodeItem(rawData) {
        return JSON.parse(rawData);
      }

      denormalizeItem(object) {
        return new TestEntity(object);
      }

      decodeList(rawData) {
        return JSON.parse(rawData);
      }
    }

    test('create an entity using an entity conversion', async () => {
      unitOfWorkSdk.serializer = new EntitySerializer();

      fetchMock
        .mock({
          matcher: 'end:/v12/carts/1',
          response: {
            status: 200,
            body: { '@id': '/v12/carts/1', status: 'payed' },
          },
        })
        .mock({
          matcher: 'end:/v12/carts',
          method: 'POST',
          response: {
            status: 201,
            body: { '@id': '/v12/carts/1', status: 'payed' },
          },
        });

      const cartToPost = new TestEntity({
        '@id': '/v12/carts/1',
        status: 'payed',
      });
      expect(cartToPost.toJSON()['@id']).toEqual('/v12/carts/1');
      expect(cartToPost.toJSON().status).toEqual('payed');

      const cartToPut = await unitOfWorkSdk
        .getRepository('carts')
        .create(cartToPost);

      expect(fetchMock.lastOptions().body).toEqual(
        JSON.stringify({
          '@id': '/v12/carts/1',
          status: 'payed',
        })
      );

      expect(cartToPut.toJSON()['@id']).toEqual('/v12/carts/1');
      expect(cartToPut.toJSON().status).toEqual('payed');

      cartToPut.set('status', 'refunded');

      const cart = await unitOfWorkSdk.getRepository('carts').update(cartToPut);

      expect(fetchMock.lastOptions().body).toEqual(
        JSON.stringify({
          status: 'refunded',
        })
      );
    });

    test('data not present in the API response', async () => {
      fetchMock.mock({
        matcher: 'end:/v12/carts/1',
        response: {
          status: 200,
          body: { '@id': '/v12/carts/1', status: 'payed' },
        },
      });

      const cart = await unitOfWorkSdk
        .getRepository('carts')
        .find('/v12/carts/1');

      expect(cart.status).toEqual('payed');

      cart.status = 'refunded';
      cart.data = null;

      unitOfWorkSdk.getRepository('carts').update(cart);
    });

    test('many-to-one relation with null value in newValue', async () => {
      fetchMock.mock({
        matcher: 'end:/v12/carts/1',
        response: {
          status: 200,
          body: { '@id': '/v12/carts/1', order: { '@id': '/v12/orders/1' } },
        },
      });

      const cart = await unitOfWorkSdk
        .getRepository('carts')
        .find('/v12/carts/1');

      expect(cart.order['@id']).toEqual('/v12/orders/1');

      cart.order = null;

      await unitOfWorkSdk.getRepository('carts').update(cart);
      expect(fetchMock.lastOptions().body).toEqual(
        JSON.stringify({
          order: null,
        })
      );
    });

    test('one-to-many with objects as old model and string as new model', async () => {
      fetchMock.mock({
        matcher: 'end:/v12/carts/1',
        response: {
          status: 200,
          body: {
            '@id': '/v12/carts/1',
            cartItemList: [
              { '@id': '/v12/cart_items/1' },
              { '@id': '/v12/cart_items/2' },
            ],
          },
        },
      });

      const cart = await unitOfWorkSdk
        .getRepository('carts')
        .find('/v12/carts/1');

      cart.cartItemList = ['/v1/cart_items/2'];

      await unitOfWorkSdk.getRepository('carts').update(cart);
      expect(fetchMock.lastOptions().body).toEqual(
        JSON.stringify({
          cartItemList: ['/v1/cart_items/2'],
        })
      );
    });
  });
});
