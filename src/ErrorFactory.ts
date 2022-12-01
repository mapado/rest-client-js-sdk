/* eslint-disable max-classes-per-file, no-use-before-define */
/**
 * It's a bit tricky to extends native errors
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */

import { ErrorBody, Token, TokenBody } from './TokenGenerator/types';

class HttpError extends Error {
  public baseResponse: Response;

  constructor(message: null | string, baseResponse: Response) {
    super(message || 'Http errort');

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, OauthError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OauthError);
    }

    this.name = 'HttpError';
    this.baseResponse = baseResponse;
  }

  public async getBaseResponseJson(): Promise<Record<string, unknown>> {
    return this.baseResponse.json();
  }
}

class OauthError extends Error {
  public previousError: HttpError | undefined;

  constructor(message: null | string, previousError?: HttpError) {
    super(message || 'Oauth error');

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, OauthError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OauthError);
    }

    this.name = 'OauthError';
    this.previousError = previousError;
  }
}

class InvalidGrantError extends OauthError {
  public previousError: HttpError | undefined;

  constructor(message: null | string, previousError?: HttpError) {
    super(message || 'Invalid grant error', previousError);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidGrantError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidGrantError);
    }

    this.name = 'InvalidGrantError';
    this.previousError = previousError;
  }
}

class InvalidScopeError extends OauthError {
  public previousError: HttpError | undefined;

  constructor(message: null | string, previousError?: HttpError) {
    super(message || 'Invalid scope error', previousError);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InvalidScopeError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidScopeError);
    }

    this.name = 'InvalidScopeError';
    this.previousError = previousError;
  }
}

// 400
class BadRequestError extends HttpError {
  public baseResponse: Response;

  constructor(message: null | string, baseResponse: Response) {
    super(message || 'Bad request', baseResponse);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, BadRequestError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BadRequestError);
    }

    this.name = 'BadRequestError';
    this.baseResponse = baseResponse;
  }
}

// 401
class UnauthorizedError extends BadRequestError {
  public baseResponse: Response;

  constructor(message: null | string, baseResponse: Response) {
    super(message || 'Unauthorized', baseResponse);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UnauthorizedError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnauthorizedError);
    }

    this.name = 'UnauthorizedError';
    this.baseResponse = baseResponse;
  }
}

// 403
class ForbiddenError extends BadRequestError {
  public baseResponse: Response;

  constructor(message: null | string, baseResponse: Response) {
    super(message || 'Forbidden', baseResponse);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ForbiddenError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ForbiddenError);
    }

    this.name = 'ForbiddenError';
    this.baseResponse = baseResponse;
  }
}

// 404
class ResourceNotFoundError extends BadRequestError {
  public baseResponse: Response;

  constructor(message: null | string, baseResponse: Response) {
    super(message || 'Resource is not found', baseResponse);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ResourceNotFoundError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResourceNotFoundError);
    }

    this.name = 'ResourceNotFoundError';
    this.baseResponse = baseResponse;
  }
}

// 409
class ConflictError extends BadRequestError {
  public baseResponse: Response;

  constructor(message: null | string, baseResponse: Response) {
    super(message || 'Conflict detected', baseResponse);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ConflictError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConflictError);
    }

    this.name = 'ConflictError';
    this.baseResponse = baseResponse;
  }
}

// 500
class InternalServerError extends HttpError {
  public baseResponse: Response;

  constructor(message: null | string, baseResponse: Response) {
    super(message || 'Internal server error', baseResponse);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, InternalServerError.prototype);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalServerError);
    }

    this.name = 'InternalServerError';
    this.baseResponse = baseResponse;
  }
}

/**
 * @returns {HttpError}
 */
function getHttpErrorFromResponse(originalResponse: Response): HttpError {
  const response = originalResponse.clone();
  switch (true) {
    case response.status === 401:
      return new UnauthorizedError(null, response);

    case response.status === 403:
      return new ForbiddenError(null, response);

    case response.status === 404:
      return new ResourceNotFoundError(null, response);

    case response.status === 409:
      return new ConflictError(null, response);

    case response.status >= 400 && response.status < 500:
      return new BadRequestError(null, response);

    case response.status >= 500 && response.status < 600:
      return new InternalServerError(null, response);

    default:
      return new HttpError(null, response);
  }
}

function isOauthError(body: TokenBody<Token>): body is ErrorBody {
  return typeof (body as ErrorBody)?.error === 'string';
}

export {
  UnauthorizedError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  InternalServerError,
  ResourceNotFoundError,
  getHttpErrorFromResponse,
  OauthError,
  InvalidGrantError,
  InvalidScopeError,
  isOauthError,
};
