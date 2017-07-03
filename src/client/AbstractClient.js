/* global fetch window */

import Url from 'domurl';
import {
  AccessDeniedError,
  handleBadResponse,
} from '../Error';

Url.prototype.setQueryObject = function setQueryObject(queryParam) {
  Object.keys(queryParam).forEach((key) => {
    this.query[key] = queryParam[key];
  });
};

class AbstractClient {
  constructor(sdk) {
    this.sdk = sdk;
    this._tokenStorage = sdk.tokenStorage;
    this.serializer = sdk.serializer;
  }

  getDefaultParameters() {
    return [];
  }

  getPathBase(pathParameters = {}) {
    throw new Error(`AbstractClient::getPathBase can not be called directly.
                    You must implement "getPathBase" method.`);
  }

  getEntityURI(entity) {
    throw new Error(`AbstractClient::getEntityURI can not be called directly.
                    You must implement "getEntityURI" method.`);
  }

  getName() {
    throw new Error(`AbstractClient::getName can not be called directly.
                    You must implement "getName" method.`);
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
    const url = new Url(this.getPathBase(pathParameters), true);
    url.setQueryObject(queryParam);

    return this.deserializeResponse(
      this.authorizedFetch(url, {
        method: 'POST',
        body: this.serializer.serializeItem(entity, this.getName()),
      }),
      'item'
    );
  }

  update(entity, queryParam = {}) {
    const url = new Url(this.getEntityURI(entity), true);
    url.setQueryObject(queryParam);

    return this.deserializeResponse(
      this.authorizedFetch(url, {
        method: 'PUT',
        body: this.serializer.serializeItem(entity, this.getName()),
      }),
      'item'
    );
  }

  delete(entity) {
    const url = this.getEntityURI(entity);
    return this.authorizedFetch(url, {
      method: 'DELETE',
    });
  }

  deserializeResponse(requestPromise, listOrItem) {
    return requestPromise
      .then(response => response.text())
      .then((text) => {
        if (listOrItem === 'list') {
          return this.serializer.deserializeList(text, this.getName());
        }

        return this.serializer.deserializeItem(text, this.getName());
      })
    ;
  }

  makeUri(input) {
    let url;
    if (input instanceof Url) {
      url = input;
    } else if (typeof input === 'object') {
      url = new Url(input.toString(), true);
    } else {
      url = new Url(input, true);
    }

    url.host = this.sdk.config.path;
    url.protocol = this.sdk.config.scheme;

    if (this.sdk.config.port) {
      url.port = this.sdk.config.port;
    }

    if (this.sdk.config.prefix) {
      url.path = `${this.sdk.config.prefix}/${url.path}`;
    }

    return url.toString();
  }

  authorizedFetch(input, init) {
    const url = this.makeUri(input);

    return this._doFetch(url, init);
  }

  _generateUrlFromParams(queryParam, pathParameters = {}, id = null) {
    const params = queryParam;
    if (this.sdk.config.useDefaultParameters) {
      Object.assign(params, this.getDefaultParameters());
    }

    const path = id ?
      `${this.getPathBase(pathParameters)}/${id}` :
      this.getPathBase(pathParameters);

    const url = new Url(path, true);
    if (params) {
      url.setQueryObject(params);
    }

    return url;
  }

  _doFetch(input, init) {
    if (!input) {
      throw new Error('input is empty');
    }

    return this._tokenStorage.getAccessToken()
      .then(token => this._fetchWithToken(token, input, init))
    ;
  }

  _manageAccessDenied(response, input, init) {
    return response.json()
      .then(body => {
        if (body.error === 'invalid_grant') {
          switch (body.error_description) {
            case 'The access token provided has expired.':
              if (this._tokenStorage) {
                return this._tokenStorage.refreshToken()
                  .then(() => this._doFetch(input, init))
                  .catch(() => {
                    throw new AccessDeniedError('Unable to renew access_token', response);
                  })
                ;
              }

              break;

            default:
              throw new AccessDeniedError(body.error_description, response);
          }
        }

        throw new AccessDeniedError('Unable to access ressource: 401 found !', response);
      })
      .catch(() => {
        throw new AccessDeniedError('Unable to access ressource: 401 found !', response);
      })
    ;
  }

  _fetchWithToken(accessToken, input, init) {
    let params = init;

    const baseHeaders = {
      Authorization: `${this.sdk.config.authorizationType} ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const currentUri = typeof window === 'object' && window.location && window.location.href;
    if (currentUri) {
      baseHeaders.Referer = currentUri;
    }

    if (params) {
      if (!params.headers) {
        params.headers = {};
      }

      params.headers = Object.assign(params.headers, baseHeaders);
    } else {
      params = { headers: baseHeaders };
    }

    return fetch(input, params)
      .then((response) => {
        if (response.status < 400) {
          return response;
        }

        if (response.status === 401) {
          return this._manageAccessDenied(response, input, params);
        }

        if (response.status !== 401) {
          return handleBadResponse(response);
        }
      })
    ;
  }
}

export default AbstractClient;
