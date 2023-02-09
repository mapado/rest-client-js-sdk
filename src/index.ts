import type AsyncStorageInterface from './AsyncStorageInterface';
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
import Mapping from './Mapping';
import Attribute from './Mapping/Attribute';
import ClassMetadata from './Mapping/ClassMetadata';
import Relation from './Mapping/Relation';
import RestClientSdk from './RestClientSdk';
import type { SdkMetadata, MetadataDefinition } from './RestClientSdk';
// eslint-disable-next-line import/no-duplicates
import type RestClientSdkInterface from './RestClientSdkInterface';
// eslint-disable-next-line import/no-duplicates
import type { Config } from './RestClientSdkInterface';
import AbstractTokenGenerator from './TokenGenerator/AbstractTokenGenerator';
import AuthorizationCodeFlowTokenGenerator from './TokenGenerator/AuthorizationCodeFlowTokenGenerator';
import ClientCredentialsGenerator from './TokenGenerator/ClientCredentialsGenerator';
import PasswordGenerator from './TokenGenerator/PasswordGenerator';
import ProvidedTokenGenerator from './TokenGenerator/ProvidedTokenGenerator';
import type TokenGeneratorInterface from './TokenGenerator/TokenGeneratorInterface';
import type {
  Token,
  ErrorBody,
  TokenBody,
  TokenResponse,
} from './TokenGenerator/types';
import TokenStorage from './TokenStorage';
import TokenStorageInterface from './TokenStorageInterface';
import type { HasExpiresAt } from './TokenStorageInterface';
import AbstractClient from './client/AbstractClient';
import Serializer from './serializer/Serializer';
import type SerializerInterface from './serializer/SerializerInterface';
import { Logger, Log, LoggerHistory } from './utils/logging';

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
