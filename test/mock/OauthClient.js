import { OauthClient } from '../../src';
import Storage from './mockStorage';

export default new OauthClient(
  { path: 'oauth.me', scheme: 'https' },
  'clientid',
  'clientsecret',
  new Storage()
);
