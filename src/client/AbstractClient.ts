import URI from 'urijs';
import { OauthError, getHttpErrorFromResponse } from '../ErrorFactory';
import type ClassMetadata from '../Mapping/ClassMetadata';
// eslint-disable-next-line import/no-duplicates
import type RestClientSdk from '../RestClientSdk';
// eslint-disable-next-line import/no-duplicates
import type { MetadataDefinition, SdkMetadata } from '../RestClientSdk';
import { Token } from '../TokenGenerator/types';
import TokenStorageInterface from '../TokenStorageInterface';
import type SerializerInterface from '../serializer/SerializerInterface';
import { generateRepository } from '../utils/repositoryGenerator';
import { removeAuthorization, removeUndefinedHeaders } from './headerUtils';

const EXPIRE_LIMIT_SECONDS = 300; // = 5 minutes

class AbstractClient<D extends MetadataDefinition> {
  sdk: RestClientSdk<SdkMetadata>;

  #tokenStorage: TokenStorageInterface<Token>;

  serializer: SerializerInterface;

  metadata: ClassMetadata;

  #isUnitOfWorkEnabled: boolean;

  constructor(
    sdk: RestClientSdk<SdkMetadata>,
    metadata: ClassMetadata,
    isUnitOfWorkEnabled = true
  ) {
    this.sdk = sdk;
    this.#tokenStorage = sdk.tokenStorage;
    this.serializer = sdk.serializer;
    this.metadata = metadata;
    this.#isUnitOfWorkEnabled = isUnitOfWorkEnabled;
  }

  withUnitOfWork(enabled: boolean): AbstractClient<D> {
    // eslint-disable-next-line new-cap
    return generateRepository<D>(this.sdk, this.metadata, enabled);
  }

