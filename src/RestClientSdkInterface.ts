import Mapping from './Mapping';
import { SdkMetadata } from './RestClientSdk';
import { Token } from './TokenGenerator/types';
import TokenStorageInterface from './TokenStorageInterface';
import AbstractClient from './client/AbstractClient';
import { Logger } from './utils/logging';

export type Config = {
  path: string;
  scheme: string;
  port?: number;
  segment?: string;
  authorizationType?: string; // default to "Bearer", but can be "Basic" or anything
  useDefaultParameters?: boolean;
  unitOfWorkEnabled?: boolean;
  loggerEnabled?: boolean;
  onRefreshTokenFailure?: (error: Error) => void;
};

export default interface RestClientSdkInterface<M extends SdkMetadata> {
  tokenStorage: TokenStorageInterface<Token>;
  mapping: Mapping;

  readonly logger?: Logger;

  getRepository<K extends keyof M & string>(key: K): AbstractClient<M[K]>;
}
