/* global describe, it, afterEach */
global.FormData = require('form-data');
import { expect } from 'chai';
import fetchMock from 'fetch-mock';
import oauthClientCredentialsMock from '../mock/passwordCredentials';
import { PasswordGenerator } from '../../src';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  ResourceNotFoundError,
} from '../../src/Error';

const tokenConfig = {
  path: 'oauth.me',
  scheme: 'https',
  clientId: '8',
  clientSecret: 'keep me secret',
};

describe('PasswordGenerator tests', () => {
  afterEach(fetchMock.restore);

  it('test that config is properly checked', () => {
    function createTokenGenerator(config) {
      return () => new PasswordGenerator(config);
    }

    expect(createTokenGenerator()).to.throw(RangeError, /config must be set/);
    expect(createTokenGenerator({ foo: 'bar' })).to.throw(
      RangeError,
      /should contain a "path"/
    );
    expect(
      createTokenGenerator({ path: 'oauth.me', scheme: 'https' })
    ).to.throw(RangeError, /should contain a "clientId"/);
    expect(createTokenGenerator(tokenConfig)).not.to.throw('good config');
  });

  it('test generateToken method', () => {
    fetchMock.post(() => true, oauthClientCredentialsMock);

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    expect(() => tokenGenerator.generateToken()).to.throw(
      RangeError,
      'parameters must be set'
    );
    expect(() => tokenGenerator.generateToken({ foo: 'bar' })).to.throw(
      RangeError,
      'username and password'
    );
    const token = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });
    expect(token).to.be.an.instanceOf(Promise);

    return Promise.all([
      expect(token).to.eventually.be.an.object,
      expect(token.then(a => a.access_token)).to.eventually.equals(
        oauthClientCredentialsMock.access_token
      ),
      expect(token.then(a => a.refresh_token)).to.eventually.equals(
        oauthClientCredentialsMock.refresh_token
      ),
    ]);
  });

  it('test that refreshToken refresh the token ;)', () => {
    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const tokenGenerator = new PasswordGenerator(tokenConfig);

    expect(() => tokenGenerator.refreshToken()).to.throw(
      Error,
      /refresh_token is not set/
    );

    fetchMock.mock(() => true, oauthClientCredentialsMock);

    const generateTokenPromise = tokenGenerator.generateToken({
      username: 'foo',
      password: 'bar',
    });

    return Promise.all([
      generateTokenPromise.then(accessToken => {
        expect(() => tokenGenerator.refreshToken(accessToken)).not.to.throw(
          Error
        );
        expect(
          tokenGenerator
            .refreshToken(accessToken)
            .then(token => token.access_token)
        ).to.eventually.equals(oauthClientCredentialsMock.access_token);
      }),
    ]);
  });

  it('test that ForbiddenError is thrown', () => {
    fetchMock.mock(() => true, 403);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof ForbiddenError).to.equals(true);
      });
  });

  it('test that ResourceNotFoundError is thrown', () => {
    fetchMock.mock(() => true, 404);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof ResourceNotFoundError).to.equals(true);
      });
  });

  it('test that BadRequestError is thrown', () => {
    fetchMock.mock(() => true, 400);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof BadRequestError).to.equals(true);
      });
  });

  it('test that InternalServerError is thrown', () => {
    fetchMock.mock(() => true, 500);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof InternalServerError).to.equals(true);
      });
  });

  it('test that unexpected error is thrown', () => {
    fetchMock.mock(() => true, 401);

    const tokenGenerator = new PasswordGenerator(tokenConfig);
    return tokenGenerator
      .generateToken({ password: 'foo', username: 'bar' })
      .catch(err => {
        expect(err instanceof Error).to.equals(true);
      });
  });
});
