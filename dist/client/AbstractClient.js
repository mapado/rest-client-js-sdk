Object.defineProperty(exports,"__esModule",{value:true});var _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){if(Object.prototype.hasOwnProperty.call(source,key)){target[key]=source[key];}}}return target;};var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _urijs=require('urijs');var _urijs2=_interopRequireDefault(_urijs);
var _Error=require('../Error');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var




AbstractClient=function(){
function AbstractClient(sdk){_classCallCheck(this,AbstractClient);
this.sdk=sdk;
this._tokenStorage=sdk.tokenStorage;
this.entityFactory=sdk.entityFactory;
}_createClass(AbstractClient,[{key:'getDefaultParameters',value:function getDefaultParameters()

{
return[];
}},{key:'getPathBase',value:function getPathBase()

/* pathParameters = {} */{
throw new Error('AbstractClient::getPathBase can not be called directly.\n                    You must implement "getPathBase" method.');

}},{key:'getName',value:function getName()

{
throw new Error('AbstractClient::getName can not be called directly.\n                    You must implement "getName" method.');

}},{key:'find',value:function find(

id){var queryParam=arguments.length<=1||arguments[1]===undefined?{}:arguments[1];var pathParameters=arguments.length<=2||arguments[2]===undefined?{}:arguments[2];
var url=this._generateUrlFromParams(queryParam,pathParameters,id);

return this.createEntityFromJsonResponse(this.authorizedFetch(url),'item');
}},{key:'findBy',value:function findBy(

criteria){var pathParameters=arguments.length<=1||arguments[1]===undefined?{}:arguments[1];
var url=this._generateUrlFromParams(criteria,pathParameters);

return this.createEntityFromJsonResponse(this.authorizedFetch(url),'list');
}},{key:'findAll',value:function findAll()

{var pathParameters=arguments.length<=0||arguments[0]===undefined?{}:arguments[0];
return this.findBy({},pathParameters);
}},{key:'create',value:function create(

entity){var pathParameters=arguments.length<=1||arguments[1]===undefined?{}:arguments[1];
var url=this.getPathBase(pathParameters);

return this.createEntityFromJsonResponse(
this.authorizedFetch(url,{
method:'POST',
body:JSON.stringify(entity.toJSON())}),

'item');

}},{key:'update',value:function update(

entity){
var url=entity.get('@id');

return this.createEntityFromJsonResponse(
this.authorizedFetch(url,{
method:'PUT',
body:JSON.stringify(entity.toJSON())}),

'item');

}},{key:'delete',value:function _delete(

entity){
var url=entity.get('@id');
return this.createEntityFromJsonResponse(
this.authorizedFetch(url,{
method:'DELETE'}),

'item');

}},{key:'createEntityFromJsonResponse',value:function createEntityFromJsonResponse(

requestPromise,listOrItem){var _this=this;
return requestPromise.
then(function(response){return response.json();}).
then(function(val){return _this.entityFactory(val,listOrItem,_this.getName());});

}},{key:'makeUri',value:function makeUri(

input){
var url=input instanceof _urijs2.default?input:new _urijs2.default(input);
url.host(this.sdk.config.path).
scheme(this.sdk.config.scheme);


if(this.sdk.config.port){
url.port(this.sdk.config.port);
}

if(this.sdk.config.prefix){
var segments=url.segment();
segments.unshift(this.sdk.config.prefix);
url.segment(segments);
}

return url;
}},{key:'authorizedFetch',value:function authorizedFetch(

input,init){
var url=this.makeUri(input);

return this._doFetch(url.toString(),init);
}},{key:'_generateUrlFromParams',value:function _generateUrlFromParams(

queryParam){var pathParameters=arguments.length<=1||arguments[1]===undefined?{}:arguments[1];var id=arguments.length<=2||arguments[2]===undefined?null:arguments[2];
var params=queryParam;
if(this.sdk.config.useDefaultParameters){
_extends(params,this.getDefaultParameters());
}

var url=new _urijs2.default(!!id?
this.getPathBase(pathParameters)+'/'+id:
this.getPathBase(pathParameters));

if(params){
url.addSearch(params);
}

return url;
}},{key:'_doFetch',value:function _doFetch(

input,init){var _this2=this;
if(!input){
throw new Error('input is empty');
}

return this._tokenStorage.getAccessToken().
then(function(token){return _this2._fetchWithToken(token,input,init);});

}},{key:'_manageAccessDenied',value:function _manageAccessDenied(

response,input,init){var _this3=this;
return response.json().
then(function(body){
if(body.error==='invalid_grant'){
switch(body.error_description){
case'The access token provided has expired.':
if(_this3._tokenStorage){
return _this3._tokenStorage.refreshToken().
then(function(){return _this3._doFetch(input,init);}).
catch(function(){
throw new _Error.AccessDeniedError('Unable to renew access_token',response);
});

}

break;

default:
throw new _Error.AccessDeniedError(body.error_description,response);}

}

throw new _Error.AccessDeniedError('Unable to access ressource: 401 found !',response);
});

}},{key:'_fetchWithToken',value:function _fetchWithToken(

accessToken,input,init){var _this4=this;
var params=init;

var tokenHeaders={
Authorization:'Bearer '+accessToken};


if(params){
if(!params.headers){
params.headers={};
}

params.headers=_extends(params.headers,tokenHeaders);
}else{
params={headers:tokenHeaders};
}

return fetch(input,params).
then(function(response){
if(response.status===401){
return _this4._manageAccessDenied(response,input,params);
}else if(response.status===403){
throw new _Error.ForbiddenError('Forbidden acces: 403 found !',response);
}

return response;
});

}}]);return AbstractClient;}();exports.default=


AbstractClient;