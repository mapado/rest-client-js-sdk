Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _urijs=require('urijs');var _urijs2=_interopRequireDefault(_urijs);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}

var ACCESS_TOKEN_KEY='rest_client_sdk.api.access_token';var

OauthClient=function(){
function OauthClient(config,clientId,clientSecret,asyncStorage){_classCallCheck(this,OauthClient);
this._oauthConfig=config;
this._checkConfigValidity(config);

this._clientId=clientId;
this._clientSecret=clientSecret;

this.setAsyncStorage(asyncStorage);}_createClass(OauthClient,[{key:'setAsyncStorage',value:function setAsyncStorage(


asyncStorage){
this._asyncStorage=asyncStorage;}},{key:'hasAccessToken',value:function hasAccessToken()


{
return this._asyncStorage.getItem(ACCESS_TOKEN_KEY).
then(function(accessToken){return!!accessToken;});}},{key:'getAccessToken',value:function getAccessToken()


{
return this._asyncStorage.getItem(ACCESS_TOKEN_KEY).
then(function(token){return token&&JSON.parse(token).access_token;});}},{key:'logout',value:function logout()



{
return this._asyncStorage.removeItem(ACCESS_TOKEN_KEY);}},{key:'getToken',value:function getToken(


formData){var _this=this;
formData.append('client_id',this._clientId);
formData.append('client_secret',this._clientSecret);
var uri=new _urijs2.default(this._oauthConfig.path).
scheme(this._oauthConfig.scheme);


if(this._oauthConfig.port){
uri.port(this._oauthConfig.port);}


var url=uri.toString();

return fetch(url,{
method:'POST',
body:formData}).

then(function(response){
if(response.status!==200){
return response.json().
then(function(responseData){return Promise.reject(responseData);});}


return response.json();}).

then(function(responseData){
return _this._storeAccessToken(responseData).
then(function(){return responseData;});});}},{key:'refreshToken',value:function refreshToken(




scope){var _this2=this;
return this._asyncStorage.getItem(ACCESS_TOKEN_KEY).
then(function(data){
var json=JSON.parse(data);
var accessToken=json.access_token;
var refreshToken=json.refresh_token;

var formData=new FormData();
formData.append('grant_type','refresh_token');
formData.append('access_token',accessToken);
formData.append('refresh_token',refreshToken);

if(typeof scope!=='undefined'){
formData.append('scope',scope);}


return _this2.getToken(formData);});}},{key:'_storeAccessToken',value:function _storeAccessToken(




responseData){
return this._asyncStorage.
setItem(ACCESS_TOKEN_KEY,JSON.stringify(responseData));}},{key:'_checkConfigValidity',value:function _checkConfigValidity(



config){
if(!(config&&config.path&&config.scheme)){
throw new RangeError(
'OauthClient config is not valid, it should contain a "path", a "scheme" parameter');}}}]);return OauthClient;}();exports.default=





OauthClient;