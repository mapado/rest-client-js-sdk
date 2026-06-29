/* eslint-disable no-underscore-dangle */
import { fetchMock, getInputUrl } from 'metch-fock';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import MemberSerializer from '../../__mocks__/memberSerializer';
import MockStorage from '../../__mocks__/mockStorage';
import tokenStorageMock from '../../__mocks__/tokenStorage';
import unitOfWorkMapping from '../../__mocks__/unitOfWorkMapping';
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
} from '../../src/index';

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
    return { ...item, customName: `${item.name}${item.name}` };
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
  { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
  mapping
);
SomeSdk.tokenStorage.generateToken();

describe('Test Client', () => {
  test('handle find query', async () => {
    const getResponse = () =>
      new Response(JSON.stringify({ '@id': '/v2/test/8' }));

    fetchMock.get('https://api.me/v2/test/8', getResponse());
    await SomeSdk.getRepository('test').find(8);

    fetchMock.get('https://api.me/v2/test/8?q=test&foo=bar', getResponse());
    await SomeSdk.getRepository('test').find(8, { q: 'test', foo: 'bar' });

    fetchMock.get(
      'https://api.me/v2/def_param/8?_groups=test_read%2Ctest_write&dp=df',
      getResponse()
    );
    await SomeSdk.getRepository('defParam').find(8);

    fetchMock.get(
      'https://api.me/v2/def_param/8?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df',
      getResponse()
    );
    await SomeSdk.getRepository('defParam').find(8, { q: 'test', foo: 'bar' });
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
        expires_at: null,
      }),
    ];

    const getTokenPromiseList = [
      someStorage.getItem('rest_client_sdk.api.access_token'),
      someOtherStorage.getItem('my-custom-token-key'),
    ];

    return Promise.all(storeTokensPromiseList).then(() => {
      return Promise.all(getTokenPromiseList).then((values) => {
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

  test('handle findBy query', async () => {
    const listResponse = () =>
      new Response(JSON.stringify([{ '@id': '/v2/tests/8' }]));

    fetchMock.get('https://api.me/v2/test?q=test&foo=bar', listResponse());
    await SomeSdk.getRepository('test').findBy({ q: 'test', foo: 'bar' });

    fetchMock.get(
      'https://api.me/v2/def_param?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df',
      listResponse()
    );
    await SomeSdk.getRepository('defParam').findBy({ q: 'test', foo: 'bar' });
  });

  test('handle findAll query', async () => {
    const listResponse = () =>
      new Response(JSON.stringify([{ '@id': '/v2/test/8' }]));

    fetchMock.get('https://api.me/v2/test', listResponse());
    await SomeSdk.getRepository('test').findAll();

    fetchMock.get(
      'https://api.me/v2/def_param?_groups=test_read%2Ctest_write&dp=df',
      listResponse()
    );
    await SomeSdk.getRepository('defParam').findAll();
  });

  test('handle entityFactory', () => {
    fetchMock.get(
      'https://api.me/v2/test/8',
      new Response(JSON.stringify({ '@id': '/v2/test/8', name: 'foo' }))
    );

    return SomeSdk.getRepository('test')
      .find(8)
      .then((item) =>
        Promise.all([
          expect(typeof item).toBe('object'),
          expect(item.name).toBe('foo'),
          expect(item.customName).toBeUndefined(),
        ])
      );
  });

  test('handle entityFactory with a custom serializer', async () => {
    const EntityFactorySdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      mapping,
      new WeirdSerializer()
    );

    fetchMock.get(
      'https://api.me/v2/test/8',
      new Response(JSON.stringify({ '@id': '/v2/test/8', name: 'foo' }))
    );
    const item = await EntityFactorySdk.getRepository('test').find(8);
    expect(typeof item).toBe('object');
    expect(item.name).toBe('foo');
    expect(item.customName).toBe('foofoo');

    fetchMock.get(
      'https://api.me/v2/test',
      new Response(
        JSON.stringify([
          { '@id': '/v2/test/8', name: 'foo' },
          { '@id': '/v2/test/9', name: 'bar' },
        ])
      )
    );
    const itemList = await EntityFactorySdk.getRepository('test').findAll();
    expect(Array.isArray(itemList)).toBe(true);
    expect(itemList[0].name).toBe('foo');
    expect(itemList[0].customName).toBe('foofoo');
  });

  test('handle getPathBase with custom path parameters', async () => {
    const SomeSdkNoPrefix = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      mappingNoPrefix
    );

    fetchMock.get(
      'https://api.me/foo/8',
      new Response(JSON.stringify({ '@id': '/v2/tests/8' }))
    );
    await SomeSdkNoPrefix.getRepository('test').find(8, {}, { basePath: '/foo' });

    fetchMock.get(
      'https://api.me/foo?q=test&foo=bar',
      new Response(JSON.stringify([{ '@id': '/v2/tests/8' }]))
    );
    await SomeSdkNoPrefix.getRepository('test').findBy(
      { q: 'test', foo: 'bar' },
      { basePath: '/foo' }
    );

    fetchMock.get(
      'https://api.me/foo',
      new Response(JSON.stringify([{ '@id': '/v2/tests/8' }]))
    );
    await SomeSdkNoPrefix.getRepository('test').findAll({}, { basePath: '/foo' });
  });

  test('handle Authorization header', async () => {
    const BasicAuthSdk = new RestClientSdk(
      tokenStorageMock,
      {
        path: 'api.me',
        scheme: 'https',
        authorizationType: 'Basic',
        unitOfWorkEnabled: true,
      },
      mapping
    );
    BasicAuthSdk.tokenStorage.generateToken();

    fetchMock((input, options) => {
      expect(options.headers.Authorization).toContain('Bearer ');
      return true;
    }, new Response(JSON.stringify({ '@id': '/v2/test/8' })));
    await SomeSdk.getRepository('test').find(8);

    fetchMock((input, options) => {
      expect(options.headers.Authorization).toContain('Basic ');
      return true;
    }, new Response(JSON.stringify({ '@id': '/v2/test/8' })));
    await BasicAuthSdk.getRepository('test').find(8);
  });

  test('Sdk with no tokenStorage should not add Authorization header', async () => {
    fetchMock((input, options) => {
      expect(options.headers.Authorization).toBe(undefined);
      return true;
    }, new Response(JSON.stringify({ '@id': '/v2/test/8' })));

    const NoAuthSdk = new RestClientSdk(
      null,
      {
        path: 'api.me',
        scheme: 'https',
        authorizationType: 'Basic',
        unitOfWorkEnabled: true,
      },
      mapping
    );

    const json = await NoAuthSdk.getRepository('test').find(8);
    expect(json).toEqual({ '@id': '/v2/test/8' });
  });
});

describe('Test errors', () => {
  test('handle 401 and 403 errors', async () => {
    fetchMock.get(/\/400$/, new Response(null, { status: 400 }));
    await expect(
      SomeSdk.getRepository('test').find(400)
    ).rejects.toBeInstanceOf(errors.BadRequestError);

    fetchMock.get(/\/401$/, new Response(null, { status: 401 }));
    await expect(
      SomeSdk.getRepository('test').find(401)
    ).rejects.toBeInstanceOf(errors.UnauthorizedError);

    fetchMock.get(/\/403$/, new Response(null, { status: 403 }));
    await expect(
      SomeSdk.getRepository('test').find(403)
    ).rejects.toBeInstanceOf(errors.ForbiddenError);

    fetchMock.get(/\/404$/, new Response(null, { status: 404 }));
    await expect(
      SomeSdk.getRepository('test').find(404)
    ).rejects.toBeInstanceOf(errors.ResourceNotFoundError);

    fetchMock.get(/\/404$/, new Response(null, { status: 404 }));
    await expect(
      SomeSdk.getRepository('test').find(404)
    ).rejects.toBeInstanceOf(errors.BadRequestError);

    fetchMock.get(/\/410$/, new Response(null, { status: 410 }));
    await expect(
      SomeSdk.getRepository('test').find(410)
    ).rejects.toBeInstanceOf(errors.BadRequestError);

    fetchMock.get(/\/500$/, new Response(null, { status: 500 }));
    await expect(
      SomeSdk.getRepository('test').find(500)
    ).rejects.toBeInstanceOf(errors.InternalServerError);
  });
});

describe('Update and delete function trigger the good urls', () => {
  test('handle updating and deleting entities with @ids', async () => {
    const data = {
      '@id': '/v2/test/8',
      foo: 'foo',
    };

    const dataNoArobase = {
      id: 9,
      foo: 'foo',
    };

    const putResponse = () =>
      new Response(JSON.stringify({ '@id': '/v2/test/8', foo: 'bar' }));

    fetchMock.put('https://api.me/v2/test/8', putResponse());
    await SomeSdk.getRepository('test').update(data);

    fetchMock.put('https://api.me/v2/no-at-id/9', putResponse());
    await SomeSdk.getRepository('noAtId').update(dataNoArobase);
  });
});
describe('Fix bugs', () => {
  test('generate good url', () => {
    const SomeInnerSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      mapping
    );
    SomeInnerSdk.tokenStorage.generateToken();

    expect(
      SomeInnerSdk.getRepository('test').makeUri('foo').toString()
    ).toEqual('https://api.me/v2/foo');
  });

  test('generate good url when sdk mapping idPrefix contains long path', () => {
    const longPathMapping = new Mapping('/api/v2');
    longPathMapping.setMapping([testMetadata, defParamMetadata, noAtIdMetadata]);
    mappingNoPrefix.setMapping([testMetadata, defParamMetadata, noAtIdMetadata]);

    const SomeInnerSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      longPathMapping
    );
    SomeInnerSdk.tokenStorage.generateToken();

    expect(
      SomeInnerSdk.getRepository('test').makeUri('/api/v2/foo').toString()
    ).toEqual('https://api.me/api/v2/foo');
  });

  test('allow base header override', async () => {
    fetchMock((input, options) => {
      expect(options.headers['Content-Type']).toEqual('multipart/form-data');
      return true;
    }, new Response(JSON.stringify({ '@id': '/v2/test/8', foo: 'bar' })));

    await SomeSdk.getRepository('test').authorizedFetch('foo', {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  test('allow removing base header', async () => {
    fetchMock((input, options) => {
      expect(Object.keys(options.headers)).toEqual([
        'Authorization',
        'bar',
        'baz',
        'bad',
      ]);
      return true;
    }, new Response(JSON.stringify({ '@id': '/v2/test/8', foo: 'bar' })));

    await SomeSdk.getRepository('test').authorizedFetch('foo', {
      headers: {
        'Content-Type': undefined,
        foo: undefined,
        bar: null,
        baz: '',
        bad: 0,
      },
    });
  });

  test('allow passing request params in find', async () => {
    fetchMock((input, options) => {
      expect(options.headers.foo).toEqual('bar');
      return true;
    }, new Response(JSON.stringify({ '@id': '/v2/test/8', foo: 'bar' })));

    await SomeSdk.getRepository('test').find(
      '/v2/test/8',
      {},
      {},
      { headers: { foo: 'bar' } }
    );
  });

  test('allow passing request params in findBy', async () => {
    fetchMock((input, options) => {
      expect(options.headers.foo).toEqual('bar');
      return true;
    }, new Response(JSON.stringify([{ '@id': '/v2/test/8', foo: 'bar' }])));

    await SomeSdk.getRepository('test').findBy(
      { id: '/v2/test/8' },
      {},
      { headers: { foo: 'bar' } }
    );
  });

  test('allow passing request params in findAll', async () => {
    fetchMock((input, options) => {
      expect(options.headers.foo).toEqual('bar');
      return true;
    }, new Response(JSON.stringify([{ '@id': '/v2/test/8', foo: 'bar' }])));

    await SomeSdk.getRepository('test').findAll(
      { id: '/v2/test/8' },
      {},
      { headers: { foo: 'bar' } }
    );
  });

  test('allow passing request params in create', async () => {
    const testEntity = {
      '@id': '/v2/tests/1',
    };

    fetchMock((input, options) => {
      expect(options.headers.foo).toEqual('bar');
      return true;
    }, new Response(JSON.stringify({})));

    await SomeSdk.getRepository('test').create(
      testEntity,
      {},
      {},
      { headers: { foo: 'bar' } }
    );
  });

  test('allow passing request params in update', async () => {
    const testEntity = {
      '@id': '/v2/tests/1',
    };

    fetchMock((input, options) => {
      expect(options.headers.foo).toEqual('bar');
      return true;
    }, new Response(JSON.stringify({})));

    await SomeSdk.getRepository('test').update(
      testEntity,
      {},
      { headers: { foo: 'bar' } }
    );
  });

  test('allow passing request params in patch', async () => {
    const testEntity = {
      '@id': '/v2/tests/1',
    };

    fetchMock((input, options) => {
      expect(options.headers.foo).toEqual('bar');
      expect(options.method).toEqual('PATCH');
      return true;
    }, new Response(JSON.stringify({})));

    await SomeSdk.getRepository('test').patch(
      testEntity,
      {},
      { headers: { foo: 'bar' } }
    );
  });

  test('allow passing request params in delete', async () => {
    fetchMock((input, options) => {
      expect(options.headers.foo).toEqual('bar');
      return true;
    }, new Response(JSON.stringify({})));
    const testEntity = {
      '@id': '/v2/tests/1',
    };

    await SomeSdk.getRepository('test').delete(testEntity, {
      headers: { foo: 'bar' },
    });
  });

  test('allow overriding request params', async () => {
    fetchMock((input, options) => {
      expect(options.method).toEqual('POST');
      return true;
    }, new Response(JSON.stringify({ '@id': '/v2/test/8', foo: 'bar' })));

    await SomeSdk.getRepository('test').find(
      '/v2/test/8',
      {},
      {},
      { method: 'POST' }
    );
  });

  test('check that the request done after refreshing a token contains the refreshed token', async () => {
    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body).get('grant_type') === 'password',
      new Response(
        JSON.stringify({
          access_token: 'an_access_token',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'scope1 scope2',
          refresh_token: 'refresh_token',
        })
      )
    );
    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body || '').get('refresh_token') ===
          'refresh_token',
      new Response(
        JSON.stringify({
          access_token: 'a_refreshed_token',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'scope1 scope2',
          refresh_token: 're_refresh_token',
        })
      )
    );
    // the first request to the entity is done with the (still valid) access
    // token, and gets rejected
    fetchMock((input, options) => {
      if (
        !getInputUrl(input).match(/\/1$/) ||
        options.headers.Authorization === 'Bearer a_refreshed_token'
      ) {
        return false;
      }
      expect(options.headers.Authorization).toEqual('Bearer an_access_token');
      return true;
    }, new Response(JSON.stringify({ error: 'access_denied', error_description: 'The access token provided has expired.' }), { status: 401 }));
    // the request is retried with the refreshed token
    fetchMock((input, options) => {
      if (
        !getInputUrl(input).match(/\/1$/) ||
        options.headers.Authorization !== 'Bearer a_refreshed_token'
      ) {
        return false;
      }
      expect(options.headers.Authorization).toEqual('Bearer a_refreshed_token');
      return true;
    }, new Response(JSON.stringify({ foofoo: 'barbarbar' }), { status: 200 }));

    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });

    const storage = new MockStorage();

    const SomeInnerSdk = new RestClientSdk(
      new TokenStorage(tokenGenerator, storage),
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      mapping
    );

    await SomeInnerSdk.tokenStorage.generateToken({
      username: 'foo',
      password: 'bar',
    });
    await SomeInnerSdk.getRepository('test').find(1);
  });

  test('check that the request done after refreshing a token contains the refreshed token, headers version', async () => {
    const oauthHeaders = {
      'www-authenticate':
        'Bearer realm="Service", error="invalid_grant", error_description="The access token provided has expired."',
    };

    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body).get('grant_type') === 'password',
      new Response(
        JSON.stringify({
          access_token: 'an_access_token',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'scope1 scope2',
          refresh_token: 'refresh_token',
        })
      )
    );
    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body).get('refresh_token') ===
          'refresh_token',
      new Response(
        JSON.stringify({
          access_token: 'a_refreshed_token',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'scope1 scope2',
          refresh_token: 're_refresh_token',
        })
      )
    );
    fetchMock((input, options) => {
      if (
        !getInputUrl(input).match(/\/1$/) ||
        options.headers.Authorization === 'Bearer a_refreshed_token'
      ) {
        return false;
      }
      expect(options.headers.Authorization).toEqual('Bearer an_access_token');
      return true;
    }, new Response(null, { status: 401, headers: oauthHeaders }));
    fetchMock((input, options) => {
      if (
        !getInputUrl(input).match(/\/1$/) ||
        options.headers.Authorization !== 'Bearer a_refreshed_token'
      ) {
        return false;
      }
      expect(options.headers.Authorization).toEqual('Bearer a_refreshed_token');
      return true;
    }, new Response(JSON.stringify({ foofoo: 'barbarbar' }), { status: 200 }));

    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });

    const storage = new MockStorage();

    const SomeInnerSdk = new RestClientSdk(
      new TokenStorage(tokenGenerator, storage),
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      mapping
    );

    await SomeInnerSdk.tokenStorage.generateToken({
      username: 'foo',
      password: 'bar',
    });
    await SomeInnerSdk.getRepository('test').find(1);
  });

  test('If the token is close to expiration, it should automatically refresh', async () => {
    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body).get('grant_type') === 'password',
      new Response(
        JSON.stringify({
          access_token: 'an_access_token',
          expires_in: -1,
          token_type: 'bearer',
          scope: 'scope1 scope2',
          refresh_token: 'refresh_token',
        })
      )
    );
    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body).get('refresh_token') ===
          'refresh_token',
      new Response(
        JSON.stringify({
          access_token: 'a_refreshed_token',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'scope1 scope2',
          refresh_token: 're_refresh_token',
        })
      )
    );
    fetchMock((input, options) => {
      if (
        !getInputUrl(input).match(/\/1$/) ||
        options.headers.Authorization !== 'Bearer a_refreshed_token'
      ) {
        return false;
      }
      expect(options.headers.Authorization).toEqual('Bearer a_refreshed_token');
      return true;
    }, new Response(JSON.stringify({ foofoo: 'barbarbar' }), { status: 200 }));

    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });

    const storage = new MockStorage();

    const SomeInnerSdk = new RestClientSdk(
      new TokenStorage(tokenGenerator, storage),
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      mapping
    );

    await SomeInnerSdk.tokenStorage.generateToken({
      username: 'foo',
      password: 'bar',
    });
    await SomeInnerSdk.getRepository('test').find(1);
  });

  test('If a refresh token fail, we should call the `onRefreshTokenFailure` callback', async () => {
    const onRefreshTokenFailure = vi.fn(() => {});

    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body).get('grant_type') === 'password',
      new Response(
        JSON.stringify({
          access_token: 'an_access_token',
          expires_in: 3600,
          token_type: 'bearer',
          scope: 'scope1 scope2',
          refresh_token: 'refresh_token',
        })
      )
    );
    fetchMock(
      (input, options) =>
        getInputUrl(input) === 'https://oauth.me/' &&
        new URLSearchParams(options.body || '').get('refresh_token') ===
          'refresh_token',
      new Response(
        JSON.stringify({
          error: 'invalid_grant',
          error_description: 'The refresh token is invalid.',
          hint: 'Token has been revoked',
          message: 'The refresh token is invalid.',
        }),
        { status: 401 }
      )
    );
    fetchMock(
      (input) => Boolean(getInputUrl(input).match(/test\/1$/)),
      new Response(JSON.stringify({ error: 'access_denied', error_description: 'The access token provided has expired.' }), { status: 401 })
    );

    const tokenGenerator = new PasswordGenerator({
      path: 'oauth.me',
      scheme: 'https',
      clientId: 'clientId',
      clientSecret: 'clientSecret',
    });

    const storage = new MockStorage();

    const SomeInnerSdk = new RestClientSdk(
      new TokenStorage(tokenGenerator, storage),
      {
        path: 'api.me',
        scheme: 'https',
        unitOfWorkEnabled: true,
        onRefreshTokenFailure,
      },
      mapping
    );

    await SomeInnerSdk.tokenStorage.generateToken({
      username: 'foo',
      password: 'bar',
    });

    await SomeInnerSdk.getRepository('test')
      .find(1)
      .catch(() => {
        expect(onRefreshTokenFailure).toHaveBeenCalled();
      });
  });
});

