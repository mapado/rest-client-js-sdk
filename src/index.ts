import RestClientSdk from './RestClientSdk';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  InternalServerError,
  ResourceNotFoundError,
  UnauthorizedError,
  InvalidScopeError,
  OauthError,
  InvalidGrantError,
} from './ErrorFactory';
import AbstractClient from './client/AbstractClient';
import TokenStorage from './TokenStorage';
import AbstractTokenGenerator from './TokenGenerator/AbstractTokenGenerator';
import AuthorizationCodeFlowTokenGenerator from './TokenGenerator/AuthorizationCodeFlowTokenGenerator';
import ClientCredentialsGenerator from './TokenGenerator/ClientCredentialsGenerator';
import PasswordGenerator from './TokenGenerator/PasswordGenerator';
import ProvidedTokenGenerator from './TokenGenerator/ProvidedTokenGenerator';
import Serializer from './serializer/Serializer';
import type SerializerInterface from './serializer/SerializerInterface';
import Mapping from './Mapping';
import ClassMetadata from './Mapping/ClassMetadata';
import Attribute from './Mapping/Attribute';
import Relation from './Mapping/Relation';
import { Logger, Log, LoggerHistory } from './utils/logging';

import type {
  Token,
  ErrorBody,
  TokenBody,
  TokenResponse,
  RefreshTokenParameters,
} from './TokenGenerator/types';

import type { SdkMetadata, MetadataDefinition } from './RestClientSdk';
// eslint-disable-next-line import/no-duplicates
import type RestClientSdkInterface from './RestClientSdkInterface';
// eslint-disable-next-line import/no-duplicates
import type { Config } from './RestClientSdkInterface';
// eslint-disable-next-line import/no-duplicates
import type TokenStorageInterface from './TokenStorageInterface';
// eslint-disable-next-line import/no-duplicates
import type { HasExpiresAt } from './TokenStorageInterface';
import type TokenGeneratorInterface from './TokenGenerator/TokenGeneratorInterface';
import type AsyncStorageInterface from './AsyncStorageInterface';

export default RestClientSdk;
export {
  AbstractClient,
  AbstractTokenGenerator,
  AuthorizationCodeFlowTokenGenerator,
  ClientCredentialsGenerator,
  PasswordGenerator,
  ProvidedTokenGenerator,
  Serializer,
  TokenStorage,
  UnauthorizedError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  OauthError,
  InvalidGrantError,
  InvalidScopeError,
  HttpError,
  InternalServerError,
  ResourceNotFoundError,
  Mapping,
  ClassMetadata,
  Attribute,
  Relation,
  Logger,
};
export type {
  SerializerInterface,
  Token,
  ErrorBody,
  TokenResponse,
  TokenBody,
  HasExpiresAt,
  RefreshTokenParameters,
  Config,
  SdkMetadata,
  RestClientSdkInterface,
  TokenStorageInterface,
  TokenGeneratorInterface,
  AsyncStorageInterface,
  MetadataDefinition,
  LoggerHistory,
  Log,
};
