Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}var AbstractTokenGenerator=function(){
function AbstractTokenGenerator(){var tokenGeneratorConfig=arguments.length<=0||arguments[0]===undefined?{}:arguments[0];_classCallCheck(this,AbstractTokenGenerator);
this.tokenGeneratorConfig=tokenGeneratorConfig;
this.canAutogenerateToken=false;
this.checkTokenGeneratorConfig(this.tokenGeneratorConfig);
}_createClass(AbstractTokenGenerator,[{key:"generateToken",value:function generateToken(

parameters){
throw new Error("AbstractTokenGenerator::generateToken can not be called directly.\n                    You must implement \"generateToken\" method.");

}},{key:"refreshToken",value:function refreshToken(

accessToken,parameters){
throw new Error("AbstractTokenGenerator::refreshToken can not be called directly.\n                    You must implement \"refreshToken\" method.");

}},{key:"checkTokenGeneratorConfig",value:function checkTokenGeneratorConfig(

config){
return true;
}},{key:"convertMapToFormData",value:function convertMapToFormData(

parameters){
var keys=Object.keys(parameters);

var formData=new FormData();

for(var _iterator=keys,_isArray=Array.isArray(_iterator),_i=0,_iterator=_isArray?_iterator:_iterator[typeof Symbol==="function"?Symbol.iterator:"@@iterator"]();;){var _ref;if(_isArray){if(_i>=_iterator.length)break;_ref=_iterator[_i++];}else{_i=_iterator.next();if(_i.done)break;_ref=_i.value;}var key=_ref;
formData.append(key,parameters[key]);
}

return formData;
}}]);return AbstractTokenGenerator;}();exports.default=


AbstractTokenGenerator;