import { TokenStorage } from '../src/index';
import TokenGeneratorMock from './ResponseTokenGeneratorMock';
import Storage from './mockStorage';

export default new TokenStorage(new TokenGeneratorMock(), new Storage());
