/* global describe, it, afterEach */
/* eslint no-unused-vars: 0 */
import fetchMock from 'fetch-mock';
import { expect, assert } from 'chai';
import * as errors from '../../src/Error';
import RestClientSdk, {
  AbstractClient,
  TokenStorage,
  PasswordGenerator,
} from '../../src';
import tokenStorageMock from '../mock/tokenStorage';
import MockStorage from '../mock/mockStorage';
import WeirdSerializer from '../WeirdSerializer';

class SomeTestClient extends AbstractClient {
  getPathBase(pathParameters) {
    if (pathParameters.basePath) {
      return pathParameters.basePath;
    }

    return '/v2/test';
  }

  getName() {
    return 'SomeClient';
  }

  getEntityURI(entity) {
    return entity['@id'];
  }
}

class NoAtIdClient extends AbstractClient {
  getPathBase(pathParameters) {
    return '/v2/no-at-id';
  }

  getName() {
    return 'NoAtIdClient';
  }

  getEntityURI(entity) {
    const uri = `${this.getPathBase()}/${entity.id}`;
    return uri;
  }
}

class DefaultParametersTestClient extends AbstractClient {
  getPathBase() {
    return '/v2/def_param';
  }

  getDefaultParameters() {
    return {
      _groups: 'test_read,test_write',
      dp: 'df',
    };
  }

  getName() {
    return 'DefaultParamTest';
  }

  getEntityURI(entity) {
    return entity['@id'];
  }
}

const SomeSdk = new RestClientSdk(
  tokenStorageMock,
  { path: 'api.me', scheme: 'https' },
  {
    test: SomeTestClient,
    defParam: DefaultParametersTestClient,
    noAtId: NoAtIdClient,
  }
);
SomeSdk.tokenStorage.generateToken();

describe('Test Client', () => {
  afterEach(fetchMock.restore);

  it('handle find query', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
    });

    return Promise.all([
      SomeSdk.test.find(8),
      SomeSdk.test.find(8, { q: 'test', foo: 'bar' }),
      SomeSdk.defParam.find(8),
      SomeSdk.defParam.find(8, { q: 'test', foo: 'bar' }),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test/8');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/v2/test/8?q=test&foo=bar');

      const url3 = fetchMock.calls().matched[2][0];
      expect(url3).to.equals(
        'https://api.me/v2/def_param/8?_groups=test_read%2Ctest_write&dp=df'
      );

      const url4 = fetchMock.calls().matched[3][0];
      expect(url4).to.equals(
        'https://api.me/v2/def_param/8?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df'
      );
    });
  });

  it('handle findBy query', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
    });

    return Promise.all([
      SomeSdk.test.findBy({ q: 'test', foo: 'bar' }),
      SomeSdk.defParam.findBy({ q: 'test', foo: 'bar' }),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test?q=test&foo=bar');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals(
        'https://api.me/v2/def_param?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df'
      );
    });
  });

  it('handle findAll query', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
    });

    return Promise.all([
      SomeSdk.test.findAll(),
      SomeSdk.defParam.findAll(),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals(
        'https://api.me/v2/def_param?_groups=test_read%2Ctest_write&dp=df'
      );
    });
  });

  it('handle entityFactory', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
      name: 'foo',
    });

    return SomeSdk.test
      .find(8)
      .then(item =>
        Promise.all([
          expect(item).to.be.an('object'),
          expect(item.name).to.equal('foo'),
          expect(item.customName).to.be.undefined,
        ])
      );
  });

  it('handle entityFactory with a custom serializer', () => {
    const EntityFactorySdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https' },
      {
        test: SomeTestClient,
        defParam: DefaultParametersTestClient,
      },
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
      EntityFactorySdk.test
        .find(8)
        .then(item =>
          Promise.all([
            expect(item).to.be.an('object'),
            expect(item.name).to.equal('foo'),
            expect(item.customName).to.equal('foofoo'),
          ])
        ),
      EntityFactorySdk.test
        .findAll()
        .then(itemList =>
          Promise.all([
            expect(itemList).to.be.an('array'),
            expect(itemList[0].name).to.equal('foo'),
            expect(itemList[0].customName).to.equal('foofoo'),
          ])
        ),
    ]);
  });

  it('handle getPathBase with custom path parameters', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
    });

    return Promise.all([
      SomeSdk.test.find(8, {}, { basePath: '/foo' }),
      SomeSdk.test.findBy({ q: 'test', foo: 'bar' }, { basePath: '/foo' }),
      SomeSdk.test.findAll({}, { basePath: '/foo' }),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/foo/8');
      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/foo?q=test&foo=bar');
      const url3 = fetchMock.calls().matched[2][0];
      expect(url3).to.equals('https://api.me/foo');
    });
  });

  it('handle Authorization header', () => {
    fetchMock.mock(() => true, {
      '@id': '/v1/test/8',
    });

    const BasicAuthSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', authorizationType: 'Basic' },
      {
        test: SomeTestClient,
        defParam: DefaultParametersTestClient,
      }
    );
    BasicAuthSdk.tokenStorage.generateToken();

    return Promise.all([SomeSdk.test.find(8), BasicAuthSdk.test.find(8)]).then(
      () => {
        const authHeader = fetchMock.calls().matched[0][1].headers
          .Authorization;
        expect(authHeader).to.include('Bearer ');
        const basicAuthHeader = fetchMock.calls().matched[1][1].headers
          .Authorization;
        expect(basicAuthHeader).to.include('Basic ');
      }
    );
  });
});