  getDefaultParameters(): Record<string, unknown> {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPathBase(pathParameters: Record<string, unknown>): string {
    return `/${this.metadata.pathRoot}`;
  }

  getEntityURI(entity: D['entity']): string {
    let idValue = this._getEntityIdentifier(entity);

    if (idValue === null) {
      throw new Error('Cannot call `getEntityURI for entity without id.`');
    }

    if (typeof idValue === 'number') {
      if (Number.isFinite(idValue)) {
        idValue = idValue.toString();
      } else {
        throw new Error('Unable to handle non-finite number');
      }
    }

    const pathBase = this.getPathBase({});
    if (idValue.indexOf(pathBase) > -1) {
      return idValue;
    }
    return `${pathBase}/${idValue}`;
  }

  /**
   * get an entity by its id
   *
   * @param {string|number} id the entity identifier
   * @param {Record<string, unknown>} queryParam query parameters that will be added to the request
   * @param {Record<string, unknown>} pathParameters path parameters, will be pass to the `getPathBase` method
   * @param {Record<string, unknown>} requestParams parameters that will be send as second parameter to the `fetch` call
   */
  find(
    id: string | number,
    queryParam: Record<string, unknown> = {},
    pathParameters: Record<string, unknown> = {},
    requestParams: Record<string, unknown> = {}
  ): Promise<D['entity']> {
    const url = this._generateUrlFromParams(queryParam, pathParameters, id);

    return this.deserializeResponse(
      this.authorizedFetch(url, requestParams),
      'item'
    );
  }

  /**
   * get a list of entities by some parameters
   *
   * @param {Record<string, unknown>} queryParam query parameters that will be added to the request
   * @param {Record<string, unknown>} pathParameters path parameters, will be pass to the `getPathBase` method
   * @param {Record<string, unknown>} requestParams parameters that will be send as second parameter to the `fetch` call
   */
  findBy(
    queryParam: Record<string, unknown>,
    pathParameters: Record<string, unknown> = {},
    requestParams: Record<string, unknown> = {}
  ): Promise<D['list']> {
    const url = this._generateUrlFromParams(queryParam, pathParameters);

    return this.deserializeResponse(
      this.authorizedFetch(url, requestParams),
      'list'
    );
  }

  /**
   * get a list of all entities
   *
   * @param {Record<string, unknown>} queryParam query parameters that will be added to the request
   * @param {Record<string, unknown>} pathParameters path parameters, will be pass to the `getPathBase` method
   * @param {Record<string, unknown>} requestParams parameters that will be send as second parameter to the `fetch` call
   */
  findAll(
    queryParam: Record<string, unknown> = {},
    pathParameters: Record<string, unknown> = {},
    requestParams: Record<string, unknown> = {}
  ): Promise<D['list']> {
    return this.findBy(queryParam, pathParameters, requestParams);
  }

  /**
   * create an entity
   *
   * @param {Record<string, unknown>} entity the entity to persist
   * @param {Record<string, unknown>} queryParam query parameters that will be added to the request
   * @param {Record<string, unknown>} pathParameters path parameters, will be pass to the `getPathBase` method
   * @param {Record<string, unknown>} requestParams parameters that will be send as second parameter to the `fetch` call
   */
  create(
    entity: D['entity'],
    queryParam: Record<string, unknown> = {},
    pathParameters: Record<string, unknown> = {},
    requestParams: Record<string, unknown> = {}
  ): Promise<D['entity']> {
    const url = new URI(this.getPathBase(pathParameters));
    url.addSearch(queryParam);

    const oldSerializedModel = this.metadata.getDefaultSerializedModel();
    const newSerializedModel = this.serializer.normalizeItem(
      entity,
      this.metadata
    );

    const diff = this.sdk.unitOfWork.getDirtyData(
      newSerializedModel,
      oldSerializedModel,
      this.metadata
    );

    return this.deserializeResponse(
      this.authorizedFetch(url, {
        method: 'POST',
        body: this.serializer.encodeItem(diff, this.metadata),
        ...requestParams,
      }),
      'item'
    );
  }

  /**
   * update an entity
   *
   * @param {Record<string, unknown>} entity the entity to update
   * @param {Record<string, unknown>} queryParam query parameters that will be added to the request
   * @param {Record<string, unknown>} requestParams parameters that will be send as second parameter to the `fetch` call
   */
  update(
    entity: D['entity'],
    queryParam: Record<string, unknown> = {},
    requestParams: Record<string, unknown> = {}
  ): Promise<D['entity']> {
    const url = new URI(this.getEntityURI(entity));
    url.addSearch(queryParam);

    let newSerializedModel = this.serializer.normalizeItem(
      entity,
      this.metadata
    );

    const identifier = this._getEntityIdentifier(newSerializedModel);
    let oldModel;
    if (identifier !== null) {
      oldModel = this.sdk.unitOfWork.getDirtyEntity(identifier);
    }

    if (oldModel) {
      newSerializedModel = this.sdk.unitOfWork.getDirtyData(
        newSerializedModel,
        oldModel,
        this.metadata
      );
    }

    return this.deserializeResponse(
      this.authorizedFetch(url, {
        method: 'PUT',
        body: this.serializer.encodeItem(newSerializedModel, this.metadata),
        ...requestParams,
      }),
      'item'
    );
  }

  /**
   * delete an entity
   *
   * @param {Record<string, unknown>} the entity to delete
   * @param {Record<string, unknown>} requestParams parameters that will be send as second parameter to the `fetch` call
   */
  delete(entity: D['entity'], requestParams = {}): Promise<Response> {
    const url = this.getEntityURI(entity);
    const identifier = this._getEntityIdentifier(entity);

    return this.authorizedFetch(url, {
      method: 'DELETE',
      ...requestParams,
    }).then((response) => {
      if (identifier !== null) {
        this.sdk.unitOfWork.clear(identifier);
      }

      return response;
    });
  }

  deserializeResponse(
    requestPromise: Promise<Response>,
    listOrItem: 'list'
  ): Promise<D['list']>;

  deserializeResponse(
    requestPromise: Promise<Response>,
    listOrItem: 'item'
  ): Promise<D['entity']>;

  deserializeResponse<LOR extends 'list' | 'item'>(
    requestPromise: Promise<Response>,
    listOrItem: LOR
  ): Promise<D['entity'] | D['list']> {
    return requestPromise
      .then((response) => response.text().then((text) => ({ response, text })))
      .then(({ response, text }) => {
        if (listOrItem === 'list') {
          // for list, we need to deserialize the result to get an object
          const itemList = this.serializer.deserializeList(
            text,
            this.metadata,
            response
          ) as D['list'];

          if (this.#isUnitOfWorkEnabled) {
            // eslint-disable-next-line no-restricted-syntax
            for (const decodedItem of itemList) {
              const identifier = this._getEntityIdentifier(decodedItem);
              const normalizedItem = this.serializer.normalizeItem(
                decodedItem,
                this.metadata
              );

              // then we register the re-normalized item
              if (identifier !== null) {
                this.sdk.unitOfWork.registerClean(identifier, normalizedItem);
              }
            }
          }

          return itemList as D['list'];
        }

        // for items, we can just decode the item (ie. transform it to JS object)
        const decodedItem = this.serializer.decodeItem(
          text,
          this.metadata,
          response
        );

        // and register it directy without deserializing + renormalizing
        const identifier = this._getEntityIdentifier(decodedItem);

        // and finally return the denormalized item
        const item = this.serializer.denormalizeItem(
          decodedItem,
          this.metadata,
          response
        ) as D['entity'];

        if (this.#isUnitOfWorkEnabled && identifier !== null) {
          this.sdk.unitOfWork.registerClean(
            identifier,
            this.serializer.normalizeItem(item, this.metadata)
          );
        }

        return item as D['entity'];
      });
  }

  makeUri(input: string | URI): URI {
    const url = input instanceof URI ? input : new URI(input);
    url.host(this.sdk.config.path).scheme(this.sdk.config.scheme);

    if (this.sdk.config.port) {
      url.port(String(this.sdk.config.port));
    }

    if (this.sdk.mapping.idPrefix) {
      const segments = url.segment();

      if (!url.pathname().startsWith(this.sdk.mapping.idPrefix)) {
        segments.unshift(this.sdk.mapping.idPrefix);
        url.segment(segments);
      }
    }

    return url;
  }

  authorizedFetch(input: string | URI, requestParams = {}): Promise<Response> {
    const url = this.makeUri(input);

    return this._fetchWithToken(url.toString(), requestParams);
  }

  private _generateUrlFromParams(
    queryParam: Record<string, unknown>,
    pathParameters: Record<string, unknown> = {},
    id: null | string | number = null
  ): URI {
    const params = queryParam;
    if (this.sdk.config.useDefaultParameters) {
      Object.assign(params, this.getDefaultParameters());
    }

    const pathBase = this.getPathBase(pathParameters);

    let url = null;
    if (id) {
      const testPathBase = this.sdk.mapping.idPrefix
        ? `${this.sdk.mapping.idPrefix}${pathBase}`
        : pathBase;

      if (typeof id === 'string' && id.startsWith(testPathBase)) {
        url = new URI(id);
      } else {
        url = new URI(`${pathBase}/${id}`);
      }
    } else {
      url = new URI(pathBase);
    }

    if (params) {
      url.addSearch(params);
    }

    return url;
  }

  private _fetchWithToken(
    input: string,
    requestParams = {}
  ): Promise<Response> {
    if (!input) {
      throw new Error('input is empty');
    }

    if (this.#tokenStorage) {
      return this.#tokenStorage
        .getCurrentTokenExpiresIn()
        .then((accessTokenExpiresIn) => {
          if (
            accessTokenExpiresIn !== null &&
            accessTokenExpiresIn <= EXPIRE_LIMIT_SECONDS
          ) {
            return this.#tokenStorage
              .refreshToken()
              .then(
                (refreshedTokenObject) => refreshedTokenObject.access_token
              );
          }

          return this.#tokenStorage.getAccessToken();
        })
        .then((token) => this._doFetch(token, input, requestParams));
    }

    return this._doFetch(null, input, requestParams);
  }

  private _refreshTokenAndRefetch(
    input: string,
    requestParams: RequestInit = {}
  ): Promise<Response> {
    return this.#tokenStorage
      .refreshToken()
      .then(() => {
        // eslint-disable-next-line prefer-const
        let { headers, ...rest } = requestParams;

        const updatedRequestParams: RequestInit = {
          ...rest,
          headers: removeAuthorization(headers),
        };

        return this._fetchWithToken(input, updatedRequestParams);
      })
      .catch((e) => {
        if (e instanceof OauthError) {
          this.#tokenStorage.logout().then(() => {
            if (this.sdk.config.onRefreshTokenFailure) {
              this.sdk.config.onRefreshTokenFailure(e);
            }
          });
        }

        throw e;
      });
  }

  private _manageUnauthorized(
    response: Response,
    input: string,
    requestParams = {}
  ): Promise<Response> {
    const error = getHttpErrorFromResponse(response);

    // https://tools.ietf.org/html/rfc2617#section-1.2
    const authorizationHeader = response.headers.get('www-authenticate');
    if (authorizationHeader) {
      const invalidGrant =
        authorizationHeader.indexOf('error="invalid_grant"') > -1;

      if (invalidGrant && this.#tokenStorage) {
        return this._refreshTokenAndRefetch(input, requestParams);
      }

      throw error;
    } else {
      // if www-authenticate header is missing, try and read json response
      return response
        .json()
        .then((body) => {
          if (
            this.#tokenStorage &&
            (body.error === 'invalid_scope' || body.error === 'access_denied')
          ) {
            return this._refreshTokenAndRefetch(input, requestParams);
          }
          throw error;
        })
        .catch((err) => {
          if (err instanceof OauthError) {
            throw err;
          }
          throw error;
        });
    }
  }

  private _doFetch(
    accessToken: null | string,
    input: string,
    requestParams: RequestInit
  ): Promise<Response> {
    let params = requestParams;
    let baseHeaders: HeadersInit = {};

    if (params.method !== 'GET' || (params.method !== 'GET' && params.method !== 'DELETE')) {
      baseHeaders = {
        'Content-Type': 'application/json',
      };
    }

    if (accessToken) {
      baseHeaders.Authorization = `${this.sdk.config.authorizationType} ${accessToken}`;
    }

    if (params) {
      if (!params.headers) {
        params.headers = {};
      }

      params.headers = Object.assign(baseHeaders, params.headers);
    } else {
      params = { headers: baseHeaders };
    }

    if (params.headers) {
      params.headers = removeUndefinedHeaders(params.headers);
    }

    let logId: undefined | string;
    if (this.sdk.logger) {
      logId = this.sdk.logger.logRequest({ url: input, ...params });
    }

    // eslint-disable-next-line consistent-return
    return fetch(input, params).then((response) => {
      if (this.sdk.logger) {
        this.sdk.logger.logResponse(response, logId);
      }

      if (response.status < 400) {
        return response;
      }

      if (response.status === 401) {
        return this._manageUnauthorized(response, input, params);
      }

      const httpError = getHttpErrorFromResponse(response);
      throw httpError;
    });
  }

  private _getEntityIdentifier(
    object: Record<string, unknown>
  ): null | string | number {
    const idKey = this.metadata.getIdentifierAttribute().serializedKey;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return object[idKey];
  }
}

export default AbstractClient;
