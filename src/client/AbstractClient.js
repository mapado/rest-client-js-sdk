import URI from 'urijs';
import { AccessDeniedError } from '../Error';

class AbstractClient {
  constructor(sdk) {
    this.sdk = sdk;
    this._oauthClient = sdk.oauthClient;

    this.entityFactory = sdk.entityFactory;
  }

  getDefaultParameters() {
    return [];
  }

  getPathBase() {
    throw new Error(`AbstractClient::getPathBase can not be called directly.
                    You must implement "getPathBase" method.`);
  }

  getName() {
    throw new Error(`AbstractClient::getName can not be called directly.
                    You must implement "getName" method.`);
  }

  find(id, queryParam = {}) {
    const url = this._generateUrlFromParams(queryParam, id);

    return this.createEntityFromJsonResponse(this.authorizedFetch(url), 'item');
  }

  findBy(criteria) {
    const url = this._generateUrlFromParams(criteria);

    return this.createEntityFromJsonResponse(this.authorizedFetch(url), 'list');
  }

  findAll() {
    return this.findBy({});
  }

  create(entity) {
    const url = this.getPathBase();

    return this.createEntityFromJsonResponse(
      this.authorizedFetch(url, {
        method: 'POST',
        body: JSON.stringify(entity.toJSON()),
      }),
      'item'
    );
  }

  update(entity) {
    const url = entity.get('@id');

    return this.createEntityFromJsonResponse(
      this.authorizedFetch(url, {
        method: 'PUT',
        body: JSON.stringify(entity.toJSON()),
      }),
      'item'
    );
  }

  delete(entity) {
    const url = entity.get('@id');
    return this.createEntityFromJsonResponse(
      this.authorizedFetch(url, {
        method: 'DELETE',
      }),
      'item'
    );
  }

  createEntityFromJsonResponse(requestPromise, listOrItem) {
    return requestPromise
      .then(response => response.json())
      .then((val) => this.entityFactory(val, listOrItem, this.getName()))
    ;
  }

  makeTicketingUri(input) {
    const url = input instanceof URI ? input : new URI(input);
    url.host(this.sdk.config.path)
      .scheme(this.sdk.config.scheme)
    ;

    if (this.sdk.config.port) {
      url.port(this.sdk.config.port);
    }

    return url;
  }

  authorizedFetch(input, init) {
    const url = this.makeTicketingUri(input);

    return this._doFetch(url.toString(), init);
  }

  _generateUrlFromParams(queryParam, id = null) {
    const params = queryParam;
    if (this.sdk.config.useDefaultParameters) {
      Object.assign(params, this.getDefaultParameters());
    }

    const url = new URI(!!id ? `${this.getPathBase()}/${id}` : this.getPathBase());
    if (params) {
      url.addSearch(params);
    }

    return url;
  }

  _doFetch(input, init) {
    if (!input) {
      throw new Error('input is empty');
    }

    return this._oauthClient.getAccessToken()
      .then(token => this._fetchWithToken(token, input, init))
    ;
  }

  _manageAccessDenied(response, input, init) {
    return response.json()
    .then(body => {
      if (body.error === 'invalid_grant') {
        switch (body.error_description) {
          case 'The access token provided has expired.':
            if (this._oauthClient) {
              return this._oauthClient.refreshToken()
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
    ;
  }

  _fetchWithToken(accessToken, input, init) {
    let params = init;

    const tokenHeaders = {
      Authorization: `Bearer ${accessToken}`,
    };

    if (params) {
      if (!params.headers) {
        params.headers = {};
      }

      params.headers = Object.assign(params.headers, tokenHeaders);
    } else {
      params = { headers: tokenHeaders };
    }

    return fetch(input, params)
      .then(response => {
        if (response.status === 401) {
          return this._manageAccessDenied(response, input, params);
        }

        return response;
      })
    ;
  }
}

export default AbstractClient;
