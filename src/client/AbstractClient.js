import URI from 'urijs';
import { UnauthorizedError, getHttpErrorFromResponse } from '../ErrorFactory';

const EXPIRE_LIMIT_SECONDS = 300; // = 5 minutes

class AbstractClient {
  constructor(sdk, metadata) {
    this.sdk = sdk;
    this._tokenStorage = sdk.tokenStorage;
    this.serializer = sdk.serializer;
    this.metadata = metadata;
  }

  getDefaultParameters() {
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  getPathBase(pathParameters) {
    return `/${this.metadata.pathRoot}`;
  }

  getEntityURI(entity) {
    let idValue = this._getEntityIdentifier(entity);

    if (Number.isFinite(idValue)) {
      idValue = idValue.toString();
    }

    const pathBase = this.getPathBase({});
    if (idValue.indexOf(pathBase) > -1) {
      return idValue;
    }
    return `${pathBase}/${idValue}`;
  }

  find(id, queryParam = {}, pathParameters = {}) {
    const url = this._generateUrlFromParams(queryParam, pathParameters, id);

    return this.deserializeResponse(this.authorizedFetch(url), 'item');
  }

  findBy(queryParam, pathParameters = {}) {
    const url = this._generateUrlFromParams(queryParam, pathParameters);

    return this.deserializeResponse(this.authorizedFetch(url), 'list');
  }

  findAll(queryParam = {}, pathParameters = {}) {
    return this.findBy(queryParam, pathParameters);
  }

  create(entity, queryParam = {}, pathParameters = {}) {
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
      }),
      'item'
    );
  }

  update(entity, queryParam = {}) {
    const url = new URI(this.getEntityURI(entity));
    url.addSearch(queryParam);

    let newSerializedModel = this.serializer.normalizeItem(
      entity,
      this.metadata
    );

    const identifier = this._getEntityIdentifier(newSerializedModel);
    const oldModel = this.sdk.unitOfWork.getDirtyEntity(identifier);

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
      }),
      'item'
    );
  }

  delete(entity) {
    const url = this.getEntityURI(entity);
    const identifier = this._getEntityIdentifier(entity);

    return this.authorizedFetch(url, {
      method: 'DELETE',
    }).then(response => {
      this.sdk.unitOfWork.clear(identifier);

      return response;
    });
  }

  deserializeResponse(requestPromise, listOrItem) {
    return requestPromise
      .then(response => response.text().then(text => [response, text]))
      .then(([response, text]) => {
        if (listOrItem === 'list') {
          // for list, we need to deserialize the result to get an object
          const itemList = this.serializer.deserializeList(
            text,
            this.metadata,
            response
          );

          // eslint-disable-next-line no-restricted-syntax
          for (const decodedItem of itemList) {
            const identifier = this._getEntityIdentifier(decodedItem);
            const normalizedItem = this.serializer.normalizeItem(decodedItem);

            // then we register the re-normalized item
            this.sdk.unitOfWork.registerClean(identifier, normalizedItem);
          }

          return itemList;
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
        );

        this.sdk.unitOfWork.registerClean(
          identifier,
          this.serializer.normalizeItem(item)
        );

        return item;
      });
  }

  makeUri(input) {
    const url = input instanceof URI ? input : new URI(input);
    url.host(this.sdk.config.path).scheme(this.sdk.config.scheme);

    if (this.sdk.config.port) {
      url.port(this.sdk.config.port);
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

  authorizedFetch(input, init) {
    const url = this.makeUri(input);

    return this._fetchWithToken(url.toString(), init);
  }

  _generateUrlFromParams(queryParam, pathParameters = {}, id = null) {
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

  _fetchWithToken(input, init) {
    if (!input) {
      throw new Error('input is empty');
    }

    if (this._tokenStorage) {
      return Promise.all([
        this._tokenStorage.getCurrentTokenExpiresIn(),
        this._tokenStorage.getAccessToken(),
      ])
        .then(([accessTokenExpiresIn, accessToken]) => {
          if (
            accessTokenExpiresIn !== null &&
            accessTokenExpiresIn <= EXPIRE_LIMIT_SECONDS
          ) {
            return this._tokenStorage
              .refreshToken()
              .then(refreshedTokenObject => refreshedTokenObject.access_token);
          }

          return accessToken;
        })
        .then(token => this._doFetch(token, input, init));
    }

    return this._doFetch(null, input, init);
  }

  _refreshTokenAndRefetch(response, input, init) {
    return this._tokenStorage.refreshToken().then(() => {
      const params = Object.assign({}, init, {
        headers: Object.assign({}, init.headers),
      });
      delete params.headers.Authorization;

      return this._fetchWithToken(input, params);
    });
  }

  _manageUnauthorized(response, input, init) {
    const error = getHttpErrorFromResponse(response);

    // https://tools.ietf.org/html/rfc2617#section-1.2
    const authorizationHeader = response.headers.get('www-authenticate');
    if (authorizationHeader) {
      const invalidGrant = authorizationHeader.indexOf(
        'error = "invalid_grant"'
      );
      if (invalidGrant && this._tokenStorage) {
        return this._refreshTokenAndRefetch(response, input, init);
      }

      throw error;
    } else {
      // if www-authenticate header is missing, try and read json response
      return response
        .json()
        .then(body => {
          if (this._tokenStorage && body.error === 'invalid_grant') {
            return this._refreshTokenAndRefetch(response, input, init);
          }
          throw error;
        })
        .catch(() => {
          throw error;
        });
    }
  }

  _doFetch(accessToken, input, init) {
    let params = init;

    const baseHeaders = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      baseHeaders.Authorization = `${
        this.sdk.config.authorizationType
      } ${accessToken}`;
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

    params.headers = this._removeUndefinedHeaders(params.headers);

    // eslint-disable-next-line consistent-return
    return fetch(input, params).then(response => {
      if (response.status < 400) {
        return response;
      }

      if (response.status === 401) {
        return this._manageUnauthorized(response, input, params);
      }

      if (response.status !== 401) {
        const httpError = getHttpErrorFromResponse(response);
        throw httpError;
      }
    });
  }

  _removeUndefinedHeaders(headers) {
    // remove undefined key, usefull to remove Content-Type for example
    const localHeaders = headers;
    Object.keys(localHeaders).forEach(key => {
      if (localHeaders[key] === undefined) {
        delete localHeaders[key];
      }
    });

    return localHeaders;
  }

  _getEntityIdentifier(object) {
    return object[this.metadata.getIdentifierAttribute().serializedKey];
  }
}

export default AbstractClient;
