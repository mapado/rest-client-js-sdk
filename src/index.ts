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
import ClientCredentialsGenerator from './TokenGenerator/ClientCredentialsGenerator';
import PasswordGenerator from './TokenGenerator/PasswordGenerator';
import ProvidedTokenGenerator from './TokenGenerator/ProvidedTokenGenerator';
import Serializer from './serializer/Serializer';
import type SerializerInterface from './serializer/SerializerInterface';
import Mapping from './Mapping';
import ClassMetadata from './Mapping/ClassMetadata';
import Attribute from './Mapping/Attribute';
import Relation from './Mapping/Relation';
import type { Token } from './TokenGenerator/types';
import type { SdkMetadata } from './RestClientSdk';

export default RestClientSdk;
export {
  AbstractClient,
  AbstractTokenGenerator,
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
};
export type { SerializerInterface, Token, SdkMetadata };