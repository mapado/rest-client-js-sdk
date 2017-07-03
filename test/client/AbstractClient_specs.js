/* global describe, it, afterEach */
/* eslint no-unused-vars: 0 */
import fetchMock from 'fetch-mock';
import { expect, assert } from 'chai';
import * as errors from '../../src/Error';
import RestClientSdk, { AbstractClient } from '../../src';
import tokenStorageMock from '../mock/tokenStorage';
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
    fetchMock
      .mock(() => true, {
        '@id': '/v1/test/8',
      })
      .getMock()
    ;

    return Promise.all([
      SomeSdk.test.find(8),
      SomeSdk.test.find(8, { q: 'test', foo: 'bar' }),
      SomeSdk.defParam.find(8),
      SomeSdk.defParam.find(8, { q: 'test', foo: 'bar' }),
    ])
    .then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test/8');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/v2/test/8?q=test&foo=bar');

      const url3 = fetchMock.calls().matched[2][0];
      expect(url3).to.equals('https://api.me/v2/def_param/8?_groups=test_read%2Ctest_write&dp=df');

      const url4 = fetchMock.calls().matched[3][0];
      expect(url4).to.equals('https://api.me/v2/def_param/8?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df');
    });
  });

  it('handle findBy query', () => {
    fetchMock
      .mock(() => true, {
        '@id': '/v1/test/8',
      })
      .getMock()
    ;

    return Promise.all([
      SomeSdk.test.findBy({ q: 'test', foo: 'bar' }),
      SomeSdk.defParam.findBy({ q: 'test', foo: 'bar' }),
    ])
    .then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test?q=test&foo=bar');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/v2/def_param?q=test&foo=bar&_groups=test_read%2Ctest_write&dp=df');
    });
  });

  it('handle findAll query', () => {
    fetchMock
      .mock(() => true, {
        '@id': '/v1/test/8',
      })
      .getMock()
    ;

    return Promise.all([
      SomeSdk.test.findAll(),
      SomeSdk.defParam.findAll(),
    ])
    .then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test');

      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/v2/def_param?_groups=test_read%2Ctest_write&dp=df');
    });
  });

  it('handle entityFactory', () => {
    fetchMock
      .mock(() => true, {
        '@id': '/v1/test/8',
        name: 'foo',
      })
      .getMock()
    ;

    return SomeSdk.test.find(8)
      .then(item => Promise.all([
        expect(item).to.be.an('object'),
        expect(item.name).to.equal('foo'),
        expect(item.customName).to.be.undefined,
      ]))
    ;
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
      ])
      .getMock()
    ;

    return Promise.all([
      EntityFactorySdk.test.find(8)
        .then(item => Promise.all([
          expect(item).to.be.an('object'),
          expect(item.name).to.equal('foo'),
          expect(item.customName).to.equal('foofoo'),
        ])),
      EntityFactorySdk.test.findAll()
        .then(itemList => Promise.all([
          expect(itemList).to.be.an('array'),
          expect(itemList[0].name).to.equal('foo'),
          expect(itemList[0].customName).to.equal('foofoo'),
        ])),
    ]);
  });

  it('handle getPathBase with custom path parameters', () => {
    fetchMock
      .mock(() => true, {
        '@id': '/v1/test/8',
      })
      .getMock()
    ;

    return Promise.all([
      SomeSdk.test.find(8, {}, { basePath: '/foo' }),
      SomeSdk.test.findBy({ q: 'test', foo: 'bar' }, { basePath: '/foo' }),
      SomeSdk.test.findAll({}, { basePath: '/foo' }),
    ])
    .then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/foo/8');
      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/foo?q=test&foo=bar');
      const url3 = fetchMock.calls().matched[2][0];
      expect(url3).to.equals('https://api.me/foo');
    });
  });

  it('handle Authorization header', () => {
    fetchMock
      .mock(() => true, {
        '@id': '/v1/test/8',
      })
      .getMock()
    ;

    const BasicAuthSdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https', authorizationType: 'Basic' },
      {
        test: SomeTestClient,
        defParam: DefaultParametersTestClient,
      }
    );
    BasicAuthSdk.tokenStorage.generateToken();

    return Promise.all([
      SomeSdk.test.find(8),
      BasicAuthSdk.test.find(8),
    ])
    .then(() => {
      const authHeader = fetchMock.calls().matched[0][1].headers.Authorization;
      expect(authHeader).to.include('Bearer ');
      const basicAuthHeader = fetchMock.calls().matched[1][1].headers.Authorization;
      expect(basicAuthHeader).to.include('Basic ');
    });
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
      .mock(/500$/, 500)
      .getMock()
    ;

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
    fetchMock
      .mock(() => true, {
        '@id': '/v2/test/8',
        foo: 'bar',
      })
      .getMock()
    ;

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
    ])
    .then(() => {
      const url1 = fetchMock.calls().matched[0][0];
      expect(url1).to.equals('https://api.me/v2/test/8');
      const url2 = fetchMock.calls().matched[1][0];
      expect(url2).to.equals('https://api.me/v2/no-at-id/9');
    });
  });
});
describe('Fix bugs', () => {
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

    expect(SomeSdk.test.makeUri('foo')).to.equals('https://api.me/v1/foo');
  });
});
