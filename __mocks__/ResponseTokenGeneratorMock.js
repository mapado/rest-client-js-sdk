/* eslint-disable max-classes-per-file, no-unused-vars */
import { AbstractTokenGenerator } from '../src/index';
import oauthClientCredentialsMock from './oauthClientCredentials.json';
import refreshedCredentials from './refreshedCredentials.json';

class Response {
  constructor(body) {
    this.body = body;
  }

  async json() {
    return this.body;
  }
}

class TokenGeneratorMock extends AbstractTokenGenerator {
  generateToken(parameters) {
    return new Promise((resolve) => {
      resolve(new Response(oauthClientCredentialsMock));
    });
  }

  refreshToken(accessToken, parameters) {
    return new Promise((resolve) => {
      resolve(new Response(refreshedCredentials));
    });
  }
}

export default TokenGeneratorMock;
