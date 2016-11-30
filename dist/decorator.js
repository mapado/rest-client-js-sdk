Object.defineProperty(exports,"__esModule",{value:true});exports.

memoizePromise=memoizePromise;function memoizePromise(callback){
var cache={};
function memoized(){for(var _len=arguments.length,parameters=Array(_len),_key=0;_key<_len;_key++){parameters[_key]=arguments[_key];}
var cacheKey=JSON.stringify(parameters);

if(cache[cacheKey]){
return cache[cacheKey];
}


var value=callback.apply(this,parameters);
cache[cacheKey]=value;

if(!value||!(value instanceof Promise)){
throw new Error('Memoization Error, Async function returned non-promise value');
}


return value.then(function(internalValue){
cache[cacheKey]=false;
return internalValue;
},function(err){
cache[cacheKey]=false;
throw err;
});
}

memoized.cache=cache;
return memoized;
}