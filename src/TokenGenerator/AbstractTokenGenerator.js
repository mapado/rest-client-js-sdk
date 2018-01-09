/* eslint no-unused-vars: 0 */

class AbstractTokenGenerator {
  constructor(tokenGeneratorConfig = {}) {
    this.tokenGeneratorConfig = tokenGeneratorConfig;
    this.canAutogenerateToken = false;
    this.checkTokenGeneratorConfig(this.tokenGeneratorConfig);
  }

  generateToken(parameters) {
    throw new Error(`AbstractTokenGenerator::generateToken can not be called directly.
                    You must implement "generateToken" method.`);
  }

  refreshToken(accessToken, parameters) {
    throw new Error(`AbstractTokenGenerator::refreshToken can not be called directly.
                    You must implement "refreshToken" method.`);
  }

  checkTokenGeneratorConfig(config) {
    return true;
  }

  convertMapToFormData(parameters) {
    const keys = Object.keys(parameters);

    const formData = new FormData();

    keys.forEach(key => {
      formData.append(key, parameters[key]);
    });

    return formData;
  }
}

export default AbstractTokenGenerator;
