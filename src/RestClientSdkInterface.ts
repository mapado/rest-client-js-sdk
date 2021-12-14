import AbstractClient from './client/AbstractClient';
import { SdkMetadata } from './RestClientSdk';
import { Token } from './TokenGenerator/types';
import TokenStorageInterface from './TokenStorageInterface';
import Mapping from './Mapping';

export type Config = {
  path: string;
  scheme: string;
  port?: number;
  segment?: string;
  authorizationType?: string; // default to "Bearer", but can be "Basic" or anything
  useDefaultParameters?: boolean;
  unitOfWorkEnabled?: boolean;
  loggerEnabled?: boolean;
};

export default interface RestClientSdkInterface<M extends SdkMetadata> {
  tokenStorage: TokenStorageInterface<Token>;
  mapping: Mapping;

  getRepository<K extends keyof M & string>(key: K): AbstractClient<M[K]>;
}
