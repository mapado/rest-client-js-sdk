Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _immutable=require('immutable');function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}

function createEntity(val,listOrItem){var type=arguments.length>2&&arguments[2]!==undefined?arguments[2]:null;
return(0,_immutable.fromJS)(val);
}var

RestClientSdk=function(){
function RestClientSdk(tokenStorage,config){var _this=this;var clientList=arguments.length>2&&arguments[2]!==undefined?arguments[2]:{};var entityFactory=arguments.length>3&&arguments[3]!==undefined?arguments[3]:createEntity;_classCallCheck(this,RestClientSdk);
this._checkConfigValidity(config);

this.config=this._mergeWithBaseConfig(config);
this.tokenStorage=tokenStorage;
this.entityFactory=entityFactory;

Object.keys(clientList).forEach(function(key){
_this[key]=new clientList[key](_this);
});
}_createClass(RestClientSdk,[{key:'_mergeWithBaseConfig',value:function _mergeWithBaseConfig(

config){
var newConfig=config;
newConfig.useDefaultParameters=config.useDefaultParameters===undefined?
true:
config.useDefaultParameters;

newConfig.authorizationType=config.authorizationType||'Bearer';

return newConfig;
}},{key:'_checkConfigValidity',value:function _checkConfigValidity(

config){
if(!(config&&config.path&&config.scheme)){
throw new RangeError('SDK config is not valid, it should contain a "path", a "scheme" parameter,\n        and may contain a "port" and a "useDefaultParameters" parameter');



}
}}]);return RestClientSdk;}();exports.default=


RestClientSdk;