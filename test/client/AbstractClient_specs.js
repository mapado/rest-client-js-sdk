/* global describe, it, afterEach */
import fetchMock from 'fetch-mock';
import { expect } from 'chai';
import { fromJS, List, Map } from 'immutable';
import RestClientSdk, { AbstractClient } from '../../src';
import tokenStorageMock from '../mock/tokenStorage';

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
}

const SomeSdk = new RestClientSdk(
  tokenStorageMock,
  { path: 'api.me', scheme: 'https' },
  {
    test: SomeTestClient,
    defParam: DefaultParametersTestClient,
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
        expect(item).to.be.an.instanceof(Map),
        expect(item.get('name')).to.equal('foo'),
        expect(item.get('customName')).to.be.undefined,
      ]))
    ;
  });

  it('handle entityFactory with a custom entity factory', () => {
    function entityFactory(input, listOrItem) {
      if (listOrItem === 'list') {
        return List(
          input.map(
            (item) => fromJS(item).set('customName', item.name)
          )
        );
      }

      const out = fromJS(input);
      return out.set('customName', input.name);
    }

    const EntityFactorySdk = new RestClientSdk(
      tokenStorageMock,
      { path: 'api.me', scheme: 'https' },
      {
        test: SomeTestClient,
        defParam: DefaultParametersTestClient,
      },
      entityFactory
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
          expect(item).to.be.an.instanceof(Map),
          expect(item.get('name')).to.equal('foo'),
          expect(item.get('customName')).to.equal('foo'),
        ])),
      EntityFactorySdk.test.findAll()
        .then(itemList => Promise.all([
          expect(itemList).to.be.an.instanceof(List),
          expect(itemList.first().get('name')).to.equal('foo'),
          expect(itemList.first().get('customName')).to.equal('foo'),
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
});
