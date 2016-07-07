import { TokenStorage } from '../../src';
import TokenGeneratorMock from './TokenGeneratorMock';
import Storage from './mockStorage';

export default new TokenStorage(
  new TokenGeneratorMock(),
  new Storage()
);
