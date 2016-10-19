Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _urijs=require('urijs');var _urijs2=_interopRequireDefault(_urijs);
var _AbstractTokenGenerator=require('./AbstractTokenGenerator');var _AbstractTokenGenerator2=_interopRequireDefault(_AbstractTokenGenerator);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}

var ERROR_CONFIG_EMPTY='TokenGenerator config must be set';
var ERROR_CONFIG_PATH_SCHEME='TokenGenerator config is not valid, it should contain a "path", a "scheme" parameter';
var ERROR_CONFIG_CLIENT_INFORMATIONS='TokenGenerator config is not valid, it should contain a "clientId", a "clientSecret" parameter';var

ClientCredentialsGenerator=function(_AbstractTokenGenerat){_inherits(ClientCredentialsGenerator,_AbstractTokenGenerat);function ClientCredentialsGenerator(){_classCallCheck(this,ClientCredentialsGenerator);return _possibleConstructorReturn(this,(ClientCredentialsGenerator.__proto__||Object.getPrototypeOf(ClientCredentialsGenerator)).apply(this,arguments));}_createClass(ClientCredentialsGenerator,[{key:'generateToken',value:function generateToken()
{var baseParameters=arguments.length>0&&arguments[0]!==undefined?arguments[0]:{};
var parameters=baseParameters;
parameters.grant_type='client_credentials';
parameters.client_id=this.tokenGeneratorConfig.clientId;
parameters.client_secret=this.tokenGeneratorConfig.clientSecret;

var uri=new _urijs2.default(this.tokenGeneratorConfig.path).
scheme(this.tokenGeneratorConfig.scheme);


if(this.tokenGeneratorConfig.port){
uri.port(this.tokenGeneratorConfig.port);
}

var url=uri.toString();

return fetch(url,{
method:'POST',
body:this.convertMapToFormData(parameters)}).

then(function(response){
if(response.status!==200){
return response.json().
then(function(responseData){return Promise.reject(responseData);});
}

return response.json();
});
}},{key:'refreshToken',value:function refreshToken(

accessToken,parameters){
return this.generateToken(parameters);
}},{key:'checkTokenGeneratorConfig',value:function checkTokenGeneratorConfig(

config){
if(!config||Object.keys(config).length===0){
throw new RangeError(ERROR_CONFIG_EMPTY);
}

if(!(config.path&&config.scheme)){
throw new RangeError(ERROR_CONFIG_PATH_SCHEME);
}

if(!(config.clientId&&config.clientSecret)){
throw new RangeError(ERROR_CONFIG_CLIENT_INFORMATIONS);
}
}}]);return ClientCredentialsGenerator;}(_AbstractTokenGenerator2.default);exports.default=


ClientCredentialsGenerator;