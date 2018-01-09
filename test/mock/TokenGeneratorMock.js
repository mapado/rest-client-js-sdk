/* eslint no-unused-vars: 0 */
import { AbstractTokenGenerator } from '../../src';
import oauthClientCredentialsMock from './oauthClientCredentials.json';
import refreshedCredentials from './refreshedCredentials.json';

class TokenGeneratorMock extends AbstractTokenGenerator {
  generateToken(parameters) {
    return new Promise(resolve => {
      resolve(oauthClientCredentialsMock);
    });
  }

  refreshToken(accessToken, parameters) {
    return new Promise(resolve => {
      resolve(refreshedCredentials);
    });
  }
}

export default TokenGeneratorMock;
