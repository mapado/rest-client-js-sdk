import AbstractTokenGenerator from './AbstractTokenGenerator';

const ERROR_TOKEN_EMPTY = 'A token must be provided';

class ProvidedTokenGenerator extends AbstractTokenGenerator {
  generateToken(providedToken) {
    this.checkTokenGeneratorConfig(providedToken);

    return Promise.resolve({
      access_token: providedToken,
      token_type: 'bearer',
    });
  }

  refreshToken(accessToken) {
    return this.generateToken(accessToken);
  }

  checkTokenGeneratorConfig(providedToken) {
    if (!providedToken || typeof providedToken === 'object') {
      throw new RangeError(ERROR_TOKEN_EMPTY);
    }
  }
}

export default ProvidedTokenGenerator;
