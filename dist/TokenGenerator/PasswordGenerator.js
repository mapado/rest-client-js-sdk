Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _urijs=require('urijs');var _urijs2=_interopRequireDefault(_urijs);
var _AbstractTokenGenerator=require('./AbstractTokenGenerator');var _AbstractTokenGenerator2=_interopRequireDefault(_AbstractTokenGenerator);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}

var ERROR_CONFIG_EMPTY='TokenGenerator config must be set';
var ERROR_CONFIG_PATH_SCHEME='TokenGenerator config is not valid, it should contain a "path", a "scheme" parameter';
var ERROR_CONFIG_CLIENT_INFORMATIONS='TokenGenerator config is not valid, it should contain a "clientId", a "clientSecret" parameter';

var ERROR_TOKEN_EMPTY='parameters must be set';
var ERROR_TOKEN_USERNAME_PASSWORD='username and password must be passed as parameters';
var ERROR_TOKEN_ACCESS_TOKEN_REFRESH_TOKEN='access_token and refresh_token be passed as parameters';var

PasswordGenerator=function(_AbstractTokenGenerat){_inherits(PasswordGenerator,_AbstractTokenGenerat);function PasswordGenerator(){_classCallCheck(this,PasswordGenerator);return _possibleConstructorReturn(this,Object.getPrototypeOf(PasswordGenerator).apply(this,arguments));}_createClass(PasswordGenerator,[{key:'generateToken',value:function generateToken(
baseParameters){
var parameters=baseParameters;
this._checkGenerateParameters(parameters);

parameters.grant_type='password';
parameters.client_id=this.tokenGeneratorConfig.clientId;
parameters.client_secret=this.tokenGeneratorConfig.clientSecret;

return this._doFetch(parameters);}},{key:'refreshToken',value:function refreshToken(


accessToken){var baseParameters=arguments.length<=1||arguments[1]===undefined?{}:arguments[1];
if(!(accessToken&&accessToken.refresh_token)){
throw new Error('refresh_token is not set. Did you called `generateToken` before ?');}


var parameters=baseParameters;

parameters.grant_type='refresh_token';
parameters.client_id=this.tokenGeneratorConfig.clientId;
parameters.client_secret=this.tokenGeneratorConfig.clientSecret;

parameters.refresh_token=accessToken.refresh_token;

return this._doFetch(parameters);}},{key:'checkTokenGeneratorConfig',value:function checkTokenGeneratorConfig(


config){
if(!config||Object.keys(config).length===0){
throw new RangeError(ERROR_CONFIG_EMPTY);}


if(!(config.path&&config.scheme)){
throw new RangeError(ERROR_CONFIG_PATH_SCHEME);}


if(!(config.clientId&&config.clientSecret)){
throw new RangeError(ERROR_CONFIG_CLIENT_INFORMATIONS);}}},{key:'_doFetch',value:function _doFetch(



parameters){
var uri=new _urijs2.default(this.tokenGeneratorConfig.path);
uri.scheme(this.tokenGeneratorConfig.scheme);

if(this.tokenGeneratorConfig.port){
uri.port(this.tokenGeneratorConfig.port);}


var url=uri.toString();

return fetch(url,{
method:'POST',
body:this.convertMapToFormData(parameters)}).

then(function(response){
if(response.status!==200){
return response.json().
then(function(responseData){return Promise.reject(responseData);});}


return response.json();});}},{key:'_checkGenerateParameters',value:function _checkGenerateParameters(



parameters){
if(!(parameters&&Object.keys(parameters).length>0)){
throw new RangeError(ERROR_TOKEN_EMPTY);}


if(!(parameters.username&&parameters.password)){
throw new RangeError(ERROR_TOKEN_USERNAME_PASSWORD);}}}]);return PasswordGenerator;}(_AbstractTokenGenerator2.default);exports.default=




PasswordGenerator;