describe('Test unit of work', () => {
  let unitOfWorkSdk = null;

  beforeEach(() => {
    unitOfWorkSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      unitOfWorkMapping
    );
  });

  test('posting data with unit of work', async () => {
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

    fetchMock((input, options) => {
      expect(options.body).toEqual(
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
      return true;
    }, new Response(JSON.stringify({})));

    await unitOfWorkSdk.getRepository('carts').create(cart);
  });

  test('creating an entity with disabled unit of work should not register it', async () => {
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

    fetchMock(() => true, new Response(JSON.stringify({})));

    const mockedRegisterClean = vi.fn();
    unitOfWorkSdk.unitOfWork.registerClean = mockedRegisterClean;

    await unitOfWorkSdk
      .getRepository('carts')
      .withUnitOfWork(false)
      .create(cart);

    expect(mockedRegisterClean.mock.calls.length).toBe(0);
  });

  test('Test creating entity with globally disabled unit of work', async () => {
    const withoutUnitOfWorkSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: false },
      unitOfWorkMapping
    );

    fetchMock(() => true, new Response(JSON.stringify({})));

    const mockedRegisterClean = vi.fn();
    withoutUnitOfWorkSdk.unitOfWork.registerClean = mockedRegisterClean;

    await withoutUnitOfWorkSdk.getRepository('carts').create({});

    expect(mockedRegisterClean.mock.calls.length).toBe(0);
  });

  test('updating data with unit of work', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    fetchMock.get.endsWith(
      '/v12/carts/1',
      new Response(
        JSON.stringify({
          '@id': '/v12/carts/1',
          status: null,
          cartItemList: [{ '@id': null, quantity: 1, cart: null }],
        })
      )
    );
    const cart = await repo.find('/v12/carts/1');
    cart.status = 'foo';

    const putResponse = () =>
      new Response(
        JSON.stringify({
          '@id': '/v12/carts/1',
          status: 'foo',
          cartItemList: [{ '@id': null, quantity: 1, cart: null }],
        })
      );
    const assertPutBody = (expectedBody) => (input, options) => {
      if (options.method !== 'PUT') {
        return false;
      }
      expect(options.body).toEqual(expectedBody);
      return true;
    };

    fetchMock(assertPutBody(JSON.stringify({ status: 'foo' })), putResponse());
    await repo.update(cart);

    fetchMock(assertPutBody('{}'), putResponse());
    await repo.update(cart);
  });

  test('patching data with unit of work', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    fetchMock.get.endsWith(
      '/v12/carts/1',
      new Response(
        JSON.stringify({
          '@id': '/v12/carts/1',
          status: null,
          cartItemList: [{ '@id': null, quantity: 1, cart: null }],
        })
      )
    );
    const cart = await repo.find('/v12/carts/1');
    cart.status = 'foo';

    const patchResponse = () =>
      new Response(
        JSON.stringify({
          '@id': '/v12/carts/1',
          status: 'foo',
          cartItemList: [{ '@id': null, quantity: 1, cart: null }],
        })
      );
    const assertPatchBody = (expectedBody) => (input, options) => {
      if (options.method !== 'PATCH') {
        return false;
      }
      expect(options.method).toEqual('PATCH');
      expect(options.body).toEqual(expectedBody);
      return true;
    };

    fetchMock(
      assertPatchBody(JSON.stringify({ status: 'foo' })),
      patchResponse()
    );
    await repo.patch(cart);

    fetchMock(assertPatchBody('{}'), patchResponse());
    await repo.patch(cart);
  });

  test('updating partial data with unit of work', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    fetchMock.get.endsWith(
      '/v12/carts/1',
      new Response(
        JSON.stringify({
          '@id': '/v12/carts/1',
          status: 'foo',
          cartItemList: [{ '@id': null, quantity: 1, cart: null }],
        })
      )
    );
    await repo.find('/v12/carts/1');

    fetchMock((input, options) => {
      if (options.method !== 'PUT') {
        return false;
      }
      expect(options.body).toEqual(JSON.stringify({ status: null }));
      return true;
    }, new Response(JSON.stringify({
      '@id': '/v12/carts/1',
      status: null,
      cartItemList: [{ '@id': null, quantity: 1, cart: null }],
    })));

    await repo.update({ '@id': '/v12/carts/1', status: null });
  });

  test('deactivating the unit of work should not register fetched entity', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    const mockedRegisterClean = vi.fn();
    unitOfWorkSdk.unitOfWork.registerClean = mockedRegisterClean;

    fetchMock.get.endsWith(
      '/v12/carts/1',
      new Response(
        JSON.stringify({
          '@id': '/v12/carts/1',
          status: null,
          cartItemList: [{ '@id': null, quantity: 1, cart: null }],
        })
      )
    );
    const cart = await repo.find('/v12/carts/1');
    expect(mockedRegisterClean.mock.calls.length).toBe(1);

    expect(mockedRegisterClean.mock.calls[0][0]).toBe('/v12/carts/1');
    expect(mockedRegisterClean.mock.calls[0][1]).toBe(cart);

    cart.status = 'bar';

    const putResponse = () =>
      new Response(JSON.stringify({ '@id': '/v12/carts/1' }));

    fetchMock((input, options) => options.method === 'PUT', putResponse());
    await repo.withUnitOfWork(false).update(cart);

    // the number of call to registerClean should not have changed here
    expect(mockedRegisterClean.mock.calls.length).toBe(1);

    fetchMock((input, options) => options.method === 'PUT', putResponse());
    const updatedCart = await repo.update(cart);

    expect(mockedRegisterClean.mock.calls.length).toBe(2);

    expect(mockedRegisterClean.mock.calls[1][0]).toBe('/v12/carts/1');
    expect(mockedRegisterClean.mock.calls[1][1]).toBe(updatedCart);
  });

  test('find all register', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    fetchMock.get.endsWith(
      '/v12/carts',
      new Response(
        JSON.stringify([
          {
            '@id': '/v12/carts/1',
            status: 'foo',
            cartItemList: [{ '@id': null, quantity: 1, cart: null }],
          },
        ])
      )
    );
    const cartList = await repo.findAll();
    const cart = cartList[0];

    cart.status = 'bar';

    fetchMock((input, options) => {
      if (options.method !== 'PUT') {
        return false;
      }
      expect(options.body).toEqual(JSON.stringify({ status: 'bar' }));
      return true;
    }, new Response(JSON.stringify({
      '@id': '/v12/carts/1',
      status: null,
      cartItemList: [{ '@id': null, quantity: 1, cart: null }],
    })));

    await repo.update(cart);
  });

  test('deactivating the unit of work should not register once', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    const mockedRegisterClean = vi.fn();
    unitOfWorkSdk.unitOfWork.registerClean = mockedRegisterClean;

    const listResponse = () =>
      new Response(
        JSON.stringify([
          {
            '@id': '/v12/carts/1',
            status: 'foo',
            cartItemList: [{ '@id': null, quantity: 1, cart: null }],
          },
        ])
      );

    fetchMock.get.endsWith('/v12/carts', listResponse());
    await repo.findAll();
    expect(mockedRegisterClean.mock.calls.length).toBe(1);

    fetchMock.get.endsWith('/v12/carts', listResponse());
    await repo.withUnitOfWork(false).findAll();
    expect(mockedRegisterClean.mock.calls.length).toBe(1);

    fetchMock.get.endsWith('/v12/carts', listResponse());
    await repo.findAll();
    expect(mockedRegisterClean.mock.calls.length).toBe(2);
  });

  test('withUnitOfWork should return different instance', () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    expect(repo.withUnitOfWork(false)).not.toBe(repo);
  });

  test('withUnitOfWork should the same subtype as getRepository', () => {
    const innerMapping = new Mapping('/v2');
    const someMetadata = new ClassMetadata('test', 'test', SomeTestClient);
    someMetadata.setAttributeList([
      new Attribute('@id', '@id', 'string', true),
    ]);
    innerMapping.setMapping([someMetadata]);

    const innerSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', unitOfWorkEnabled: true },
      innerMapping
    );
    innerSdk.tokenStorage.generateToken();

    const repo = innerSdk.getRepository('test');

    expect(repo).toBeInstanceOf(SomeTestClient);
    expect(repo.withUnitOfWork(false)).toBeInstanceOf(SomeTestClient);
    expect(repo.withUnitOfWork(false)).not.toBe(repo);
  });

  test('find all with object as response', async () => {
    unitOfWorkSdk.serializer = new MemberSerializer();
    const repo = unitOfWorkSdk.getRepository('carts');

    fetchMock.get.endsWith(
      '/v12/carts',
      new Response(
        JSON.stringify({
          members: [
            {
              '@id': '/v12/carts/1',
              status: 'foo',
              phone_number: '01234',
              cartItemList: [{ '@id': null, quantity: 1, cart: null }],
            },
          ],
        })
      )
    );
    const cartList = await repo.findAll();
    const cart = cartList.members[0];

    cart.status = 'bar';

    fetchMock((input, options) => {
      if (options.method !== 'PUT') {
        return false;
      }
      expect(options.body).toEqual(JSON.stringify({ status: 'bar' }));
      return true;
    }, new Response(JSON.stringify({
      '@id': '/v12/carts/1',
      status: null,
      phone_number: '01234',
      cartItemList: [{ '@id': null, quantity: 1, cart: null }],
    })));

    await repo.update(cart);
  });

  test('delete entity will clear the unit of work', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    fetchMock.get.endsWith(
      '/v12/carts/1',
      new Response(JSON.stringify({ '@id': '/v12/carts/1', status: 'foo' }))
    );
    const cart = await repo.find(1);

    expect(repo.sdk.unitOfWork.getDirtyEntity('/v12/carts/1')).toBeTruthy();

    fetchMock(
      (input, options) => options.method === 'DELETE',
      new Response(null, { status: 204 })
    );
    const response = await repo.delete(cart);

    expect(response).not.toBeUndefined();
    expect(response.status).toEqual(204);
    expect(repo.sdk.unitOfWork.getDirtyEntity('/v12/carts/1')).toBeUndefined();
  });

  test('delete entity with a disabled unit of work should still clear the unit of work', async () => {
    const repo = unitOfWorkSdk.getRepository('carts');

    fetchMock.get.endsWith(
      '/v12/carts/1',
      new Response(JSON.stringify({ '@id': '/v12/carts/1', status: 'foo' }))
    );
    const cart = await repo.find(1);

    expect(repo.sdk.unitOfWork.getDirtyEntity('/v12/carts/1')).toBeTruthy();

    fetchMock(
      (input, options) => options.method === 'DELETE',
      new Response(null, { status: 204 })
    );
    const response = await repo.withUnitOfWork(false).delete(cart);

    expect(response).not.toBeUndefined();
    expect(response.status).toEqual(204);
    expect(repo.sdk.unitOfWork.getDirtyEntity('/v12/carts/1')).toBeUndefined();
  });

  test('posting a many-to-one with only the id', async () => {
    fetchMock((input, options) => {
      if (options.method !== 'POST') {
        return false;
      }
      expect(options.body).toEqual(JSON.stringify({ order: '/v12/orders/1' }));
      return true;
    }, new Response(JSON.stringify({ '@id': '/v1/carts/3', order: '/v12/orders/1' }), { status: 201 }));
    const cartToPost = {
      order: '/v12/orders/1',
    };

    const repo = unitOfWorkSdk.getRepository('carts');
    const cart = await repo.create(cartToPost);

    expect(cart.order).toEqual('/v12/orders/1');
  });

  test('posting a many-to-one with an object', async () => {
    fetchMock((input, options) => {
      if (options.method !== 'POST') {
        return false;
      }
      expect(options.body).toEqual(
        JSON.stringify({ order: { '@id': '/v12/orders/1', status: 'waiting' } })
      );
      return true;
    }, new Response(JSON.stringify({ '@id': '/v1/carts/3', order: '/v12/orders/1' }), { status: 201 }));
    const cartToPost = {
      order: {
        '@id': '/v12/orders/1',
        status: 'waiting',
        customerPaidAmount: null,
      },
    };

    const repo = unitOfWorkSdk.getRepository('carts');
    await repo.create(cartToPost);
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

      const assertBody = (method, expectedBody) => (input, options) => {
        if (options.method !== method) {
          return false;
        }
        expect(options.body).toEqual(expectedBody);
        return true;
      };

      fetchMock(
        assertBody(
          'POST',
          JSON.stringify({ '@id': '/v12/carts/1', status: 'payed' })
        ),
        new Response(JSON.stringify({ '@id': '/v12/carts/1', status: 'payed' }), {
          status: 201,
        })
      );

      const cartToPost = new TestEntity({
        '@id': '/v12/carts/1',
        status: 'payed',
      });
      expect(cartToPost.toJSON()['@id']).toEqual('/v12/carts/1');
      expect(cartToPost.toJSON().status).toEqual('payed');

      const cartToPut = await unitOfWorkSdk
        .getRepository('carts')
        .create(cartToPost);

      expect(cartToPut.toJSON()['@id']).toEqual('/v12/carts/1');
      expect(cartToPut.toJSON().status).toEqual('payed');

      cartToPut.set('status', 'refunded');

      fetchMock(
        assertBody('PUT', JSON.stringify({ status: 'refunded' })),
        new Response(JSON.stringify({ '@id': '/v12/carts/1', status: 'payed' }), {
          status: 200,
        })
      );
      await unitOfWorkSdk.getRepository('carts').update(cartToPut);
    });

    test('data not present in the API response', async () => {
      fetchMock.get.endsWith(
        '/v12/carts/1',
        new Response(
          JSON.stringify({ '@id': '/v12/carts/1', status: 'payed' }),
          { status: 200 }
        )
      );

      const cart = await unitOfWorkSdk
        .getRepository('carts')
        .find('/v12/carts/1');

      expect(cart.status).toEqual('payed');

      cart.status = 'refunded';
      cart.data = null;

      fetchMock((input, options) => {
        if (options.method !== 'PUT') {
          return false;
        }
        expect(options.body).toEqual(
          JSON.stringify({
            status: 'refunded',
            data: null,
          })
        );
        return true;
      }, new Response(JSON.stringify({
        '@id': '/v12/carts/1',
        status: 'foo',
        cartItemList: [{ '@id': '/v12/carts/1', status: 'refunded', data: null }],
      }), { status: 200 }));

      await unitOfWorkSdk.getRepository('carts').update(cart);
    });

    test('many-to-one relation with null value in newValue', async () => {
      fetchMock.get.endsWith(
        '/v12/carts/1',
        new Response(
          JSON.stringify({
            '@id': '/v12/carts/1',
            order: { '@id': '/v12/orders/1' },
          }),
          { status: 200 }
        )
      );

      const cart = await unitOfWorkSdk
        .getRepository('carts')
        .find('/v12/carts/1');

      expect(cart.order['@id']).toEqual('/v12/orders/1');

      cart.order = null;

      fetchMock((input, options) => {
        if (options.method !== 'PUT') {
          return false;
        }
        expect(options.body).toEqual(
          JSON.stringify({
            order: null,
          })
        );
        return true;
      }, new Response(JSON.stringify({
        '@id': '/v12/carts/1',
        order: { '@id': '/v12/orders/1' },
      }), { status: 200 }));

      await unitOfWorkSdk.getRepository('carts').update(cart);
    });

    test('one-to-many with objects as old model and string as new model', async () => {
      fetchMock.get.endsWith(
        '/v12/carts/1',
        new Response(
          JSON.stringify({
            '@id': '/v12/carts/1',
            cartItemList: [
              { '@id': '/v12/cart_items/1' },
              { '@id': '/v12/cart_items/2' },
            ],
          }),
          { status: 200 }
        )
      );

      const cart = await unitOfWorkSdk
        .getRepository('carts')
        .find('/v12/carts/1');

      cart.cartItemList = ['/v1/cart_items/2'];

      fetchMock((input, options) => {
        if (options.method !== 'PUT') {
          return false;
        }
        expect(options.body).toEqual(
          JSON.stringify({
            cartItemList: ['/v1/cart_items/2'],
          })
        );
        return true;
      }, new Response(JSON.stringify({
        '@id': '/v12/carts/1',
        cartItemList: [
          { '@id': '/v12/cart_items/1' },
          { '@id': '/v12/cart_items/2' },
        ],
      }), { status: 200 }));

      await unitOfWorkSdk.getRepository('carts').update(cart);
    });
  });
});