describe('Test errors', () => {
  afterEach(fetchMock.restore);

  it('handle 401 and 403 errors', () => {
    fetchMock
      .mock(/400$/, 400)
      .mock(/401$/, 401)
      .mock(/403$/, 403)
      .mock(/404$/, 404)
      .mock(/410$/, 410)
      .mock(/500$/, 500);

    return Promise.all([
      assert.isRejected(SomeSdk.test.find(400), errors.BadRequestError),
      assert.isRejected(SomeSdk.test.find(401), errors.AccessDeniedError),
      assert.isRejected(SomeSdk.test.find(403), errors.ForbiddenError),
      assert.isRejected(SomeSdk.test.find(404), errors.ResourceNotFoundError),
      assert.isRejected(SomeSdk.test.find(404), errors.BadRequestError),
      assert.isRejected(SomeSdk.test.find(410), errors.BadRequestError),
      assert.isRejected(SomeSdk.test.find(500), errors.InternalServerError),
    ]);
  });
});

describe('Update and delete function trigger the good urls', () => {
  afterEach(fetchMock.restore);

  it('handle updating and deleting entities with @ids', () => {
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
      SomeSdk.test.update(data),
      SomeSdk.noAtId.update(dataNoArobase),
    ]).then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test/8');
      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/v2/no-at-id/9');
    });
  });
});
describe('Fix bugs', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('generate good url', () => {
    const SomeSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', prefix: '/v1' },
      {
        test: SomeTestClient,
        defParam: DefaultParametersTestClient,
        noAtId: NoAtIdClient,
      }
    );
    SomeSdk.tokenStorage.generateToken();

    expect(SomeSdk.test.makeUri('foo').toString()).to.equals(
      'https://api.me/v1/foo'
    );
  });

  it('allow base header override', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
      foo: 'bar',
    });

    return SomeSdk.test
      .authorizedFetch('foo', {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(() => {
        expect(fetchMock.lastOptions().headers['Content-Type']).to.equals(
          'multipart/form-data'
        );
      });
  });

  it('allow removing base header', () => {
    fetchMock.mock(() => true, {
      '@id': '/v2/test/8',
      foo: 'bar',
    });

    return SomeSdk.test
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
        expect(Object.keys(fetchMock.lastOptions().headers)).to.eql([
          'Authorization',
          'bar',
          'baz',
          'bad',
        ]);
      });
  });

  it('check that the request done after refreshing a token contains the refreshed token', () => {
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
      { test: SomeTestClient }
    );

    return SomeInnerSdk.tokenStorage
      .generateToken({
        username: 'foo',
        password: 'bar',
      })
      .then(() => SomeInnerSdk.test.find(1))
      .then(() => {
        expect(
          fetchMock.lastOptions('access_denied').headers.Authorization
        ).to.eql('Bearer an_access_token');
        expect(fetchMock.lastOptions('success').headers.Authorization).to.eql(
          'Bearer a_refreshed_token'
        );
      });
  });
});
