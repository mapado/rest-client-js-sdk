import URI from 'urijs';
import { OauthError, getHttpErrorFromResponse } from '../ErrorFactory';
import TokenStorage from '../TokenStorage';
import { Token } from '../TokenGenerator/types';
import { removeAuthorization, removeUndefinedHeaders } from './headerUtils';
// eslint-disable-next-line import/no-duplicates
import type RestClientSdk from '../RestClientSdk';
// eslint-disable-next-line import/no-duplicates
import type { SdkMetadata } from '../RestClientSdk';
import type ClassMetadata from '../Mapping/ClassMetadata';
import type SerializerInterface from '../serializer/SerializerInterface';

const EXPIRE_LIMIT_SECONDS = 300; // = 5 minutes

class AbstractClient<
  M extends SdkMetadata,
  K extends keyof M,
  T extends Token
> {
  sdk: RestClientSdk<M, T>;

  #tokenStorage: TokenStorage<T>;

  serializer: SerializerInterface;

  metadata: ClassMetadata;

  constructor(sdk: RestClientSdk<M, T>, metadata: ClassMetadata) {
    this.sdk = sdk;
    this.#tokenStorage = sdk.tokenStorage;
    this.serializer = sdk.serializer;
    this.metadata = metadata;
  }

  getDefaultParameters(): object {
    return {};
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPathBase(pathParameters: object): string {
    return `/${this.metadata.pathRoot}`;
  }

  getEntityURI(entity: M[K][0]): string {
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

  find(
    id: string | number,
    queryParam = {},
    pathParameters = {},
    requestParams = {}
  ): Promise<M[K][0]> {
    const url = this._generateUrlFromParams(queryParam, pathParameters, id);

    return this.deserializeResponse(
      this.authorizedFetch(url, requestParams),
      'item'
    ) as Promise<M[K][0]>;
  }

  findBy(
    queryParam: object,
    pathParameters = {},
    requestParams = {}
  ): Promise<M[K][1]> {
    const url = this._generateUrlFromParams(queryParam, pathParameters);

    return this.deserializeResponse(
      this.authorizedFetch(url, requestParams),
      'list'
    ) as Promise<M[K][1]>;
  }

  findAll(
    queryParam = {},
    pathParameters = {},
    requestParams = {}
  ): Promise<M[K][1]> {
    return this.findBy(queryParam, pathParameters, requestParams);
  }

  create(
    entity: M[K][0],
    queryParam = {},
    pathParameters = {},
    requestParams = {}
  ): Promise<M[K][0]> {
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
    ) as Promise<M[K][0]>;
  }

  update(
    entity: M[K][0],
    queryParam = {},
    requestParams = {}
  ): Promise<M[K][0]> {
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
    ) as Promise<M[K][0]>;
  }

  delete(entity: M[K][0], requestParams = {}): Promise<Response> {
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

  deserializeResponse<LOR extends 'list' | 'item'>(
    requestPromise: Promise<Response>,
    listOrItem: LOR
  ): Promise<M[K][0] | M[K][1]> {
    return requestPromise
      .then((response) => response.text().then((text) => ({ response, text })))
      .then(({ response, text }) => {
        if (listOrItem === 'list') {
          // for list, we need to deserialize the result to get an object
          const itemList = this.serializer.deserializeList<M[K][0], M[K][1]>(
            text,
            this.metadata,
            response
          );

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

          return itemList as M[K][1];
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
        const item = this.serializer.denormalizeItem<M[K][0]>(
          decodedItem,
          this.metadata,
          response
        );

        if (identifier !== null) {
          this.sdk.unitOfWork.registerClean(
            identifier,
            this.serializer.normalizeItem(item, this.metadata)
          );
        }

        return item as M[K][0];
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
      if (`/${segments[0]}` !== this.sdk.mapping.idPrefix) {
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

  _generateUrlFromParams(
    queryParam: object,
    pathParameters = {},
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

  _fetchWithToken(input: string, requestParams = {}): Promise<Response> {
    if (!input) {
      throw new Error('input is empty');
    }

    if (this.#tokenStorage) {
      return Promise.all([
        this.#tokenStorage.getCurrentTokenExpiresIn(),
        this.#tokenStorage.getAccessToken(),
      ])
        .then(([accessTokenExpiresIn, accessToken]) => {
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

          return accessToken;
        })
        .then((token) => this._doFetch(token, input, requestParams));
    }

    return this._doFetch(null, input, requestParams);
  }

  _refreshTokenAndRefetch(
    input: string,
    requestParams: RequestInit = {}
  ): Promise<Response> {
    return this.#tokenStorage.refreshToken().then(() => {
      // eslint-disable-next-line prefer-const
      let { headers, ...rest } = requestParams;

      const updatedRequestParams: RequestInit = {
        ...rest,
        headers: removeAuthorization(headers),
      };

      return this._fetchWithToken(input, updatedRequestParams);
    });
  }

  _manageUnauthorized(
    response: Response,
    input: string,
    requestParams = {}
  ): Promise<Response> {
    const error = getHttpErrorFromResponse(response);

    // https://tools.ietf.org/html/rfc2617#section-1.2
    const authorizationHeader = response.headers.get('www-authenticate');
    if (authorizationHeader) {
      const invalidGrant = authorizationHeader.indexOf(
        'error = "invalid_grant"'
      );
      if (invalidGrant && this.#tokenStorage) {
        return this._refreshTokenAndRefetch(input, requestParams);
      }

      throw error;
    } else {
      // if www-authenticate header is missing, try and read json response
      return response
        .json()
        .then((body) => {
          if (this.#tokenStorage && body.error === 'invalid_grant') {
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

  _doFetch(
    accessToken: null | string,
    input: string,
    requestParams: RequestInit
  ): Promise<Response> {
    let params = requestParams;

    const baseHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      baseHeaders.Authorization = `${this.sdk.config.authorizationType} ${accessToken}`;
    }

    const currentUri =
      typeof window === 'object' && window.location && window.location.href;
    if (currentUri) {
      baseHeaders.Referer = currentUri;
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

    // eslint-disable-next-line consistent-return
    return fetch(input, params).then((response) => {
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

  _getEntityIdentifier(object: object): null | string | number {
    const idKey = this.metadata.getIdentifierAttribute().serializedKey;

    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    return object[idKey];
  }
}

type Headers = {
  [key: string]: unknown;
};

export default AbstractClient;
