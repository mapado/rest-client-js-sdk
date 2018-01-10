/* eslint no-unused-vars: 0, no-underscore-dangle: 0 */
import fetchMock from 'fetch-mock';
import * as errors from '../../src/Error';
import RestClientSdk, {
  AbstractClient,
  Serializer,
  TokenStorage,
  PasswordGenerator,
  Mapping,
  ClassMetadata,
  Attribute,
  Relation,
  ONE_TO_MANY,
  MANY_TO_ONE,
} from '../../src/index';
import tokenStorageMock from '../../__mocks__/tokenStorage';
import MockStorage from '../../__mocks__/mockStorage';

class WeirdSerializer extends Serializer {
  deserializeItem(rawData, type) {
    return this._serializeItem(JSON.parse(rawData));
  }

  deserializeList(rawListData, type) {
    const input = JSON.parse(rawListData);

    return input.map(this._serializeItem);
  }

  serializeItem(entity, type) {
    return JSON.stringify(entity);
  }

  _serializeItem(item) {
    return Object.assign({}, item, { customName: `${item.name}${item.name}` });
  }
}

class SomeTestClient extends AbstractClient {
  getPathBase(pathParameters) {
    if (pathParameters.basePath) {
      return pathParameters.basePath;
    }

    return `${this.sdk.mapping.idPrefix}/test`;
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

const SomeSdk = new RestClientSdk(
  tokenStorageMock,
  { path: 'api.me', scheme: 'https' },
  mapping
);
SomeSdk.tokenStorage.generateToken();

describe('Test Client', () => {
  afterEach(fetchMock.restore);

  test('handle find query', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
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

  test('handle findBy query', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
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
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
    });

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
      '@id': '/v1/test/8',
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
        '@id': '/v1/test/8',
        name: 'foo',
      })
      .mock('https://api.me/v2/test', [
        {
          '@id': '/v1/test/8',
          name: 'foo',
        },
        {
          '@id': '/v1/test/9',
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
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
    });

    return Promise.all([
      SomeSdk.getRepository('test').find(8, {}, { basePath: '/foo' }),
      SomeSdk.getRepository('test').findBy(
        { q: 'test', foo: 'bar' },
        { basePath: '/foo' }
      ),
      SomeSdk.getRepository('test').findAll({}, { basePath: '/foo' }),
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
      '@id': '/v1/test/8',
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
});

describe('Test errors', () => {
  afterEach(fetchMock.restore);

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
        errors.AccessDeniedError
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
  afterEach(fetchMock.restore);

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
  afterEach(() => {
    fetchMock.restore();
  });

  test('generate good url', () => {
    const SomeInnerSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', prefix: '/v1' },
      mapping
    );
    SomeInnerSdk.tokenStorage.generateToken();

    expect(
      SomeInnerSdk.getRepository('test')
        .makeUri('foo')
        .toString()
    ).toEqual('https://api.me/v1/foo');
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
});
