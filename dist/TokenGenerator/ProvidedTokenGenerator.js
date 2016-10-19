Object.defineProperty(exports,"__esModule",{value:true});var _createClass=function(){function defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};}();var _AbstractTokenGenerator=require('./AbstractTokenGenerator');var _AbstractTokenGenerator2=_interopRequireDefault(_AbstractTokenGenerator);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self,call){if(!self){throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call&&(typeof call==="object"||typeof call==="function")?call:self;}function _inherits(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass);}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)Object.setPrototypeOf?Object.setPrototypeOf(subClass,superClass):subClass.__proto__=superClass;}var

ProvidedTokenGenerator=function(_AbstractTokenGenerat){_inherits(ProvidedTokenGenerator,_AbstractTokenGenerat);

function ProvidedTokenGenerator(token){_classCallCheck(this,ProvidedTokenGenerator);var _this=_possibleConstructorReturn(this,(ProvidedTokenGenerator.__proto__||Object.getPrototypeOf(ProvidedTokenGenerator)).call(this));

_this._token=token;
_this.canAutogenerateToken=true;return _this;
}_createClass(ProvidedTokenGenerator,[{key:'generateToken',value:function generateToken()

{
return Promise.resolve({
access_token:this._token});

}},{key:'refreshToken',value:function refreshToken()

{
return this.generateToken();
}}]);return ProvidedTokenGenerator;}(_AbstractTokenGenerator2.default);exports.default=


ProvidedTokenGenerator;