Object.defineProperty(exports,"__esModule",{value:true});




function HttpError(baseResponse,message){
this.name='BadRequestError';
this.message=message||'Bad request';
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
HttpError.prototype=Object.create(Error.prototype);
HttpError.prototype.constructor=HttpError;


function BadRequestError(baseResponse,message){
this.name='BadRequestError';
this.message=message||'Bad request';
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
BadRequestError.prototype=Object.create(HttpError.prototype);
BadRequestError.prototype.constructor=BadRequestError;


function AccessDeniedError(message,baseResponse){
this.name='AccessDeniedError';
this.message=message||'Access denied';
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
AccessDeniedError.prototype=Object.create(BadRequestError.prototype);
AccessDeniedError.prototype.constructor=AccessDeniedError;


function ForbiddenError(message,baseResponse){
this.name='ForbiddenError';
this.message=message||'Forbidden';
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
ForbiddenError.prototype=Object.create(BadRequestError.prototype);
ForbiddenError.prototype.constructor=ForbiddenError;


function ResourceNotFoundError(baseResponse,message){
this.name='ResourceNotFoundError';
this.message=message||'Resource is not found';
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
ResourceNotFoundError.prototype=Object.create(BadRequestError.prototype);
ResourceNotFoundError.prototype.constructor=ResourceNotFoundError;


function InternalServerError(message,baseResponse){
this.name='InternalServerError';
this.message=message||'Internal server error';
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
InternalServerError.prototype=Object.create(HttpError.prototype);
InternalServerError.prototype.constructor=InternalServerError;exports.


AccessDeniedError=AccessDeniedError;exports.
ForbiddenError=ForbiddenError;exports.
BadRequestError=BadRequestError;exports.
ResourceNotFoundError=ResourceNotFoundError;exports.
InternalServerError=InternalServerError;