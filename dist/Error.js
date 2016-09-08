Object.defineProperty(exports,"__esModule",{value:true});/**
 * It's a bit tricky to extends native errors
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 */
function AccessDeniedError(message,baseResponse){
this.name='AccessDeniedError';
this.message=message;
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
AccessDeniedError.prototype=Object.create(Error.prototype);
AccessDeniedError.prototype.constructor=AccessDeniedError;

function ForbiddenError(message,baseResponse){
this.name='ForbiddenError';
this.message=message;
this.baseResponse=baseResponse;
this.stack=new Error().stack;
}
ForbiddenError.prototype=Object.create(Error.prototype);
ForbiddenError.prototype.constructor=ForbiddenError;exports.


AccessDeniedError=AccessDeniedError;exports.
ForbiddenError=ForbiddenError;