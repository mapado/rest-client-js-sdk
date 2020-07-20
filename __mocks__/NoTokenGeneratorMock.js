import { AbstractTokenGenerator } from '../src';

class NoTokenGenerator extends AbstractTokenGenerator {
  constructor() {
    super();
    this.canAutogenerateToken = true;
  }

  generateToken() {
    return Promise.resolve(null);
  }

  refreshToken() {
    return this.generateToken();
  }
}

export default NoTokenGenerator;
