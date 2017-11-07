/**
 * It's a bit tricky to extends native errors
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */

function HttpError(message, baseResponse) {
  this.name = 'BadRequestError';
  this.message = message || 'Bad request';
  this.baseResponse = baseResponse;
  this.stack = new Error().stack;
}
HttpError.prototype = Object.create(Error.prototype);
HttpError.prototype.constructor = HttpError;

// 400
function BadRequestError(message, baseResponse) {
  this.name = 'BadRequestError';
  this.message = message || 'Bad request';
  this.baseResponse = baseResponse;
  this.stack = new Error().stack;
}
BadRequestError.prototype = Object.create(HttpError.prototype);
BadRequestError.prototype.constructor = BadRequestError;

// 401
function AccessDeniedError(message, baseResponse) {
  this.name = 'AccessDeniedError';
  this.message = message || 'Access denied';
  this.baseResponse = baseResponse;
  this.stack = new Error().stack;
}
AccessDeniedError.prototype = Object.create(BadRequestError.prototype);
AccessDeniedError.prototype.constructor = AccessDeniedError;

// 403
function ForbiddenError(message, baseResponse) {
  this.name = 'ForbiddenError';
  this.message = message || 'Forbidden';
  this.baseResponse = baseResponse;
  this.stack = new Error().stack;
}
ForbiddenError.prototype = Object.create(BadRequestError.prototype);
ForbiddenError.prototype.constructor = ForbiddenError;

// 404
function ResourceNotFoundError(message, baseResponse) {
  this.name = 'ResourceNotFoundError';
  this.message = message || 'Resource is not found';
  this.baseResponse = baseResponse;
  this.stack = new Error().stack;
}
ResourceNotFoundError.prototype = Object.create(BadRequestError.prototype);
ResourceNotFoundError.prototype.constructor = ResourceNotFoundError;

// 500
function InternalServerError(message, baseResponse) {
  this.name = 'InternalServerError';
  this.message = message || 'Internal server error';
  this.baseResponse = baseResponse;
  this.stack = new Error().stack;
}
InternalServerError.prototype = Object.create(HttpError.prototype);
InternalServerError.prototype.constructor = InternalServerError;

function handleBadResponse(response) {
  let error;

  switch (true) {
    case response.status === 401:
      error = new AccessDeniedError(null, response);
      break;
    case response.status === 403:
      error = new ForbiddenError(null, response);
      break;
    case response.status === 404:
      error = new ResourceNotFoundError(null, response);
      break;
    case response.status >= 400 && response.status < 500:
      error = new BadRequestError(null, response);
      break;
    case response.status >= 500 && response.status < 600:
      error = new InternalServerError(null, response);
      break;
    default:
      error = new Error(null, response);
      break;
  }

  return response
    .json()
    .then(body => {
      error.message = body.error_description;
      throw error;
    })
    .catch(err => {
      throw error;
    });
}

export {
  AccessDeniedError,
  BadRequestError,
  ForbiddenError,
  HttpError,
  InternalServerError,
  ResourceNotFoundError,
  handleBadResponse,
};
