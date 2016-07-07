import { AbstractTokenGenerator } from '../../src';
import oauthClientCredentialsMock from './oauthClientCredentials';
import refreshedCredentials from './refreshedCredentials';

class TokenGeneratorMock extends AbstractTokenGenerator {
  generateToken(parameters) {
    return new Promise((resolve) => {
      resolve(oauthClientCredentialsMock);
    });
  }

  refreshToken(accessToken, parameters) {
    return new Promise((resolve) => {
      resolve(refreshedCredentials);
    });
  }
}

export default TokenGeneratorMock;
