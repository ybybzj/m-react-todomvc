require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
module.exports = function assertFn(fn){
  if(typeof fn !== 'function'){
    throw new TypeError('Function is expected here! But given: '+ fn);
  }
};
},{}],3:[function(require,module,exports){
var slice = require(4);
var assertFn = require(2);
var pipe = module.exports = function pipe(){
  var fns = slice(arguments);
  fns.forEach(assertFn);
  return function piped(){
    var args = slice(arguments),
        i = 0, l = fns.length, fn, result = args;
    for(; i < l; i++){
      fn = fns[i];
      result = fn.apply(this, result);
      if(result && typeof result.then === 'function'){
        var rest = pipe.apply(null, slice(fns, i+1)).bind(this);
        return result.then(rest);;
      }else{
        result = [result];
      }
    }
    return result[0];
  };
}
//test
// if(require.main === module){
//   // var Promise = require('@zj/promise');
//   var delay = function(ms){
//     return function(v){
//       if(ms == 0) return Promise.reject(new Error('Invalid arguments'));
//       return new Promise(function(resolve){
//         setTimeout(resolve.bind(null, v), ms);
//       });
//     };
//   };
//   var add1s = function(a){return a + 1000;};
//   var add2s = function(a){return a + 2000;};
//   var print = function(v){
//     console.log(v);
//     return v;
//   }
//   var fn = pipe(print,print, print,print, print);
//   var result = fn('aa');
//   console.log(result instanceof Promise);
//   // console.log(fn(0));
// }
},{"2":2,"4":4}],4:[function(require,module,exports){
//brorrowed from lamda$_slice
module.exports = function slice(args, from, to){
  switch(arguments.length){
    case 1: return slice(args, 0, args.length);
    case 2: return slice(args, from, args.length);
    default:
      var list = [];
      var idx = -1;
      var len = Math.max(0, Math.min(args.length, to) - from);
      while(++idx < len){
        list[idx] = args[from + idx];
      }
      return list;
  }
};
},{}],5:[function(require,module,exports){
var isArray = require(6);

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that are always escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re;
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i';
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name:      i,
        delimiter: null,
        optional:  false,
        repeat:    false
      });
    }
  }

  return attachKeys(path, keys);
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));
  return attachKeys(regexp, keys);
}

/**
 * Replace the specific tags with regexp strings.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @return {String}
 */
function replacePath (path, keys) {
  var index = 0;

  function replace (_, escaped, prefix, key, capture, group, suffix, escape) {
    if (escaped) {
      return escaped;
    }

    if (escape) {
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });

    prefix = prefix ? ('\\' + prefix) : '';
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  }

  return path.replace(PATH_REGEXP, replace);
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || [];

  if (!isArray(keys)) {
    options = keys;
    keys = [];
  } else if (!options) {
    options = {};
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options);
  }

  if (isArray(path)) {
    return arrayToRegexp(path, keys, options);
  }

  var strict = options.strict;
  var end = options.end !== false;
  var route = replacePath(path, keys);
  var endsWithSlash = path.charAt(path.length - 1) === '/';

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys);
}

},{"6":6}],6:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],7:[function(require,module,exports){
'use strict';

function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}
// stream mixins
var streamMixins = {
  on: bindFn(on),
  log: bindFn(log)
};
function bindFn(fn){
  return function bound(){
    var stream = this, args = [].slice.call(arguments);
    return fn.apply(null, args.concat(stream));
  }
}
// Globals
var toUpdate = [];
var inStream;

var order = [];
var orderNextIdx = -1;

var flushing = false;


function on(f, s) {
  stream([s], function() { f(s.val); });
}
function log(msg, s) {
  if(arguments.length === 1){
    s = msg;
    msg = null;
  }
  stream([s], function(){
    console.log((msg?msg+' - ' : '') + s.toString());
  });
  stream([s.end], function(){
    console.log((msg?msg+' - ' : '') + 'stream<End>');
  });
}
function _initialDepsNotMet(stream) {
  stream.depsMet = stream.deps.every(function(s) {
    return s.hasVal;
  });
  return !stream.depsMet;
}

function updateStream(s) {
  if ((s.depsMet !== true && _initialDepsNotMet(s)) ||
      (s.end !== undefined && s.end.val === true)) return;
  if (inStream !== undefined) {
    toUpdate.push(s);
    return;
  }
  inStream = s;
  var returnVal = s.fn(s, s.depsChanged);
  if (returnVal !== undefined) {
    s(returnVal);
  }
  inStream = undefined;
  
  if (s.depsChanged !== undefined) s.depsChanged = [];
  s.shouldUpdate = false;
  if (flushing === false) flushUpdate();
}



function _findDeps(s) {
  var i, listeners = s.listeners;
  if (s.queued === false) {
    s.queued = true;
    for (i = 0; i < listeners.length; ++i) {
      _findDeps(listeners[i]);
    }
    order[++orderNextIdx] = s;
  }
}

function updateDeps(s) {
  var i, o, list, listeners = s.listeners;
  for (i = 0; i < listeners.length; ++i) {
    list = listeners[i];
    if (list.end === s) {
      endStream(list);
    } else {
      if (list.depsChanged !== undefined) list.depsChanged.push(s);
      list.shouldUpdate = true;
      _findDeps(list);
    }
  }
  for (; orderNextIdx >= 0; --orderNextIdx) {
    o = order[orderNextIdx];
    if (o.shouldUpdate === true) updateStream(o);
    o.queued = false;
  }
}



function flushUpdate() {
  flushing = true;
  // while (toUpdate.length > 0) updateDeps(toUpdate.shift());
  while(toUpdate.length > 0){
    var s = toUpdate.shift();
    if(s.vals.length > 0) s.val = s.vals.shift();
    updateDeps(s);
  }
  flushing = false;
}

function isStream(stream) {
  return isFunction(stream) && stream.type === 'r$';
}

function streamToString() {
  return 'stream(' + this.val + ')';
}

function updateStreamValue(s, n) {
  if (n !== undefined && n !== null && isFunction(n.then)) {
    n.then(s)['catch'](s);
    return;
  }
  s.val = n;
  s.hasVal = true;
  if (inStream === undefined) {
    flushing = true;
    updateDeps(s);
    if (toUpdate.length > 0) flushUpdate(); else flushing = false;
  } else if (inStream === s) {
    markListeners(s, s.listeners);
  } else {
    s.vals.push(n);
    toUpdate.push(s);
  }
}

function markListeners(s, lists) {
  var i, list;
  for (i = 0; i < lists.length; ++i) {
    list = lists[i];
    if (list.end !== s) {
      if (list.depsChanged !== undefined) {
        list.depsChanged.push(s);
      }
      list.shouldUpdate = true;
    } else {
      endStream(list);
    }
  }
}

function createStream() {
  var mixinKeys = Object.keys(streamMixins);
  function s(n) {
    var i, list;
    if (arguments.length === 0) {
      return s.val;
    } else {
      updateStreamValue(s, n);
      return s;
    }
  }
  s.hasVal = false;
  s.val = undefined;
  s.vals = [];
  s.listeners = [];
  s.queued = false;
  s.end = undefined;
  s.type = "r$";
  // s.map = boundMap;
  // s.ap = ap;
  // s.of = stream;
  if(mixinKeys.length){
    mixinKeys.forEach(function(name){
      s[name] = streamMixins[name];
    });
  }
  s.toString = streamToString;

  return s;
}

function addListeners(deps, s) {
  for (var i = 0; i < deps.length; ++i) {
    deps[i].listeners.push(s);
  }
}

function createDependentStream(deps, fn) {
  var i, s = createStream();
  s.fn = fn;
  s.deps = deps;
  s.depsMet = false;
  s.depsChanged = fn.length > 1 ? [] : undefined;
  s.shouldUpdate = false;
  addListeners(deps, s);
  return s;
}

function immediate(s) {
  if (s.depsMet === false) {
    s.depsMet = true;
    updateStream(s);
  }
  return s;
}

function removeListener(s, listeners) {
  var idx = listeners.indexOf(s);
  listeners[idx] = listeners[listeners.length - 1];
  listeners.length--;
}

function detachDeps(s) {
  for (var i = 0; i < s.deps.length; ++i) {
    removeListener(s, s.deps[i].listeners);
  }
  s.deps.length = 0;
}

function endStream(s) {
  if (s.deps !== undefined) detachDeps(s);
  if (s.end !== undefined) detachDeps(s.end);
}

function endsOn(endS, s) {
  detachDeps(s.end);
  endS.listeners.push(s.end);
  s.end.deps.push(endS);
  return s;
}

function trueFn() { return true; }

function stream(arg, fn) {
  var i, s, deps, depEndStreams;
  var endStream = createDependentStream([], trueFn);
  if (arguments.length > 1) {
    deps = []; depEndStreams = [];
    for (i = 0; i < arg.length; ++i) {
      if (arg[i] !== undefined) {
        deps.push(arg[i]);
        if (arg[i].end !== undefined) depEndStreams.push(arg[i].end);
      }
    }
    s = createDependentStream(deps, fn);
    s.end = endStream;
    endStream.listeners.push(s);
    addListeners(depEndStreams, endStream);
    endStream.deps = depEndStreams;
    updateStream(s);
  } else {
    s = createStream();
    s.end = endStream;
    endStream.listeners.push(s);
    if (arguments.length === 1) s(arg);
  }
  return s;
}

stream.isStream = isStream;
stream.endsOn = endsOn;
stream.on = on;
stream.immediate = immediate;
stream.mixin = function(name, fn){
  if(typeof name === 'object'){
    Object.keys(name).forEach(function(k){
      stream.mixin(k, name[k]);
    });
    return;
  }
  streamMixins[name] = bindFn(fn);
}

module.exports = stream;
},{}],8:[function(require,module,exports){
var r$ = require(7);
module.exports = {
  createSignal: function(){
    return r$();
  },
  isSignal: function(s){
    return r$.isStream(s);
  },
  onSignal: function(f, s){
    return r$.on(f, s);
  },
  triggerSignal: function(s, val){
    s(val);
    return s;
  }
};
},{"7":7}],9:[function(require,module,exports){
var ctor = require(8);
var check = require(23);
var pipe = require(3);
var slice = require(4);
var t = require(27);

function Signal(sf, sigCtor){
  check(t.get(sf) === 'object', '[Signal constructor]Invalid sf parameter, given: '+ sf);
  this._sf = sf;
  this._ctor =  sigCtor || ctor;
  check.t({
    createSignal: 'function',
    isSignal: 'function',
    onSignal: 'function',
    triggerSignal: 'function'
  }, this._ctor, '[Signal constructor]Invalid sigCtor parameter');
  this._depsMap = _makeHash();
  this._resolvedMap = _makeHash();
  this._evtMap = _makeHash();
  this._emitterMap = _makeHash();
  this._capacity = 0;
}
Signal.prototype.add = function signal$add(name, deps){
  var composers; 
  if(t.get(deps) === 'array'){
    composers = slice(arguments, 2);
  }else{
    composers = slice(arguments, 1);
    deps = [];
  }
  check(t.get(name) === 'string', '[signal add]signal name should be a string! given: ' + name);
  check(this._depsMap[name] == null, '[signal add]signal named "' +name+ '" is already added!');
  if(deps.length){
    check.t(['string'], deps, '[signal add]deps should be an array of strings!');
  }
  check.t(['function'], composers, '[signal add]composers should be an array of functions!');
  this._depsMap[name] = {
    deps: deps,
    factory: composers
  };
  return this;
};
Signal.prototype.resolve = function signal$resolve(){
  check(this._isResolved !== true, '[signal resolve]cannot resolve signal twice!');
  var depsMap = this._depsMap,
      depsMapKeys = Object.keys(depsMap),
      i, l = depsMapKeys.length, name, def;
  for(i = 0; i < l; i++){
    name = depsMapKeys[i];
    def = depsMap[name];
    _resolve(name, def, depsMap, this._resolvedMap, this);
    if(this._capacity === l){
      break;
    }
  }
  this._isResolved = isResolved(this._depsMap, this._resolvedMap);
  check(this._isResolved === true, '[signal resolve]resolve signal failed!');
  this._depsMap = null;
  return this;
};
Signal.prototype.get = function signal$get(name){
  check(this._isResolved === true, '[signal get]should resolve signal first!');
  var result = this._resolvedMap[name];
  check(this._ctor.isSignal(result), '[signal get]couldn\'t find a signal named "'+name+'"');
  return result;
};
Signal.prototype.on = function signal$on(name, f){
  check(this._isResolved === true, '[signal on]should resolve signal first!');
  check(this._evtMap[name] == null, '[signal on]signal "'+name+'" has already been listened!');
  var self = this;
  this._evtMap[name] = f;
  this._ctor.onSignal(function(result){
    return f(self._sf.state, result);
  }, this.get(name));
  return this;
};
Signal.prototype.execute = function signal$execute(name){
  check(this.get(name) != null);
  var f = this._evtMap[name];
  check(t.get(f) === 'function', '[signal execute]signal "'+name+'" hasn\'t been listened to yet!');
  return f.apply(null, slice(arguments, 1));
};

Signal.prototype.getEmitter = function signal$getEmitter(name){
  check(this._isResolved === true, '[signal getEmitter]should resolve signal first!');
  var signal = this.get(name),
      trigger = this._emitterMap[name];
  if(trigger == null){
    trigger = this._emitterMap[name] = this._ctor.triggerSignal.bind(this._ctor, signal);
  }
  return trigger;
};
module.exports = Signal;
// helpers
function _resolve(name, def, depsMap, resolvedMap, self){
  if(resolvedMap[name]){return;}
  var deps = def.deps, factory = def.factory, resolvedSignal;
  deps = deps.map(function(depName){
    var depDef = depsMap[depName];
    check(depDef != null, '[signal resolve]Nonexist dependent signal name! given: ' + depName);
    _resolve(depName, depDef, depsMap, resolvedMap, self);
    return resolvedMap[depName];
  });
  factory = factory.length > 0 ? pipe.apply(null, factory) : self._ctor.createSignal;
  resolvedSignal = factory.apply(null, deps);
  resolvedSignal.$name = name;
  check(self._ctor.isSignal(resolvedSignal), '[signal resolve]factory should produce a valid signal! given: ' + resolvedSignal);
  resolvedMap[name] = resolvedSignal;
  self._capacity++;
}

function isResolved(depsMap, resolvedMap){
  var depsMapKeys = Object.keys(depsMap),
      resolvedMapKeys = Object.keys(resolvedMap);

  if(depsMapKeys.length !== resolvedMapKeys.length){
    return false;
  }
  return depsMapKeys.sort().join('') === resolvedMapKeys.sort().join('');
}
function _makeHash(){
  return Object.create(null);
}

//test
// if(require.main === module){
//   var merge$ = require('@zj/r-stream/composer/merge');
//   var map$ = require('@zj/r-stream/composer/map');
//   var fromSequence = require('@zj/r-stream/from/sequence');
//   var signal = new Signal();
//   signal
//     .add('s1', fromSequence.bind(null, 1000, ['aa','sdfsd','wew','retwdf', 'fwefweqf']))
//     .add('s2', fromSequence.bind(null, 2000, ['aa1','sd2fsd','w3ew','etwdf', 'fweqf']))
//     .add('s3', ['s1', 's2'], merge$, map$(function(s){return s.length;}))
//     .resolve()
//     .on('s3', console.log.bind(console));
//   // signal.get('s1')('hello1');
//   // signal.get('s2')('hello2');
//   signal.get('s2').log('s2');
// }
},{"23":23,"27":27,"3":3,"4":4,"8":8}],10:[function(require,module,exports){
var Baobab = require(13);
var t = require(27);
var Ref = require(11);

function createState(initialData, facetsCfg, refsCfg, opts) {
  opts = opts || {};
  var tree, facets, refs;
  tree = new Baobab(initialData, opts);
  refs = createRefs(tree, refsCfg);
  facets = createFacets(facetsCfg, refs);
  if (facets) {
    Object.keys(facets).forEach(function(k) {
      tree.addFacet(k, facets[k]);
    });
  }

  function reset(initialData){
    var refs = this.refs,
        store = this.store;
    store.set(initialData);
    store.commit();
    Object.keys(refsCfg).forEach(function(k) {
      var ref = refs[k];
      ref.reset();
      var refDef = refsCfg[k];
      updateRef(store, refDef, ref);
    });
  }
  return {
    store: tree,
    refs: refs,
    reset: reset
  };
};


function createRefs(store, refsCfg) {
  if (t.get(refsCfg) !== 'object') {
    return {};
  }
  var refs = Object.keys(refsCfg).reduce(function(m, k) {
    var refDef = refsCfg[k];
    m[k] = updateRef(store, refDef,(new Ref()));
    return m;
  }, {});
  return refs;
}

function updateRef(store, refDef, ref) {
  var refKeys, refData, idName = 'id';
  if (t.check('string|array', refDef)) {
    refData = store.get(refDef);
  } else if (t.check({
      path: 'string|array',
      id: '?string'
    }, refDef)) {
    refData = store.get(refDef.path);
    idName = refDef.id || 'id';
  }
  if (t.get(refData) !== 'object' || (refKeys = Object.keys(refData)).length === 0) {
    return ref;
  }
  refKeys.forEach(function(refK) {
    var itemData = refData[refK];
    ref.add(refK, itemData[idName]);
  });
  return ref;
}

function createFacets(facetsCfg, refs) {
  var fKeys;
  if (t.get(facetsCfg) !== 'object' || (fKeys = Object.keys(facetsCfg)).length === 0) {
    return null;
  }
  fKeys.forEach(function(fk) {
    var fdef = facetsCfg[fk],
      orgGet = fdef.get;
    if (t.get(orgGet) === 'function') {
      fdef.get = function(data) {
        return orgGet.call(this, data, refs);
      };
    }
  });
  return facetsCfg;
}
module.exports = createState;
//test
// if (require.main === module) {
//   var curItemFacet = {
//     cursors: {
//       list: 'list',
//       messages: 'messages',
//       curId: 'curItemId'
//     },
//     get: function(data, refs) {
//       console.log(data);
//       var item = data.list[refs.list.get(data.curId)];
//       if (item) {
//         item = Object.create(item);
//         item.messages = item.msg.map(function(msgId) {
//           return data.messages[refs.message.get(msgId)].content;
//         }).join('\n');
//       }
//       return item;
//     }
//   };
//   var facets = {
//     curItem: curItemFacet
//   };
//   var refs = {
//     list: 'list',
//     message: 'messages'
//   };
//   var list = [{
//     id: '0',
//     msg: [1]
//   }, {
//     id: 1,
//     msg: [0, 2]
//   }, {
//     id: '2',
//     msg: [3]
//   }];
//   var messages = [{
//     id: 0,
//     content: "message0"
//   }, {
//     id: 1,
//     content: "message1"
//   }, {
//     id: 2,
//     content: "message2"
//   }, {
//     id: 3,
//     content: "message3"
//   }];
//   var state = createState({
//     list: {},
//     messages: {},
//     curItemId: 1
//   }, 
//    facets,
//    refs,
//    {
//     syncwrite: true,
//     // immutable: true
//   });
//   list.forEach(function(item){
//     var ref = state.refs.list.create(item.id);
//     state.store.set(['list', ref], item);
//   });
//   messages.forEach(function(msg){
//     var ref = state.refs.message.create(msg.id);
//     state.store.set(['messages', ref], msg);
//   });
//   // state.store.commit();
//   console.log(JSON.stringify(state.store.facets.curItem.get()));
//   var curRef = state.refs.list.get(state.store.get('curItemId'));
//   var curItem = state.store.get(['list', curRef]);
//   console.log(curItem);
// }
},{"11":11,"13":13,"27":27}],11:[function(require,module,exports){
var NULL_ID = '__$NULL_ID$__';
var check = require(22);
function Ref(){
  this._refs = [];
  this._ids = [];
  this._counter = 0;
  this._idx = -1;
}

var proto = Ref.prototype;
proto.reset = function(){
  this._refs.length = 0;
  this._ids.length = 0;
  this._counter = 0;
  this._idx = -1;
};
proto.create = function(id){
  var ref, id = id != null ? id : NULL_ID;
  if(this.hasId(id)){
    return this._refs[this._idx];
  }
  ref = this._counter++;
  this._ids[this._refs.push(ref) - 1] = id;
  return ref;
};

proto.get = function(id){
  return this.hasId(id) ? this._refs[this._idx] : undefined;
};

proto.update = function(ref, id){
  ref = Number(ref);
  check(!this.hasId(id),
    '[State Ref update]id('+id+ ') has already been added!'
    );
  check(this.hasRef(ref),
    '[State Ref update]ref('+ref+ ') does not exist!'
    );
  check(this._ids[this._idx] === NULL_ID,
    '[State Ref update]ref('+ref+ ') has already been updated!'
    );
  this._ids[this._idx] = id;
  return ref;
};
proto.add = function(ref, id){
  ref = Number(ref);
  check(!this.hasId(id), 
    '[State Ref update]id('+id+ ') has already been added!'
    );
  check(!this.hasRef(ref), 
    '[State Ref update]ref('+ref+ ') already exists!'
    );
  
  id = id != null ? id : NULL_ID;
  this._ids[this._refs.push(ref) - 1] = id;
  this._counter = this._counter <= ref ? ref + 1 : this._counter;
  return ref;
};
proto.remove = function(ref){
  ref = Number(ref);
  var i;
  if(this.hasRef(ref)){
    i = this._idx;
    this._refs.splice(i, 1);
    this._ids.splice(i, 1);
  }
};

proto.hasId = function(id){
  return _has(this, this._ids, id, isEqualIds);
};

proto.hasRef = function(ref){
  return _has(this, this._refs, ref);
}

proto.count = function(){
  return this._refs.length;
};

function isEqualIds(ida, idb){
  return String(ida) === String(idb);
}
function _has(self, list, item, eqFn){
  var i = list.length - 1;
  while(i >=0){
    if((!eqFn ? list[i] === item : eqFn(list[i], item))){
      break;
    }
    i--;
  }
  self._idx = i;
  return -1 < i;
}
 
module.exports = Ref;
},{"22":22}],12:[function(require,module,exports){
/**
 * Baobab Default Options
 * =======================
 *
 */
module.exports = {

  // Should the tree handle its transactions on its own?
  autoCommit: true,

  // Should the transactions be handled asynchronously?
  asynchronous: true,

  // Facets registration
  facets: {},

  // Should the tree's data be immutable?
  immutable: false,

  // Validation specifications
  validate: null,

  // Validation behaviour 'rollback' or 'notify'
  validationBehavior: 'rollback',

  // Should the user be able to write the tree synchronously?
  syncwrite: false
};

},{}],13:[function(require,module,exports){
/**
 * Baobab Public Interface
 * ========================
 *
 * Exposes the main library classes.
 */
var Baobab = require(15),
    Cursor = require(16),
    Facet = require(17),
    helpers = require(18);

// Non-writable version
Object.defineProperty(Baobab, 'version', {
  value: '1.1.1'
});

// Exposing Cursor and Facet classes
Baobab.Cursor = Cursor;
Baobab.Facet = Facet;

// Exposing helpers
Baobab.getIn = helpers.getIn;

// Exporting
module.exports = Baobab;

},{"15":15,"16":16,"17":17,"18":18}],14:[function(require,module,exports){
(function() {
  'use strict';

  /**
   * Here is the list of every allowed parameter when using Emitter#on:
   * @type {Object}
   */
  var __allowedOptions = {
    once: 'boolean',
    scope: 'object'
  };

  /**
   * Incremental id used to order event handlers.
   */
  var __order = 0;

  /**
   * A simple helper to shallowly merge two objects. The second one will "win"
   * over the first one.
   *
   * @param  {object}  o1 First target object.
   * @param  {object}  o2 Second target object.
   * @return {object}     Returns the merged object.
   */
  function shallowMerge(o1, o2) {
    var o = {},
        k;

    for (k in o1) o[k] = o1[k];
    for (k in o2) o[k] = o2[k];

    return o;
  }

  /**
   * Is the given variable a plain JavaScript object?
   *
   * @param  {mixed}  v   Target.
   * @return {boolean}    The boolean result.
   */
  function isPlainObject(v) {
    return v &&
           typeof v === 'object' &&
           !Array.isArray(v) &&
           !(v instanceof Function) &&
           !(v instanceof RegExp);
  }

  /**
   * The emitter's constructor. It initializes the handlers-per-events store and
   * the global handlers store.
   *
   * Emitters are useful for non-DOM events communication. Read its methods
   * documentation for more information about how it works.
   *
   * @return {Emitter}         The fresh new instance.
   */
  var Emitter = function() {
    this._enabled = true;

    // Dirty trick that will set the necessary properties to the emitter
    this.unbindAll();
  };

  /**
   * This method unbinds every handlers attached to every or any events. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Usage:
   * ******
   * > myEmitter.unbindAll();
   *
   * @return {Emitter}      Returns this.
   */
  Emitter.prototype.unbindAll = function() {

    this._handlers = {};
    this._handlersAll = [];
    this._handlersComplex = [];

    return this;
  };


  /**
   * This method binds one or more functions to the emitter, handled to one or a
   * suite of events. So, these functions will be executed anytime one related
   * event is emitted.
   *
   * It is also possible to bind a function to any emitted event by not
   * specifying any event to bind the function to.
   *
   * Recognized options:
   * *******************
   *  - {?boolean} once   If true, the handlers will be unbound after the first
   *                      execution. Default value: false.
   *  - {?object}  scope  If a scope is given, then the listeners will be called
   *                      with this scope as "this".
   *
   * Variant 1:
   * **********
   * > myEmitter.on('myEvent', function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on('myEvent', function(e) { console.log(e); }, { once: true });
   *
   * @param  {string}   event   The event to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >);
   * > // Or:
   * > myEmitter.on(
   * >   ['myEvent1', 'myEvent2'],
   * >   function(e) { console.log(e); }
   * >   { once: true }}
   * >);
   *
   * @param  {array}    events  The events to listen to.
   * @param  {function} handler The function to bind.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > });
   * > // Or:
   * > myEmitter.on({
   * >   myEvent1: function(e) { console.log(e); },
   * >   myEvent2: function(e) { console.log(e); }
   * > }, { once: true });
   *
   * @param  {object}  bindings An object containing pairs event / function.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.on(function(e) { console.log(e); });
   * > // Or:
   * > myEmitter.on(function(e) { console.log(e); }, { once: true});
   *
   * @param  {function} handler The function to bind to every events.
   * @param  {?object}  options Eventually some options.
   * @return {Emitter}          Returns this.
   */
  Emitter.prototype.on = function(a, b, c) {
    var i,
        l,
        k,
        event,
        eArray,
        handlersList,
        bindingObject;

    // Variant 3
    if (isPlainObject(a)) {
      for (event in a)
        this.on(event, a[event], b);
      return this;
    }

    // Variant 1, 2 and 4
    if (typeof a === 'function') {
      c = b;
      b = a;
      a = null;
    }

    eArray = [].concat(a);

    for (i = 0, l = eArray.length; i < l; i++) {
      event = eArray[i];

      bindingObject = {
        order: __order++,
        fn: b
      };

      // Defining the list in which the handler should be inserted
      if (typeof event === 'string') {
        if (!this._handlers[event])
          this._handlers[event] = [];
        handlersList = this._handlers[event];
        bindingObject.type = event;
      }
      else if (event instanceof RegExp) {
        handlersList = this._handlersComplex;
        bindingObject.pattern = event;
      }
      else if (event === null) {
        handlersList = this._handlersAll;
      }
      else {
        throw Error('Emitter.on: invalid event.');
      }

      // Appending needed properties
      for (k in c || {})
        if (__allowedOptions[k])
          bindingObject[k] = c[k];

      handlersList.push(bindingObject);
    }

    return this;
  };


  /**
   * This method works exactly as the previous #on, but will add an options
   * object if none is given, and set the option "once" to true.
   *
   * The polymorphism works exactly as with the #on method.
   */
  Emitter.prototype.once = function() {
    var args = Array.prototype.slice.call(arguments),
        li = args.length - 1;

    if (isPlainObject(args[li]) && args.length > 1)
      args[li] = shallowMerge(args[li], {once: true});
    else
      args.push({once: true});

    return this.on.apply(this, args);
  };


  /**
   * This method unbinds one or more functions from events of the emitter. So,
   * these functions will no more be executed when the related events are
   * emitted. If the functions were not bound to the events, nothing will
   * happen, and no error will be thrown.
   *
   * Variant 1:
   * **********
   * > myEmitter.off('myEvent', myHandler);
   *
   * @param  {string}   event   The event to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 2:
   * **********
   * > myEmitter.off(['myEvent1', 'myEvent2'], myHandler);
   *
   * @param  {array}    events  The events to unbind the handler from.
   * @param  {function} handler The function to unbind.
   * @return {Emitter}          Returns this.
   *
   * Variant 3:
   * **********
   * > myEmitter.off({
   * >   myEvent1: myHandler1,
   * >   myEvent2: myHandler2
   * > });
   *
   * @param  {object} bindings An object containing pairs event / function.
   * @return {Emitter}         Returns this.
   *
   * Variant 4:
   * **********
   * > myEmitter.off(myHandler);
   *
   * @param  {function} handler The function to unbind from every events.
   * @return {Emitter}          Returns this.
   *
   * Variant 5:
   * **********
   * > myEmitter.off(event);
   *
   * @param  {string} event     The event we should unbind.
   * @return {Emitter}          Returns this.
   */
  function filter(target, fn) {
    target = target || [];

    var a = [],
        l,
        i;

    for (i = 0, l = target.length; i < l; i++)
      if (target[i].fn !== fn)
        a.push(target[i]);

    return a;
  }

  Emitter.prototype.off = function(events, fn) {
    var i,
        n,
        k,
        event;

    // Variant 4:
    if (arguments.length === 1 && typeof events === 'function') {
      fn = arguments[0];

      // Handlers bound to events:
      for (k in this._handlers) {
        this._handlers[k] = filter(this._handlers[k], fn);

        if (this._handlers[k].length === 0)
          delete this._handlers[k];
      }

      // Generic Handlers
      this._handlersAll = filter(this._handlersAll, fn);

      // Complex handlers
      this._handlersComplex = filter(this._handlersComplex, fn);
    }

    // Variant 5
    else if (arguments.length === 1 && typeof events === 'string') {
      delete this._handlers[events];
    }

    // Variant 1 and 2:
    else if (arguments.length === 2) {
      var eArray = [].concat(events);

      for (i = 0, n = eArray.length; i < n; i++) {
        event = eArray[i];

        this._handlers[event] = filter(this._handlers[event], fn);

        if ((this._handlers[event] || []).length === 0)
          delete this._handlers[event];
      }
    }

    // Variant 3
    else if (isPlainObject(events)) {
      for (k in events)
        this.off(k, events[k]);
    }

    return this;
  };

  /**
   * This method retrieve the listeners attached to a particular event.
   *
   * @param  {?string}    Name of the event.
   * @return {array}      Array of handler functions.
   */
  Emitter.prototype.listeners = function(event) {
    var handlers = this._handlersAll || [],
        complex = false,
        h,
        i,
        l;

    if (!event)
      throw Error('Emitter.listeners: no event provided.');

    handlers = handlers.concat(this._handlers[event] || []);

    for (i = 0, l = this._handlersComplex.length; i < l; i++) {
      h = this._handlersComplex[i];

      if (~event.search(h.pattern)) {
        complex = true;
        handlers.push(h);
      }
    }

    // If we have any complex handlers, we need to sort
    if (this._handlersAll.length || complex)
      return handlers.sort(function(a, b) {
        return a.order - b.order;
      });
    else
      return handlers.slice(0);
  };

  /**
   * This method emits the specified event(s), and executes every handlers bound
   * to the event(s).
   *
   * Use cases:
   * **********
   * > myEmitter.emit('myEvent');
   * > myEmitter.emit('myEvent', myData);
   * > myEmitter.emit(['myEvent1', 'myEvent2']);
   * > myEmitter.emit(['myEvent1', 'myEvent2'], myData);
   * > myEmitter.emit({myEvent1: myData1, myEvent2: myData2});
   *
   * @param  {string|array} events The event(s) to emit.
   * @param  {object?}      data   The data.
   * @return {Emitter}             Returns this.
   */
  Emitter.prototype.emit = function(events, data) {

    // Short exit if the emitter is disabled
    if (!this._enabled)
      return this;

    // Object variant
    if (isPlainObject(events)) {

      for (var k in events)
        this.emit(k, events[k]);

      return this;
    }

    var eArray = [].concat(events),
        onces = [],
        event,
        parent,
        handlers,
        handler,
        i,
        j,
        l,
        m;

    for (i = 0, l = eArray.length; i < l; i++) {
      handlers = this.listeners(eArray[i]);

      for (j = 0, m = handlers.length; j < m; j++) {
        handler = handlers[j];
        event = {
          type: eArray[i],
          target: this
        };

        if (arguments.length > 1)
          event.data = data;

        handler.fn.call('scope' in handler ? handler.scope : this, event);

        if (handler.once)
          onces.push(handler);
      }

      // Cleaning onces
      for (j = onces.length - 1; j >= 0; j--) {
        parent = onces[j].type ?
          this._handlers[onces[j].type] :
          onces[j].pattern ?
            this._handlersComplex :
            this._handlersAll;

        parent.splice(parent.indexOf(onces[j]), 1);
      }
    }

    return this;
  };


  /**
   * This method will unbind all listeners and make it impossible to ever
   * rebind any listener to any event.
   */
  Emitter.prototype.kill = function() {

    this.unbindAll();
    this._handlers = null;
    this._handlersAll = null;
    this._handlersComplex = null;
    this._enabled = false;

    // Nooping methods
    this.unbindAll =
    this.on =
    this.once =
    this.off =
    this.emit =
    this.listeners = Function.prototype;
  };


  /**
   * This method disabled the emitter, which means its emit method will do
   * nothing.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.disable = function() {
    this._enabled = false;

    return this;
  };


  /**
   * This method enables the emitter.
   *
   * @return {Emitter} Returns this.
   */
  Emitter.prototype.enable = function() {
    this._enabled = true;

    return this;
  };


  /**
   * Version:
   */
  Emitter.version = '3.0.1';


  // Export:
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = Emitter;
    exports.Emitter = Emitter;
  } else if (typeof define === 'function' && define.amd)
    define('emmett', [], function() {
      return Emitter;
    });
  else
    this.Emitter = Emitter;
}).call(this);

},{}],15:[function(require,module,exports){
/**
 * Baobab Data Structure
 * ======================
 *
 * A handy data tree with cursors.
 */
var Cursor = require(16),
    EventEmitter = require(14),
    Facet = require(17),
    helpers = require(18),
    update = require(21),
    merge = require(19),
    defaults = require(12),
    type = require(20);

var uniqid = (function() {
  var i = 0;
  return function() {
    return i++;
  };
})();

/**
 * Main Class
 */
function Baobab(initialData, opts) {
  if (arguments.length < 1)
    initialData = {};

  // New keyword optional
  if (!(this instanceof Baobab))
    return new Baobab(initialData, opts);

  if (!type.Object(initialData) && !type.Array(initialData))
    throw Error('Baobab: invalid data.');

  // Extending
  EventEmitter.call(this);

  // Merging defaults
  this.options = helpers.shallowMerge(defaults, opts);

  // Privates
  this._transaction = {};
  this._future = undefined;
  this._cursors = {};
  this._identity = '[object Baobab]';

  // Properties
  this.log = [];
  this.previousData = null;
  this.data = initialData;
  this.root = this.select();
  this.facets = {};

  // Immutable tree?
  if (this.options.immutable)
    helpers.deepFreeze(this.data);

  // Boostrapping root cursor's methods
  function bootstrap(name) {
    this[name] = function() {
      var r = this.root[name].apply(this.root, arguments);
      return r instanceof Cursor ? this : r;
    };
  }

  [
    'apply',
    'chain',
    'get',
    'merge',
    'push',
    'set',
    'splice',
    'unset',
    'unshift',
    'update'
  ].forEach(bootstrap.bind(this));

  // Facets
  if (!type.Object(this.options.facets))
    throw Error('Baobab: invalid facets.');

  for (var k in this.options.facets)
    this.addFacet(k, this.options.facets[k]);
}

helpers.inherits(Baobab, EventEmitter);

/**
 * Prototype
 */
Baobab.prototype.addFacet = function(name, definition, args) {
  this.facets[name] = this.createFacet(definition, args);
  return this;
};

Baobab.prototype.createFacet = function(definition, args) {
  return new Facet(this, definition, args);
};

Baobab.prototype.select = function(path) {
  path = path || [];

  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (!type.Path(path))
    throw Error('Baobab.select: invalid path.');

  // Casting to array
  path = [].concat(path);

  // Computing hash
  var hash = path.map(function(step) {
    if (type.Function(step) || type.Object(step))
      return '$' + uniqid() + '$';
    else
      return step;
  }).join('|λ|');

  // Registering a new cursor or giving the already existing one for path
  var cursor;
  if (!this._cursors[hash]) {
    cursor = new Cursor(this, path, hash);
    this._cursors[hash] = cursor;
  }
  else {
    cursor = this._cursors[hash];
  }

  // Emitting an event
  this.emit('select', {path: path, cursor: cursor});
  return cursor;
};

// TODO: if syncwrite wins: drop skipMerge, this._transaction etc.
// TODO: uniq'ing the log through path hashing
Baobab.prototype.stack = function(spec, skipMerge) {
  var self = this;

  if (!type.Object(spec))
    throw Error('Baobab.update: wrong specification.');

  if (!this.previousData)
    this.previousData = this.data;

  // Applying modifications
  if (this.options.syncwrite) {
    var result = update(this.data, spec, this.options);
    this.data = result.data;
    this.log = [].concat(this.log).concat(result.log);
  }
  else {
    this._transaction = (skipMerge && !Object.keys(this._transaction).length) ?
      spec :
      merge(this._transaction, spec);
  }

  // Should we let the user commit?
  if (!this.options.autoCommit)
    return this;

  // Should we update synchronously?
  if (!this.options.asynchronous)
    return this.commit();

  // Updating asynchronously
  if (!this._future)
    this._future = setTimeout(self.commit.bind(self, null), 0);

  return this;
};

Baobab.prototype.commit = function() {

  if (this._future)
    this._future = clearTimeout(this._future);

  if (!this.options.syncwrite) {

    // Applying the asynchronous transaction
    var result = update(this.data, this._transaction, this.options);
    this.data = result.data;
    this.log = result.log;
  }

  // Resetting transaction
  this._transaction = {};

  // Validate?
  var validate = this.options.validate,
      behavior = this.options.validationBehavior;

  if (typeof validate === 'function') {
    var error = validate.call(this, this.previousData, this.data, this.log);

    if (error instanceof Error) {
      this.emit('invalid', {error: error});

      if (behavior === 'rollback') {
        this.data = this.previousData;
        return this;
      }
    }
  }

  // Baobab-level update event
  this.emit('update', {
    log: this.log,
    previousData: this.previousData,
    data: this.data
  });

  this.log = [];
  this.previousData = null;

  return this;
};

Baobab.prototype.release = function() {
  var k;

  delete this.data;
  delete this._transaction;

  // Releasing cursors
  for (k in this._cursors)
    this._cursors[k].release();
  delete this._cursors;

  // Releasing facets
  for (k in this.facets)
    this.facets[k].release();
  delete this.facets;

  // Killing event emitter
  this.kill();
};

/**
 * Output
 */
Baobab.prototype.toJSON = function() {
  return this.get();
};

Baobab.prototype.toString = function() {
  return this._identity;
};

/**
 * Export
 */
module.exports = Baobab;

},{"12":12,"14":14,"16":16,"17":17,"18":18,"19":19,"20":20,"21":21}],16:[function(require,module,exports){
/**
 * Baobab Cursor Abstraction
 * ==========================
 *
 * Nested selection into a baobab tree.
 */
var EventEmitter = require(14),
    helpers = require(18),
    defaults = require(12),
    type = require(20);

/**
 * Main Class
 */
function Cursor(tree, path, hash) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Enforcing array
  path = path || [];

  // Privates
  this._identity = '[object Cursor]';
  this._additionnalPaths = [];

  // Properties
  this.tree = tree;
  this.path = path;
  this.hash = hash;
  this.archive = null;
  this.recording = false;
  this.undoing = false;

  // Path initialization
  this.complex = type.ComplexPath(path);
  this.solvedPath = path;

  if (this.complex)
    this.solvedPath = helpers.solvePath(this.tree.data, path, this.tree);

  if (this.complex)
    path.forEach(function(step) {
      if (type.Object(step) && '$cursor' in step)
        this._additionnalPaths.push(step.$cursor);
    }, this);

  // Relevant?
  this.relevant = this.get(false) !== undefined;

  // Root listeners
  function update(previousData) {
    var record = helpers.getIn(previousData, self.solvedPath, self.tree);

    if (self.recording && !self.undoing) {

      // Handle archive
      self.archive.add(record);
    }

    self.undoing = false;
    return self.emit('update', {
      data: self.get(false),
      previousData: record
    });
  }

  this.updateHandler = function(e) {
    var log = e.data.log,
        previousData = e.data.previousData,
        shouldFire = false,
        c, p, l, m, i, j;

    // Solving path if needed
    if (self.complexPath)
      self.solvedPath = helpers.solvePath(self.tree.data, self.path, self.tree);

    // If selector listens at tree, we fire
    if (!self.path.length)
      return update(previousData);

    // Checking update log to see whether the cursor should update.
    if (self.solvedPath)
      shouldFire = helpers.solveUpdate(
        log,
        [self.solvedPath].concat(self._additionnalPaths)
      );

    // Handling relevancy
    var data = self.get(false) !== undefined;

    if (self.relevant) {
      if (data && shouldFire) {
        update(previousData);
      }
      else if (!data) {
        self.emit('irrelevant');
        self.relevant = false;
      }
    }
    else {
      if (data && shouldFire) {
        self.emit('relevant');
        update(previousData);
        self.relevant = true;
      }
    }
  };

  // Lazy binding
  var bound = false;

  this._lazyBind = function() {
    if (bound)
      return;
    bound = true;

    self.tree.on('update', self.updateHandler);
  };

  this.on = helpers.before(this._lazyBind, this.on.bind(this));
  this.once = helpers.before(this._lazyBind, this.once.bind(this));

  if (this.complexPath)
    this._lazyBind();
}

helpers.inherits(Cursor, EventEmitter);

/**
 * Predicates
 */
Cursor.prototype.isRoot = function() {
  return !this.path.length;
};

Cursor.prototype.isLeaf = function() {
  return type.Primitive(this.get(false));
};

Cursor.prototype.isBranch = function() {
  return !this.isLeaf() && !this.isRoot();
};

/**
 * Traversal
 */
Cursor.prototype.root = function() {
  return this.tree.root;
};

Cursor.prototype.select = function(path) {
  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  if (!type.Path(path))
    throw Error('baobab.Cursor.select: invalid path.');
  return this.tree.select(this.path.concat(path));
};

Cursor.prototype.up = function() {
  if (this.solvedPath && this.solvedPath.length)
    return this.tree.select(this.path.slice(0, -1));
  else
    return null;
};

Cursor.prototype.left = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.left: cannot go left on a non-list type.');

  return last ?
    this.tree.select(this.solvedPath.slice(0, -1).concat(last - 1)) :
    null;
};

Cursor.prototype.leftmost = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.leftmost: cannot go left on a non-list type.');

  return this.tree.select(this.solvedPath.slice(0, -1).concat(0));
};

Cursor.prototype.right = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.right: cannot go right on a non-list type.');

  if (last + 1 === this.up().get(false).length)
    return null;

  return this.tree.select(this.solvedPath.slice(0, -1).concat(last + 1));
};

Cursor.prototype.rightmost = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (isNaN(last))
    throw Error('baobab.Cursor.right: cannot go right on a non-list type.');

  var list = this.up().get(false);

  return this.tree.select(this.solvedPath.slice(0, -1).concat(list.length - 1));
};

Cursor.prototype.down = function() {
  var last = +this.solvedPath[this.solvedPath.length - 1];

  if (!(this.get(false) instanceof Array))
    return null;

  return this.tree.select(this.solvedPath.concat(0));
};

Cursor.prototype.map = function(fn, scope) {
  var array = this.get(false),
      l = arguments.length;

  if (!type.Array(array))
    throw Error('baobab.Cursor.map: cannot map a non-list type.');

  return array.map(function(item, i) {
    return fn.call(
      l > 1 ? scope : this,
      this.select(i),
      i
    );
  }, this);
};

/**
 * Access
 */
Cursor.prototype.get = function(path) {
  var skipEvent = false;

  if (path === false) {
    path = [];
    skipEvent = true;
  }

  if (arguments.length > 1)
    path = helpers.arrayOf(arguments);

  var fullPath = this.solvedPath.concat(
    [].concat(path || path === 0 ? path : [])
  );

  // Retrieving data
  var data = helpers.getIn(this.tree.data, fullPath, this.tree);

  // Emitting an event
  if (!skipEvent)
    this.tree.emit('get', {path: fullPath, data: data});

  return data;
};

/**
 * Update
 */
function pathPolymorphism(method, allowedType, key, val) {
  if (arguments.length > 5)
    throw Error('baobab.Cursor.' + method + ': too many arguments.');

  if (method === 'unset') {
    val = true;

    if (arguments.length === 2)
      key = [];
  }

  else if (arguments.length < 4) {
    val = key;
    key = [];
  }

  if (!type.Path(key))
    throw Error('baobab.Cursor.' + method + ': invalid path "' + key + '".');

  // Splice exception
  if (method === 'splice' &&
      !type.Splicer(val)) {
    if (type.Array(val))
      val = [val];
    else
      throw Error('baobab.Cursor.splice: incorrect value.');
  }

  // Checking value validity
  if (allowedType && !allowedType(val))
    throw Error('baobab.Cursor.' + method + ': incorrect value.');

  var path = [].concat(key),
      solvedPath = helpers.solvePath(this.get(false), path, this.tree);

  if (!solvedPath)
    throw Error('baobab.Cursor.' + method + ': could not solve dynamic path.');

  var leaf = {};
  leaf['$' + method] = val;

  var spec = helpers.pathObject(solvedPath, leaf);

  return spec;
}

function makeUpdateMethod(command, type) {
  Cursor.prototype[command] = function() {
    var spec = pathPolymorphism.bind(this, command, type).apply(this, arguments);

    return this.update(spec, true);
  };
}

makeUpdateMethod('set');
makeUpdateMethod('apply', type.Function);
makeUpdateMethod('chain', type.Function);
makeUpdateMethod('push');
makeUpdateMethod('unshift');
makeUpdateMethod('merge', type.Object);
makeUpdateMethod('splice');

Cursor.prototype.unset = function(key) {
  if (key === undefined && this.isRoot())
    throw Error('baobab.Cursor.unset: cannot remove root node.');

  var spec = pathPolymorphism.bind(this, 'unset', null).apply(this, arguments);

  return this.update(spec, true);
};

Cursor.prototype.update = function(spec, skipMerge) {
  if (!type.Object(spec))
    throw Error('baobab.Cursor.update: invalid specifications.');

  this.tree.stack(helpers.pathObject(this.solvedPath, spec), skipMerge);
  return this;
};

/**
 * History
 */
Cursor.prototype.startRecording = function(maxRecords) {
  maxRecords = maxRecords || 5;

  if (maxRecords < 1)
    throw Error('baobab.Cursor.startRecording: invalid maximum number of records.');

  if (this.archive)
    return this;

  // Lazy bind
  this._lazyBind();

  this.archive = helpers.archive(maxRecords);
  this.recording = true;
  return this;
};

Cursor.prototype.stopRecording = function() {
  this.recording = false;
  return this;
};

Cursor.prototype.undo = function(steps) {
  steps = steps || 1;

  if (!this.recording)
    throw Error('baobab.Cursor.undo: cursor is not recording.');

  if (!type.PositiveInteger(steps))
    throw Error('baobab.Cursor.undo: expecting a positive integer.');

  var record = this.archive.back(steps);

  if (!record)
    throw Error('baobab.Cursor.undo: cannot find a relevant record (' + steps + ' back).');

  this.undoing = true;
  return this.set(record);
};

Cursor.prototype.hasHistory = function() {
  return !!(this.archive && this.archive.get().length);
};

Cursor.prototype.getHistory = function() {
  return this.archive ? this.archive.get() : [];
};

Cursor.prototype.clearHistory = function() {
  this.archive = null;
  return this;
};

/**
 * Releasing
 */
Cursor.prototype.release = function() {

  // Removing listener on parent
  this.tree.off('update', this.updateHandler);

  // If the cursor is hashed, we unsubscribe from the parent
  if (this.hash)
    delete this.tree._cursors[this.hash];

  // Dereferencing
  delete this.tree;
  delete this.path;
  delete this.solvedPath;
  delete this.archive;

  // Killing emitter
  this.kill();
};

/**
 * Output
 */
Cursor.prototype.toJSON = function() {
  return this.get();
};

Cursor.prototype.toString = function() {
  return this._identity;
};

/**
 * Export
 */
module.exports = Cursor;

},{"12":12,"14":14,"18":18,"20":20}],17:[function(require,module,exports){
/**
 * Baobab Facet Abstraction
 * =========================
 *
 * Facets enable the user to define views on a given Baobab tree.
 */
var EventEmitter = require(14),
    Cursor = require(16),
    helpers = require(18),
    type = require(20);

function Facet(tree, definition, args) {
  var self = this;

  var firstTime = true,
      solved = false,
      getter = definition.get,
      facetData = null;

  // Extending event emitter
  EventEmitter.call(this);

  // Properties
  this.killed = false;
  this.tree = tree;
  this.cursors = {};
  this.facets = {};

  var cursorsMapping = definition.cursors,
      facetsMapping = definition.facets,
      complexCursors = typeof definition.cursors === 'function',
      complexFacets = typeof definition.facets === 'function';

  // Refreshing the internal mapping
  function refresh(complexity, targetMapping, targetProperty, mappingType, refreshArgs) {
    if (!complexity && !firstTime)
      return;

    solved = false;

    var solvedMapping = targetMapping;

    if (complexity)
      solvedMapping = targetMapping.apply(this, refreshArgs);

    if (!mappingType(solvedMapping))
      throw Error('baobab.Facet: incorrect ' + targetProperty + ' mapping.');

    self[targetProperty] = {};

    Object.keys(solvedMapping).forEach(function(k) {

      if (targetProperty === 'cursors') {
        if (solvedMapping[k] instanceof Cursor) {
          self.cursors[k] = solvedMapping[k];
          return;
        }

        if (type.Path(solvedMapping[k])) {
          self.cursors[k] = tree.select(solvedMapping[k]);
          return;
        }
      }

      else {
        if (solvedMapping[k] instanceof Facet) {
          self.facets[k] = solvedMapping[k];
          return;
        }

        if (typeof solvedMapping[k] === 'string') {
          self.facets[k] = tree.facets[solvedMapping[k]];

          if (!self.facets[k])
            throw Error('baobab.Facet: unkown "' + solvedMapping[k] + '" facet in facets mapping.');
          return;
        }
      }
    });
  }

  this.refresh = function(refreshArgs) {
    refreshArgs = refreshArgs || [];

    if (!type.Array(refreshArgs))
      throw Error('baobab.Facet.refresh: first argument should be an array.');

    if (cursorsMapping)
      refresh(
        complexCursors,
        cursorsMapping,
        'cursors',
        type.FacetCursors,
        refreshArgs
      );

    if (facetsMapping)
      refresh(
        complexFacets,
        facetsMapping,
        'facets',
        type.FacetFacets,
        refreshArgs
      );
  };

  // Data solving
  this.get = function() {
    if (solved)
      return facetData;

    // Solving
    var data = {},
        k;

    for (k in self.facets)
      data[k] = self.facets[k].get();

    for (k in self.cursors)
      data[k] = self.cursors[k].get();

    // Applying getter
    data = typeof getter === 'function' ?
      getter.call(self, data) :
      data;

    solved = true;
    facetData = data;

    return facetData;
  };

  // Tracking the tree's updates
  function cursorsPaths(cursors) {
    return Object.keys(cursors).map(function(k) {
      return cursors[k].solvedPath;
    });
  }

  function facetsPaths(facets) {
    var paths =  Object.keys(facets).map(function(k) {
      return cursorsPaths(facets[k].cursors);
    });

    return [].concat.apply([], paths);
  }

  this.updateHandler = function(e) {
    if (self.killed)
      return;

    var paths = cursorsPaths(self.cursors).concat(facetsPaths(self.facets));

    if (helpers.solveUpdate(e.data.log, paths)) {
      solved = false;
      self.emit('update');
    }
  };

  // Init routine
  this.refresh(args);
  this.tree.on('update', this.updateHandler);

  firstTime = false;
}

helpers.inherits(Facet, EventEmitter);

Facet.prototype.release = function() {
  this.tree.off('update', this.updateHandler);

  this.tree = null;
  this.cursors = null;
  this.facets = null;
  this.killed = true;
  this.kill();
};

module.exports = Facet;

},{"14":14,"16":16,"18":18,"20":20}],18:[function(require,module,exports){
(function (global){
/**
 * Baobab Helpers
 * ===============
 *
 * Miscellaneous helper functions.
 */
var type = require(20);

// Make a real array of an array-like object
function arrayOf(o) {
  return Array.prototype.slice.call(o);
}

// Decorate a function by applying something before it
function before(decorator, fn) {
  return function() {
    decorator.apply(null, arguments);
    fn.apply(null, arguments);
  };
}

// Non-mutative splice function
function splice(array, index, nb /*, &elements */) {
  var elements = arrayOf(arguments).slice(3);

  return array
    .slice(0, index)
    .concat(elements)
    .concat(array.slice(index + nb));
}

// Shallow merge
function shallowMerge(o1, o2) {
  var o = {},
      k;

  for (k in o1) o[k] = o1[k];
  for (k in o2) o[k] = o2[k];

  return o;
}

// Clone a regexp
function cloneRegexp(re) {
  var pattern = re.source,
      flags = '';

  if (re.global) flags += 'g';
  if (re.multiline) flags += 'm';
  if (re.ignoreCase) flags += 'i';
  if (re.sticky) flags += 'y';
  if (re.unicode) flags += 'u';

  return new RegExp(pattern, flags);
}

// Cloning function
function cloner(deep, item) {
  if (!item ||
      typeof item !== 'object' ||
      item instanceof Error ||
      ('ArrayBuffer' in global && item instanceof ArrayBuffer))
    return item;

  // Array
  if (type.Array(item)) {
    if (deep) {
      var i, l, a = [];
      for (i = 0, l = item.length; i < l; i++)
        a.push(deepClone(item[i]));
      return a;
    }
    else {
      return item.slice(0);
    }
  }

  // Date
  if (type.Date(item))
    return new Date(item.getTime());

  // RegExp
  if (item instanceof RegExp)
    return cloneRegexp(item);

  // Object
  if (type.Object(item)) {
    var k, o = {};

    if (item.constructor && item.constructor !== Object)
      o = Object.create(item.constructor.prototype);

    for (k in item)
      if (item.hasOwnProperty(k))
        o[k] = deep ? deepClone(item[k]) : item[k];
    return o;
  }

  return item;
}

// Shallow & deep cloning functions
var shallowClone = cloner.bind(null, false),
    deepClone = cloner.bind(null, true);

// Freezing function
function freezer(deep, o) {
  if (typeof o !== 'object')
    return;

  Object.freeze(o);

  if (!deep)
    return;

  if (Array.isArray(o)) {

    // Iterating through the elements
    var i,
        l;

    for (i = 0, l = o.length; i < l; i++)
      deepFreeze(o[i]);
  }
  else {
    var p,
        k;

    for (k in o) {
      p = o[k];

      if (!p ||
          !o.hasOwnProperty(k) ||
          typeof p !== 'object' ||
          Object.isFrozen(p))
        continue;

      deepFreeze(p);
    }
  }
}

// Shallow & deep freezing function
var freeze = Object.freeze ? freezer.bind(null, false) : Function.prototype,
    deepFreeze = Object.freeze ? freezer.bind(null, true) : Function.prototype;

// Simplistic composition
function compose(fn1, fn2) {
  return function(arg) {
    return fn2(fn1(arg));
  };
}

// Get first item matching predicate in list
function first(a, fn) {
  var i, l;
  for (i = 0, l = a.length; i < l; i++) {
    if (fn(a[i]))
      return a[i];
  }
  return;
}

function index(a, fn) {
  var i, l;
  for (i = 0, l = a.length; i < l; i++) {
    if (fn(a[i]))
      return i;
  }
  return -1;
}

// Compare object to spec
function compare(object, spec) {
  var ok = true,
      k;

  // If we reached here via a recursive call, object may be undefined because
  // not all items in a collection will have the same deep nesting structure
  if (!object) {
    return false;
  }

  for (k in spec) {
    if (type.Object(spec[k])) {
      ok = ok && compare(object[k], spec[k]);
    }
    else if (type.Array(spec[k])) {
      ok = ok && !!~spec[k].indexOf(object[k]);
    }
    else {
      if (object[k] !== spec[k])
        return false;
    }
  }

  return ok;
}

function firstByComparison(object, spec) {
  return first(object, function(e) {
    return compare(e, spec);
  });
}

function indexByComparison(object, spec) {
  return index(object, function(e) {
    return compare(e, spec);
  });
}

// Retrieve nested objects
function getIn(object, path, tree) {
  path = path || [];

  var c = object,
      p,
      i,
      l;

  for (i = 0, l = path.length; i < l; i++) {
    if (!c)
      return;

    if (typeof path[i] === 'function') {
      if (!type.Array(c))
        return;

      c = first(c, path[i]);
    }
    else if (typeof path[i] === 'object') {
      if (tree && '$cursor' in path[i]) {
        if (!type.Path(path[i].$cursor))
          throw Error('baobab.getIn: $cursor path must be an array.');

        p = tree.get(path[i].$cursor);
        c = c[p];
      }

      else if (!type.Array(c)) {
        return;
      }

      else {
        c = firstByComparison(c, path[i]);
      }
    }
    else {
      c = c[path[i]];
    }
  }

  return c;
}

// Solve a complex path
function solvePath(object, path, tree) {
  var solvedPath = [],
      c = object,
      idx,
      i,
      l;

  for (i = 0, l = path.length; i < l; i++) {
    if (!c)
      return null;

    if (typeof path[i] === 'function') {
      if (!type.Array(c))
        return;

      idx = index(c, path[i]);
      solvedPath.push(idx);
      c = c[idx];
    }
    else if (typeof path[i] === 'object') {
      if (tree && '$cursor' in path[i]) {
        if (!type.Path(path[i].$cursor))
          throw Error('baobab.getIn: $cursor path must be an array.');

        p = tree.get(path[i].$cursor);
        solvedPath.push(p);
        c = c[p];
      }

      else if (!type.Array(c)) {
        return;
      }

      else {
        idx = indexByComparison(c, path[i]);
        solvedPath.push(idx);
        c = c[idx];
      }
    }
    else {
      solvedPath.push(path[i]);
      c = c[path[i]] || {};
    }
  }

  return solvedPath;
}

// Determine whether an update should fire for the given paths
// NOTES: 1) if performance becomes an issue, the threefold loop can be
//           simplified to become a complex twofold one.
//        2) a regex version could also work but I am not confident it would be
//           faster.
function solveUpdate(log, paths) {
  var i, j, k, l, m, n, p, c, s;

  // Looping through possible paths
  for (i = 0, l = paths.length; i < l; i++) {
    p = paths[i];

    if (!p.length)
      return true;

    // Looping through logged paths
    for (j = 0, m = log.length; j < m; j++) {
      c = log[j];

      if (!c.length)
        return true;

      // Looping through steps
      for (k = 0, n = c.length; k < n; k++) {
        s = c[k];

        // If path is not relevant, we break
        if (s != p[k])
          break;

        // If we reached last item and we are relevant
        if (k + 1 === n || k + 1 === p.length)
          return true;
      }
    }
  }

  return false;
}

// Return a fake object relative to the given path
function pathObject(path, spec) {
  var l = path.length,
      o = {},
      c = o,
      i;

  if (!l)
    o = spec;

  for (i = 0; i < l; i++) {
    c[path[i]] = (i + 1 === l) ? spec : {};
    c = c[path[i]];
  }

  return o;
}

// Shim used for cross-compatible event emitting extension
function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  var TempCtor = function () {};
  TempCtor.prototype = superCtor.prototype;
  ctor.prototype = new TempCtor();
  ctor.prototype.constructor = ctor;
}

// Archive
function archive(size) {
  var records = [];

  return {
    add: function(record) {
      records.unshift(record);

      if (records.length > size)
        records.length = size;
    },
    back: function(steps) {
      var record = records[steps - 1];

      if (record)
        records = records.slice(steps);
      return record;
    },
    get: function() {
      return records;
    }
  };
}

module.exports = {
  archive: archive,
  arrayOf: arrayOf,
  before: before,
  freeze: freeze,
  deepClone: deepClone,
  deepFreeze: deepFreeze,
  shallowClone: shallowClone,
  shallowMerge: shallowMerge,
  compose: compose,
  getIn: getIn,
  inherits: inherits,
  pathObject: pathObject,
  solvePath: solvePath,
  solveUpdate: solveUpdate,
  splice: splice
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"20":20}],19:[function(require,module,exports){
/**
 * Baobab Merge
 * =============
 *
 * A function used to merge updates in the stack.
 */
var helpers = require(18),
    type = require(20);

// Helpers
var COMMANDS = ['$unset', '$set', '$apply'];

function only(command, commandValue) {
  var o = {};
  o[command] = commandValue;
  return o;
}

// Main function
function merge(a, b) {
  var o = helpers.shallowClone(a || {}),
      leafLevel = false,
      k,
      i;

  COMMANDS.forEach(function(c) {
    if (c in b) {
      o = only(c, b[c]);
      leafLevel = true;
    }
  });

  if (b.$chain) {

    if (o.$apply)
      o.$apply = helpers.compose(o.$apply, b.$chain);
    else
      o.$apply = b.$chain;

    o = only('$apply', o.$apply);
    leafLevel = true;
  }

  if (b.$merge) {
    o.$merge = helpers.shallowMerge(o.$merge || {}, b.$merge);
    leafLevel = true;
  }

  if (b.$splice || b.$splice) {
    o.$splice = [].concat(o.$splice || []).concat(b.$splice || []);
    leafLevel = true;
  }

  if (b.$push || o.$push) {
    o.$push = [].concat(o.$push || []).concat(b.$push || []);
    leafLevel = true;
  }

  if (b.$unshift || o.$unshift) {
    o.$unshift = [].concat(b.$unshift || []).concat(o.$unshift || []);
    leafLevel = true;
  }

  if (leafLevel)
    return o;

  for (k in o) {
    if (k.charAt(0) === '$')
      delete o[k];
  }

  for (k in b) {
    if (type.Object(b[k]))
      o[k] = merge(o[k], b[k]);
  }

  return o;
}

module.exports = merge;

},{"18":18,"20":20}],20:[function(require,module,exports){
/**
 * Baobab Type Checking
 * =====================
 *
 * Misc helpers functions used throughout the library to perform some type
 * tests at runtime.
 *
 * @christianalfoni
 */
var type = {};

/**
 * Helpers
 */
function anyOf(value, allowed) {
  return allowed.some(function(t) {
    return type[t](value);
  });
}

/**
 * Simple types
 */
type.Array = function(value) {
  return Array.isArray(value);
};

type.Object = function(value) {
  return value &&
         typeof value === 'object' &&
         !Array.isArray(value) &&
         !(value instanceof Date) &&
         !(value instanceof RegExp);
};

type.String = function(value) {
  return typeof value === 'string';
};

type.Number = function(value) {
  return typeof value === 'number';
};

type.PositiveInteger = function(value) {
  return typeof value === 'number' && value > 0 && value % 1 === 0;
};

type.Function = function(value) {
  return typeof value === 'function';
};

type.Primitive = function(value) {
  return value !== Object(value);
};

type.Date = function(value) {
  return value instanceof Date;
};

/**
 * Complex types
 */
type.NonScalar = function(value) {
  return type.Object(value) || type.Array(value);
};

type.Splicer = function(value) {
  return type.Array(value) &&
         value.every(type.Array);
};

type.Path = function(value, allowed) {
  allowed = allowed || ['String', 'Number', 'Function', 'Object'];

  if (type.Array(value)) {
    return value.every(function(step) {
      return anyOf(step, allowed);
    });
  }
  else {
    return anyOf(value, allowed);
  }
};

type.ComplexPath = function(value) {
  return value.some(function(step) {
    return anyOf(step, ['Object', 'Function']);
  });
};

type.FacetCursors = function(value) {
  if (!type.Object(value))
    return false;

  return Object.keys(value).every(function(k) {
    var v = value[k];

    return type.Path(v, ['String', 'Number', 'Object']) ||
           v instanceof require(16);
  });
};

type.FacetFacets = function(value) {
  if (!type.Object(value))
    return false;

  return Object.keys(value).every(function(k) {
    var v = value[k];

    return typeof v === 'string' ||
           v instanceof require(17);
  });
};

module.exports = type;

},{"16":16,"17":17}],21:[function(require,module,exports){
/**
 * Baobab Update
 * ==============
 *
 * A handy method to mutate an atom according to the given specification.
 * Mostly inspired by http://facebook.github.io/react/docs/update.html
 */
var helpers = require(18),
    type = require(20);

// Helpers
function makeError(path, message) {
  var e = new Error('baobab.update: ' + message + ' at path /' +
                    path.slice(1).join('/'));

  e.path = path;
  return e;
}

module.exports = function(data, spec, opts) {
  opts = opts || {};

  var log = {};

  // Shifting root
  data = {root: helpers.shallowClone(data)};

  // Closure performing the updates themselves
  var mutator = function(o, spec, path, parent) {
    path = path || ['root'];

    var hash = path.join('|λ|'),
        lastKey = path[path.length - 1],
        oldValue = o[lastKey],
        fn,
        k,
        v,
        i,
        l;

    // Are we at leaf level?
    var leafLevel = Object.keys(spec).some(function(k) {
      return k.charAt(0) === '$';
    });

    // Leaf level updates
    if (leafLevel) {
      log[hash] = true;

      for (k in spec) {

        // $unset
        if (k === '$unset') {
          var olderKey = path[path.length - 2];

          if (!type.Object(parent[olderKey]))
            throw makeError(path.slice(0, -1), 'using command $unset on a non-object');

          parent[olderKey] = helpers.shallowClone(o);
          delete parent[olderKey][lastKey];

          if (opts.immutable)
            helpers.freeze(parent[olderKey]);
          break;
        }

        // $set
        if (k === '$set') {
          v = spec.$set;

          o[lastKey] = v;
        }

        // $apply
        else if (k === '$apply' || k === '$chain') {
          fn = spec.$apply || spec.$chain;

          if (typeof fn !== 'function')
            throw makeError(path, 'using command $apply with a non function');

          o[lastKey] = fn.call(null, oldValue);
        }

        // $merge
        else if (k === '$merge') {
          v = spec.$merge;

          if (!type.Object(o[lastKey]) || !type.Object(v))
            throw makeError(path, 'using command $merge with a non object');

          o[lastKey] = helpers.shallowMerge(o[lastKey], v);
        }

        // $splice
        if (k === '$splice') {
          v = spec.$splice;

          if (!type.Array(o[lastKey]))
            throw makeError(path, 'using command $push to a non array');

          for (i = 0, l = v.length; i < l; i++)
            o[lastKey] = helpers.splice.apply(null, [o[lastKey]].concat(v[i]));
        }

        // $push
        if (k === '$push') {
          v = spec.$push;

          if (!type.Array(o[lastKey]))
            throw makeError(path, 'using command $push to a non array');

          o[lastKey] = o[lastKey].concat(v);
        }

        // $unshift
        if (k === '$unshift') {
          v = spec.$unshift;

          if (!type.Array(o[lastKey]))
            throw makeError(path, 'using command $unshift to a non array');

          o[lastKey] = [].concat(v).concat(o[lastKey]);
        }

        // Deep freezing the new value?
        if (opts.immutable)
          helpers.deepFreeze(o);
      }
    }
    else {

      // If nested object does not exist, we create it
      if (type.Primitive(o[lastKey]))
        o[lastKey] = {};
      else
        o[lastKey] = helpers.shallowClone(o[lastKey]);

      // Should we freeze the parent?
      if (opts.immutable)
        helpers.freeze(o);

      for (k in spec)  {

        // Recur
        mutator(
          o[lastKey],
          spec[k],
          path.concat(k),
          o
        );
      }
    }
  };

  mutator(data, spec);

  // Returning data and path log
  return {
    data: data.root,

    // SHIFT LOG
    log: Object.keys(log).map(function(hash) {
      return hash.split('|λ|').slice(1);
    })
  };
};

},{"18":18,"20":20}],22:[function(require,module,exports){
function check(condition, msg, error){
  if(!condition){
    if(msg instanceof Error){
      throw msg;
    }else if(arguments.length > 2){
      throw new error(msg);
    }else{
      throw new Error(msg);
    }
  }
}
module.exports = check;

},{}],23:[function(require,module,exports){
var t = require(27);
var check = require(22);
function check_t(description, val, msg){
  msg = msg || 'Invalid Type';
  var result = t.scan(description, val);
  check(!result.error, result.error && _makeErr(msg, result));
}
function _makeErr(msg, info){
  var err = new TypeError(msg + (info.path ? '\nPath: [' +info.path+']': '')+ '\n' + info.error);
  err.info = info;
  return err;
}

check.t = check_t;
module.exports = check;
},{"22":22,"27":27}],24:[function(require,module,exports){
/*! Native Promise Only
    v0.7.8-a (c) Kyle Simpson
    MIT License: http://getify.mit-license.org
*/
/*jshint validthis:true */
"use strict";
module.exports = require(25);

// //test
// if(require.main === module){
//   console.log(nativePromise);
//   // console.log(Promise);
// }
},{"25":25}],25:[function(require,module,exports){
if(typeof Promise === 'function'){
  module.exports = Promise;
}else{
  module.exports = require(26);
}
},{"26":26}],26:[function(require,module,exports){
(function (process){
"use strict";
var builtInProp, cycle, scheduling_queue,
  ToString = Object.prototype.toString,
  timer = (function() {
    var isNode = typeof process !== "undefined" && {}.toString.call(process) === "[object process]";
    if (isNode) {
      return process.nextTick;
    } else if (typeof setImmediate !== "undefined") {
      return setImmediate;
    } else {
      return setTimeout;
    }
  })();
// dammit, IE8.
try {
  Object.defineProperty({}, "x", {});
  builtInProp = function builtInProp(obj, name, val, config) {
    return Object.defineProperty(obj, name, {
      value: val,
      writable: true,
      configurable: config !== false
    });
  };
} catch (err) {
  builtInProp = function builtInProp(obj, name, val) {
    obj[name] = val;
    return obj;
  };
}
// Note: using a queue instead of array for efficiency
scheduling_queue = (function Queue() {
  var first, last, item;

  function Item(fn, self) {
    this.fn = fn;
    this.self = self;
    this.next = void 0;
  }
  return {
    add: function add(fn, self) {
      item = new Item(fn, self);
      if (last) {
        last.next = item;
      } else {
        first = item;
      }
      last = item;
      item = void 0;
    },
    drain: function drain() {
      var f = first;
      first = last = cycle = void 0;
      while (f) {
        f.fn.call(f.self);
        f = f.next;
      }
    }
  };
})();

function schedule(fn, self) {
  scheduling_queue.add(fn, self);
  if (!cycle) {
    cycle = timer(scheduling_queue.drain);
  }
}
// promise duck typing
function isThenable(o) {
  var _then, o_type = typeof o;
  if (o != null && (o_type == "object" || o_type == "function")) {
    _then = o.then;
  }
  return typeof _then == "function" ? _then : false;
}

function notify() {
  for (var i = 0; i < this.chain.length; i++) {
    notifyIsolated(this, (this.state === 1) ? this.chain[i].success : this.chain[i].failure, this.chain[i]);
  }
  this.chain.length = 0;
}
// NOTE: This is a separate function to isolate
// the `try..catch` so that other code can be
// optimized better
function notifyIsolated(self, cb, chain) {
  var ret, _then;
  try {
    if (cb === false) {
      chain.reject(self.msg);
    } else {
      if (cb === true) {
        ret = self.msg;
      } else {
        ret = cb.call(void 0, self.msg);
      }
      if (ret === chain.promise) {
        chain.reject(TypeError("Promise-chain cycle"));
      } else if (_then = isThenable(ret)) {
        _then.call(ret, chain.resolve, chain.reject);
      } else {
        chain.resolve(ret);
      }
    }
  } catch (err) {
    chain.reject(err);
  }
}

function resolve(msg) {
  var _then, def_wrapper, self = this;
  // already triggered?
  if (self.triggered) {
    return;
  }
  self.triggered = true;
  // unwrap
  if (self.def) {
    self = self.def;
  }
  try {
    if (_then = isThenable(msg)) {
      def_wrapper = new MakeDefWrapper(self);
      _then.call(msg, function $resolve$() {
        resolve.apply(def_wrapper, arguments);
      }, function $reject$() {
        reject.apply(def_wrapper, arguments);
      });
    } else {
      self.msg = msg;
      self.state = 1;
      if (self.chain.length > 0) {
        schedule(notify, self);
      }
    }
  } catch (err) {
    reject.call(def_wrapper || (new MakeDefWrapper(self)), err);
  }
}

function reject(msg) {
  var self = this;
  // already triggered?
  if (self.triggered) {
    return;
  }
  self.triggered = true;
  // unwrap
  if (self.def) {
    self = self.def;
  }
  self.msg = msg;
  self.state = 2;
  if (self.chain.length > 0) {
    schedule(notify, self);
  }
}

function iteratePromises(Constructor, arr, resolver, rejecter) {
  for (var idx = 0; idx < arr.length; idx++) {
    (function IIFE(idx) {
      Constructor.resolve(arr[idx]).then(function $resolver$(msg) {
        resolver(idx, msg);
      }, rejecter);
    })(idx);
  }
}

function MakeDefWrapper(self) {
  this.def = self;
  this.triggered = false;
}

function MakeDef(self) {
  this.promise = self;
  this.state = 0;
  this.triggered = false;
  this.chain = [];
  this.msg = void 0;
}

function Promise(executor) {
  if (typeof executor != "function") {
    throw TypeError("Not a function");
  }
  if (this.__NPO__ !== 0) {
    throw TypeError("Not a promise");
  }
  // instance shadowing the inherited "brand"
  // to signal an already "initialized" promise
  this.__NPO__ = 1;
  var def = new MakeDef(this);
  this["then"] = function then(success, failure) {
    var o = {
      success: typeof success == "function" ? success : true,
      failure: typeof failure == "function" ? failure : false
    };
    // Note: `then(..)` itself can be borrowed to be used against
    // a different promise constructor for making the chained promise,
    // by substituting a different `this` binding.
    o.promise = new this.constructor(function extractChain(resolve, reject) {
      if (typeof resolve != "function" || typeof reject != "function") {
        throw TypeError("Not a function");
      }
      o.resolve = resolve;
      o.reject = reject;
    });
    def.chain.push(o);
    if (def.state !== 0) {
      schedule(notify, def);
    }
    return o.promise;
  };
  this["catch"] = function $catch$(failure) {
    return this.then(void 0, failure);
  };
  try {
    executor.call(void 0, function publicResolve(msg) {
      resolve.call(def, msg);
    }, function publicReject(msg) {
      reject.call(def, msg);
    });
  } catch (err) {
    reject.call(def, err);
  }
}
var PromisePrototype = builtInProp({}, "constructor", Promise,
  /*configurable=*/
  false);
// Note: Android 4 cannot use `Object.defineProperty(..)` here
Promise.prototype = PromisePrototype;
// built-in "brand" to signal an "uninitialized" promise
builtInProp(PromisePrototype, "__NPO__", 0,
  /*configurable=*/
  false);
builtInProp(Promise, "resolve", function Promise$resolve(msg) {
  var Constructor = this;
  // spec mandated checks
  // note: best "isPromise" check that's practical for now
  if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
    return msg;
  }
  return new Constructor(function executor(resolve, reject) {
    if (typeof resolve != "function" || typeof reject != "function") {
      throw TypeError("Not a function");
    }
    resolve(msg);
  });
});
builtInProp(Promise, "reject", function Promise$reject(msg) {
  return new this(function executor(resolve, reject) {
    if (typeof resolve != "function" || typeof reject != "function") {
      throw TypeError("Not a function");
    }
    reject(msg);
  });
});
builtInProp(Promise, "all", function Promise$all(arr) {
  var Constructor = this;
  // spec mandated checks
  if (ToString.call(arr) != "[object Array]") {
    return Constructor.reject(TypeError("Not an array"));
  }
  if (arr.length === 0) {
    return Constructor.resolve([]);
  }
  return new Constructor(function executor(resolve, reject) {
    if (typeof resolve != "function" || typeof reject != "function") {
      throw TypeError("Not a function");
    }
    var len = arr.length,
      msgs = Array(len),
      count = 0;
    iteratePromises(Constructor, arr, function resolver(idx, msg) {
      msgs[idx] = msg;
      if (++count === len) {
        resolve(msgs);
      }
    }, reject);
  });
});
builtInProp(Promise, "race", function Promise$race(arr) {
  var Constructor = this;
  // spec mandated checks
  if (ToString.call(arr) != "[object Array]") {
    return Constructor.reject(TypeError("Not an array"));
  }
  return new Constructor(function executor(resolve, reject) {
    if (typeof resolve != "function" || typeof reject != "function") {
      throw TypeError("Not a function");
    }
    iteratePromises(Constructor, arr, function resolver(idx, msg) {
      resolve(msg);
    }, reject);
  });
});
module.exports = Promise;
}).call(this,require(1))
},{"1":1}],27:[function(require,module,exports){
/**
 * typology.js - A data validation library for Node.js and the browser,
 *
 * Version: 1.0.0
 * Sources: http://github.com/jacomyal/typology
 * Doc:     http://github.com/jacomyal/typology#readme
 *
 * License:
 * --------
 * Copyright © 2014 Alexis Jacomy (@jacomyal), Guillaume Plique (@Yomguithereal)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * The Software is provided "as is", without warranty of any kind, express or
 * implied, including but not limited to the warranties of merchantability,
 * fitness for a particular purpose and noninfringement. In no event shall the
 * authors or copyright holders be liable for any claim, damages or other
 * liability, whether in an action of contract, tort or otherwise, arising
 * from, out of or in connection with the software or the use or other dealings
 * in the Software.
 */
(function(scope) {
  'use strict';

  /**
   * Code conventions:
   * *****************
   *  - 80 characters max per line
   *  - Write "__myVar" for any global private variable
   *  - Write "_myVar" for any instance private variable
   *  - Write "myVar" any local variable
   */



  /**
   * PRIVATE GLOBALS:
   * ****************
   */

  /**
   * This object is a dictionnary that maps "[object Something]" strings to the
   * typology form "something":
   */
  var __class2type = {};

  /**
   * This array is the list of every types considered native by typology:
   */
  var __nativeTypes = { '*': true };

  (function() {
    var k,
        className,
        classes = [
          'Boolean',
          'Number',
          'String',
          'Object',
          'Array',
          'Function',
          'Arguments',
          'RegExp',
          'Date'
        ];

    // Fill types
    for (k in classes) {
      className = classes[k];
      __nativeTypes[className.toLowerCase()] = true;
      __class2type['[object ' + className + ']'] = className.toLowerCase();
    }
  })();



  /**
   * CONSTRUCTOR:
   * ************
   */
  function Typology(defs) {
    /**
     * INSTANCE PRIVATES:
     * ******************
     */

    var _self = this;

    /**
     * This objects will contain every instance-specific custom types:
     */
    var _customTypes = {};



    /**
     * INSTANCE METHODS:
     * *****************
     */

    /**
     * This function will recursively scan an object to check wether or not it
     * matches a given type. It will return null if it matches, and an Error
     * object else.
     *
     * Examples:
     * *********
     * 1. When the type matches:
     *  > types.scan('string', 'abc');
     *  will return an object like the following :
     *  {
     *    expected: 'string',
     *    type: 'string',
     *    value: 'abc'
     *  }
     *
     * 2. When a top-level type does not match:
     *  > types.scan('number', 'abc');
     *  will return an object with like the following :
     *  {
     *    error: 'Expected a "number" but found a "string".',
     *    expected: 'number',
     *    type: 'string',
     *    value: 'abc'
     *  }
     *
     * 3. When a sub-object type does not its type:
     *  > types.scan({ a: 'number' }, { a: 'abc' });
     *  will return an object like the following :
     *  {
     *    error: 'Expected a "number" but found a "string".',
     *    expected: 'number',
     *    type: 'string',
     *    value: 'abc',
     *    path: [ 'a' ]
     *  }
     *
     * 4. When a deep sub-object type does not its type:
     *  > types.scan({ a: ['number'] }, { a: [ 123, 'abc' ] });
     *  will return an object like the following :
     *  {
     *    error: 'Expected a "number" but found a "string".',
     *    expected: 'number',
     *    type: 'string',
     *    value: 'abc',
     *    path: [ 'a', 1 ]
     *  }
     *
     * 5. When a required key is missing:
     *  > types.scan({ a: 'number' }, {});
     *  will return an object like the following :
     *  {
     *    error: 'Expected a "number" but found a "undefined".',
     *    expected: 'number',
     *    type: 'undefined',
     *    value: undefined,
     *    path: [ 'a' ]
     *  }
     *
     * 6. When an unexpected key is present:
     *  > types.scan({ a: 'number' }, { a: 123, b: 456 });
     *  will return an object like the following :
     *  {
     *    error: 'Unexpected key "b".',
     *    expected: { a: 'number' },
     *    type: 'object',
     *    value: { a: 123, b: 456 }
     *  }
     *
     * @param  {*}      obj  The value to validate.
     * @param  {type}   type The type.
     * @return {?Error}      Returns null or an Error object.
     */
    this.scan = function(type, obj) {
      var a,
          i,
          l,
          k,
          res,
          nbOpt,
          objKeys,
          typeKeys,
          hasStar,
          hasTypeOf,
          optional = false,
          exclusive = false,
          typeOf = (obj === null || obj === undefined) ?
                    String(obj) :
                    (
                      __class2type[Object.prototype.toString.call(obj)] ||
                      'object'
                    ),
          requiredTypeOf = (type === null || type === undefined) ?
                            String(type) :
                            (
                              __class2type[
                                Object.prototype.toString.call(type)
                              ] ||
                              'object'
                            );

      if (requiredTypeOf === 'string') {
        a = type.replace(/^[\?\!]/, '').split(/\|/);
        l = a.length;
        for (i = 0; i < l; i++)
          if (!__nativeTypes[a[i]] && typeof _customTypes[a[i]] === 'undefined')
            throw new Error('Invalid type.');

        if (type.charAt(0) === '?')
          optional = true;
        else if (type.charAt(0) === '!')
          exclusive = true;

        l = a.length;
        for (i = 0; i < l; i++)
          if (typeof _customTypes[a[i]] !== 'undefined')
            if (
              (typeof _customTypes[a[i]].type === 'function') ?
                (_customTypes[a[i]].type.call(_self, obj) === true) :
                !this.scan(_customTypes[a[i]].type, obj).error
            ) {
              if (exclusive)
                return {
                  error: 'Expected a "' + type + '" but found a ' +
                            '"' + a[i] + '".',
                  expected: type,
                  type: a[i],
                  value: obj
                };
              else
                return {
                  expected: type,
                  type: a[i],
                  value: obj
                };
            }

        if (obj === null || obj === undefined) {
          if (!exclusive && !optional)
            return {
              error: 'Expected a "' + type + '" but found a ' +
                        '"' + typeOf + '".',
              expected: type,
              type: typeOf,
              value: obj
            };
          else
            return {
              nully: true,
              expected: type,
              type: typeOf,
              value: obj
            };

        } else {
          hasStar = ~a.indexOf('*');
          hasTypeOf = ~a.indexOf(typeOf);
          if (exclusive && (hasStar || hasTypeOf))
            return {
              error: 'Expected a "' + type + '" but found a ' +
                        '"' + (hasTypeOf ? typeOf : '*') + '".',
              expected: type,
              type: hasTypeOf ? typeOf : '*',
              value: obj
            };
          else if (!exclusive && !(hasStar || hasTypeOf))
            return {
              error: 'Expected a "' + type + '" but found a ' +
                        '"' + typeOf + '".',
              expected: type,
              type: typeOf,
              value: obj
            };
          else
            return {
              expected: type,
              type: typeOf,
              value: obj
            };
        }

      } else if (requiredTypeOf === 'object') {
        if (typeOf !== 'object')
          return {
            error: 'Expected an object but found a "' + typeOf + '".',
            expected: type,
            type: typeOf,
            value: obj
          };

        typeKeys = Object.keys(type);
        l = typeKeys.length;
        nbOpt = 0;
        for (k = 0; k < l; k++) {
          res = this.scan(type[typeKeys[k]], obj[typeKeys[k]]);
          if (res.error) {
            res.path = res.path ?
              [typeKeys[k]].concat(res.path) :
              [typeKeys[k]];
            return res;
          }
          else if (res.nully)
            nbOpt++;
        }

        objKeys = Object.keys(obj);
        if (objKeys.length > (l - nbOpt)) {
          l = objKeys.length;
          for (k = 0; k < l; k++)
            if (typeof type[objKeys[k]] === 'undefined')
              return {
                error: 'Unexpected key "' + objKeys[k] + '".',
                expected: type,
                type: typeOf,
                value: obj
              };
        }
        return {
          expected: type,
          type: typeOf,
          value: obj
        };

      } else if (requiredTypeOf === 'array') {
        if (type.length !== 1)
          throw new Error('Invalid type.');

        if (typeOf !== 'array')
          return {
            error: 'Expected an array but found a "' + typeOf + '".',
            expected: type,
            type: typeOf,
            value: obj
          };

        l = obj.length;
        for (i = 0; i < l; i++) {
          res = this.scan(type[0], obj[i]);
          if (res.error) {
            res.path = res.path ?
              [i].concat(res.path) :
              [i];
            return res;
          }
        }

        return {
          expected: type,
          type: typeOf,
          value: obj
        };
      } else
        throw new Error('Invalid type.');
    };

    /**
     * This method registers a custom type into the Typology instance. A type
     * is registered under a unique name, and is described by an object (like
     * classical C structures) or a function.
     *
     * Variant 1:
     * **********
     * > types.add('user', { id: 'string', name: '?string' });
     *
     * @param  {string}   id   The unique id of the type.
     * @param  {object}   type The corresponding structure.
     * @return {Typology}      Returns this.
     *
     * Variant 2:
     * **********
     * > types.add('integer', function(value) {
     * >   return typeof value === 'number' && value === value | 0;
     * > });
     *
     * @param  {string}   id   The unique id of the type.
     * @param  {function} type The function validating the type.
     * @return {Typology}      Returns this.
     *
     * Variant 3:
     * **********
     * > types.add({
     * >   id: 'user',
     * >   type: { id: 'string', name: '?string' }
     * > });
     *
     * > types.add({
     * >   id: 'integer',
     * >   type: function(value) {
     * >     return typeof value === 'number' && value === value | 0;
     * >   }
     * > });
     *
     * @param  {object}   specs An object describing fully the type.
     * @return {Typology}       Returns this.
     *
     * Recognized parameters:
     * **********************
     * Here is the exhaustive list of every accepted parameters in the specs
     * object:
     *
     *   {string}          id    The unique id of the type.
     *   {function|object} type  The function or the structure object
     *                           validating the type.
     *   {?[string]}       proto Eventually an array of ids of types that are
     *                           referenced in the structure but do not exist
     *                           yet.
     */
    this.add = function(a1, a2) {
      var o,
          k,
          a,
          id,
          tmp,
          type;

      // Polymorphism:
      if (arguments.length === 1) {
        if (this.get(a1) === 'object') {
          o = a1;
          id = o.id;
          type = o.type;
        } else
          throw new Error('If types.add is called with one argument, ' +
                          'this one has to be an object.');
      } else if (arguments.length === 2) {
        if (typeof a1 !== 'string' || !a1)
          throw new Error('If types.add is called with more than one ' +
                          'argument, the first one must be the string id.');
        else
          id = a1;

        type = a2;
      } else
        throw new Error('types.add has to be called ' +
                        'with one or two arguments.');

      if (this.get(id) !== 'string' || id.length === 0)
        throw new Error('A type requires an string id.');

      if (_customTypes[id] !== undefined && _customTypes[id] !== 'proto')
        throw new Error('The type "' + id + '" already exists.');

      if (__nativeTypes[id])
        throw new Error('"' + id + '" is a reserved type name.');

      _customTypes[id] = 1;

      // Check given prototypes:
      a = (o || {}).proto || [];
      a = Array.isArray(a) ? a : [a];
      tmp = {};
      for (k in a)
        if (_customTypes[a[k]] === undefined) {
          _customTypes[a[k]] = 1;
          tmp[a[k]] = 1;
        }

      if ((this.get(type) !== 'function') && !this.isValid(type))
        throw new Error('A type requires a valid definition. ' +
                        'This one can be a preexistant type or else ' +
                        'a function testing given objects.');

      // Effectively add the type:
      _customTypes[id] = (o === undefined) ?
        {
          id: id,
          type: type
        } :
        {};

      if (o !== undefined)
        for (k in o)
          _customTypes[id][k] = o[k];

      // Delete prototypes:
      for (k in tmp)
        if (k !== id)
          delete _customTypes[k];

      return this;
    };

    /**
     * This method returns true if a custom type is already registered in this
     * instance under the given key.
     *
     * @param  {string}  key A type name.
     * @return {boolean}     Returns true if the key is registered.
     */
    this.has = function(key) {
      return !!_customTypes[key];
    };

    /**
     * This method returns the native type of a given value.
     *
     * Examples:
     * *********
     * > types.get({ a: 1 }); // returns "object"
     * > types.get('abcde');  // returns "string"
     * > types.get(1234567);  // returns "number"
     * > types.get([1, 2]);   // returns "array"
     *
     * @param  {*}      value Anything.
     * @return {string}       Returns the native type of the value.
     */
    this.get = function(obj) {
      return (obj === null || obj === undefined) ?
        String(obj) :
        __class2type[Object.prototype.toString.call(obj)] || 'object';
    };

    /**
     * This method validates some value against a given type. It works exactly
     * as the #scan method, but will return true if the value matches the given
     * type and false else, instead of reporting objects.
     *
     * Examples:
     * *********
     * > types.check('object', { a: 1 });                      // returns true
     * > types.check({ a: 'string' }, { a: 1 });               // returns true
     * > types.check({ a: 'string', b: '?number' }, { a: 1 }); // returns true
     *
     * > types.check({ a: 'string', b: 'number' }, { a: 1 }); // returns false
     * > types.check({ a: 'number' }, { a: 1 });              // returns false
     * > types.check('array', { a: 1 });                      // returns false
     *
     * @param  {type}    type   A valid type.
     * @param  {*}       value  Anything.
     * @return {boolean}        Returns true if the value matches the type, and
     *                          not else.
     */
    this.check = function(type, obj) {
      return !this.scan(type, obj).error;
    };

    /**
     * This method validates a type. If the type is not referenced or is not
     * valid, it will return false.
     *
     * To know more about that function, don't hesitate to read the related
     * unit tests.
     *
     * Examples:
     * *********
     * > types.isValid('string');        // returns true
     * > types.isValid('?string');       // returns true
     * > types.isValid('!string');       // returns true
     * > types.isValid('string|number'); // returns true
     * > types.isValid({ a: 'string' }); // returns true
     * > types.isValid(['string']);      // returns true
     *
     * > types.isValid('!?string');                // returns false
     * > types.isValid('myNotDefinedType');        // returns false
     * > types.isValid(['myNotDefinedType']);      // returns false
     * > types.isValid({ a: 'myNotDefinedType' }); // returns false
     *
     * > types.isValid('user');               // returns false
     * > types.add('user', { id: 'string' }); // makes the type become valid
     * > types.isValid('user');               // returns true
     *
     * @param  {*}       type The type to get checked.
     * @return {boolean}      Returns true if the type is valid, and false else.
     */
    this.isValid = function(type) {
      var a,
          k,
          i,
          l,
          aKeys,
          typeKeys,
          typeOf = (type === null || type === undefined) ?
                    String(type) :
                    (
                      __class2type[Object.prototype.toString.call(type)] ||
                      'object'
                    );

      if (typeOf === 'string') {
        a = type.replace(/^[\?\!]/, '').split(/\|/);
        aKeys = Object.keys(a);
        l = aKeys.length;
        for (i = 0; i < l; i++)
          if (
            !__nativeTypes[a[aKeys[i]]] &&
            typeof _customTypes[a[aKeys[i]]] === 'undefined'
          )
            return false;
        return true;

      } else if (typeOf === 'object') {
        typeKeys = Object.keys(type);
        l = typeKeys.length;
        for (k = 0; k < l; k++)
          if (!this.isValid(type[typeKeys[k]]))
            return false;
        return true;

      } else if (typeOf === 'array')
        return type.length === 1 ?
          this.isValid(type[0]) :
          false;
      else
        return false;
    };



    /**
     * INSTANTIATION ROUTINE:
     * **********************
     */

    // Add a type "type" to shortcut the #isValid method:
    this.add('type', (function(v) {
      return this.isValid(v);
    }).bind(this));

    // Add a type "primitive" to match every primitive types (including null):
    this.add('primitive', function(v) {
      return !v || !(v instanceof Object || typeof v === 'object');
    });

    // Adding custom types at instantiation:
    defs = defs || {};
    if (this.get(defs) !== 'object')
      throw Error('Invalid argument.');

    for (var k in defs)
      this.add(k, defs[k]);
  }



  /**
   * GLOBAL PUBLIC API:
   * ******************
   */

  // Creating a "main" typology instance to export:
  var types = Typology;
  Typology.call(types);

  // Version:
  Object.defineProperty(types, 'version', {
    value: '1.0.0'
  });



  /**
   * EXPORT:
   * *******
   */
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = types;
    exports.types = types;
  } else if (typeof define === 'function' && define.amd)
    define('typology', [], function() {
      return types;
    });
  else
    scope.types = types;
})(this);

},{}],"fnkit":[function(require,module,exports){
throw new Error('Don not require this module!!!');
},{}],"m-react-mixins":[function(require,module,exports){
arguments[4]["fnkit"][0].apply(exports,arguments)
},{"fnkit":"fnkit"}],"m-react":[function(require,module,exports){
(function (process){
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.mReact=e()}(this,function(){"use strict";function t(){}function e(t){if(null===t)return"null";if(void 0===t)return"undefined";if(t!==t)return"NaN";var e=Object.prototype.toString.call(t).match(dt);return null==e?"unknown":e[1].toLowerCase()}function n(){return pt.apply(arguments[0],pt.call(arguments,1))}function r(t,e){return Object.prototype.hasOwnProperty.call(t,e)}function o(){for(var t,e,n,o=arguments.length,i=0;o>i&&(n=arguments[i],n!==Object(n));)i++;if(i===o)return{};for(i++;o>i;)if(e=arguments[i++],e===Object(e))for(t in e)r(e,t)&&(n[t]=e[t]);return n}function i(){var t=n(arguments);return o.apply(null,[{}].concat(t))}function s(t){if("object"!==e(t))throw new TypeError("[removeVoidValue]param should be a object! given: "+t);var n={};return Object.keys(t).forEach(function(e){void 0!==t[e]&&(n[e]=t[e])}),n}function a(t){for(var n=[],r=!0,o=0,i=t.length;i>o;o++){var s=t[o];if("array"!==e(s)){r=!1;break}n.push(s)}return n=r===!1||0===t.length?t:[].concat.apply([],n)}function l(t){switch(e(t)){case"undefined":case"null":return[];case"array":return a(t);default:return[t]}}function u(){return Object.create(null)}function c(t,n){return"string"!==e(t)||"regexp"!==e(n)?null:t.match(n)}function h(t,e){if(t===e)return e;var n=t.compareDocumentPosition(e);return 24&n?16&n?t:e:null}function f(){var t=arguments[0],r=arguments[1],o=n(arguments,2);if("string"!==e(t))throw new Error("selector in m(selector, attrs, children) should be a string");var i,s,a,l=!(null==r||"object"!==e(r)||"tag"in r||"view"in r||"subtree"in r),u={tag:"div",attrs:{}},c=[];r=l?r:{},a="class"in r?"class":"className",o=l?o:n(arguments,1),u.children="array"===e(o[0])?o[0]:o;for(;i=gt.exec(t);)""===i[1]&&i[2]?u.tag=i[2]:"#"===i[1]?u.attrs.id=i[2]:"."===i[1]?c.push(i[2]):"["===i[3][0]&&(s=mt.exec(i[3]),u.attrs[s[1]]=s[3]||(s[2]?"":!0));return c.length>0&&(u.attrs[a]=c.join(" ")),Object.keys(r).forEach(function(t){var n=r[t];u.attrs[t]=t===a&&"string"!==e(n)&&""!==n.trim()?(u.attrs[t]||"")+" "+n:n}),u}function d(){return!this instanceof d?new d:(this._index=-1,this._keys=[],void(this._values=[]))}function p(t,e){return isNaN(t)?isNaN(e):t===e}function v(t){if(t!==Object(t))throw new TypeError("[Map]Invalid value used as a map key! given: "+t)}function g(t,e,n){return t.addEventListener(e,n,!0)}function m(t,e,n){return t.removeEventListener(e,n,!0)}function y(t){return!this instanceof y?new y(t):(this.init(t),void(bt.test(t.type)?w(this,t,"key"):Et.test(t.type)&&w(this,t,"mouse")))}function w(t,e,n){for(var r=wt[n],o=0,i=r.length;i>o;o++){var s=r[o];t[s]=e[s]}}function b(t){if(!this instanceof b)return new b(t);if(t=t||_t||{documentElement:1},!t.documentElement)throw new Error('[DOMDelegator]Invalid parameter "doc", should be a document object! given: '+t);this.root=t.documentElement,this.listenedEvents=u(),this.eventDispatchers=u(),this.globalListeners=u(),this.domEvHandlerMap=new yt}function E(t,e){var n=e.globalListeners,r=e.root;return function(o){var i=n[t]||[];if(i&&i.length>0){var s=new y(o);s.target=r,_(i,s)}k(o.target,o,t,e)}}function k(t,e,n,r){var o=x(t,n,r);if(o&&o.handlers.length>0){var i=new y(e);i.currentTarget=o.currentTarget,_(o.handlers,i),i._bubbles&&k(o.currentTarget.parentNode,e,n,r)}}function x(t,e,n){if(null==t)return null;var r,o=O(n.domEvHandlerMap,t);return o&&(r=o[e])&&0!==r.length?{currentTarget:t,handlers:r}:x(t.parentNode,e,n)}function _(t,n){t.forEach(function(r){if("function"===e(r))r(n);else{if("function"!==e(r.handleEvent))throw new Error("[DOMDelegator callListeners] unknown handler found: "+JSON.stringify(t));r.handleEvent(n)}})}function O(t,e,n){return arguments.length>2?t.get(e,n):t.get(e)}function N(t,e,n,r){var o=t[e]||[];return 0===o.length&&n.listenTo(e),-1===o.indexOf(r)&&o.push(r),t[e]=o,r}function j(t,e,n,r){var o=t[e];if(!o||0===o.length||3===arguments.length)return o&&o.length&&n.unlistenTo(e),delete t[e],r;var i=o.indexOf(r);return-1!==i&&o.splice(i,1),t[e]=o,0===o.length&&(n.unlistenTo(e),delete t[e]),r}function T(t,e){return Object.keys(t).forEach(function(n){j(t,n,e)}),t}function D(n){this.options=n||{};var r=this.options.onFlush;this._cb="function"===e(r)?r:t,this._queue=[],this._startPos=0,this.flush=this.flush.bind(this)}function A(t,e){e=e||[],e=[].concat(e);for(var n=t.length-1;n>-1;n--)if(t[n]&&t[n].parentNode){e[n]&&M(e[n]),Ft.off(t[n]),Lt.remove(t[n]);try{t[n].parentNode.removeChild(t[n])}catch(r){}}0!=t.length&&(t.length=0)}function M(n){if(n.configContext&&"function"===e(n.configContext.onunload)&&(n.configContext.onunload(),n.configContext.onunload=null),n.controllers)for(var r=0,o=n.controllers.length;o>r;r++){var i=n.controllers[r];"function"===e(i.onunload)&&(i.onunload({preventDefault:t}),Nt.unloaders.remove(i))}if(n.children)if("array"===e(n.children))for(var r=0,o=n.children.length;o>r;r++){var s=n.children[r];M(s)}else n.children.tag&&M(n.children)}function C(t,n,r,o,i){return Object.keys(r).forEach(function(s){var a,l=r[s],u=o[s];if(s in o&&u===l)"value"===s&&"input"===n&&t.value!=l&&(t.value=l);else{o[s]=l;try{if("config"===s||"key"==s)return;if("function"===e(l)&&0===s.indexOf("on"))t[s]=l;else if((a=c(s,qt))&&a[1].length){var h=a[1].toLowerCase();Ht.off(t,h),P(l)&&Ht.on(t,h,l)}else"style"===s&&null!=l&&"object"===e(l)?(Object.keys(l).forEach(function(e){(null==u||u[e]!==l[e])&&(t.style[e]=l[e])}),"object"===e(u)&&Object.keys(u).forEach(function(e){e in l||(t.style[e]="")})):null!=i?"href"===s?t.setAttributeNS("http://www.w3.org/1999/xlink","href",l):"className"===s?t.setAttribute("class",l):t.setAttribute(s,l):s in t&&"list"!==s&&"style"!==s&&"form"!==s&&"type"!==s&&"width"!==s&&"height"!==s?("input"!==n||t[s]!==l)&&(t[s]=l):t.setAttribute(s,l)}catch(f){if(f.message.indexOf("Invalid argument")<0)throw f}}}),o}function P(t){return"function"===e(t)||t&&"function"===e(t.handleEvent)}function R(t,n,r,o,i,s,a,l,u,c,h){try{(null==i||null==i.toString())&&(i="")}catch(f){i=""}if("retain"===i.subtree)return s;var d,p=e(s),v=e(i);return(null==s||p!==v)&&(s=L(i,s,l,o,r,v)),"array"===v?(i=W(i),d=s.length===i.length,s=F(i,s,t),s=H(i,s,t,n,l,a,d,u,c,h)):null!=i&&"object"===v?s=q(i,s,t,l,a,u,c,h):"function"!==e(i)&&(s=B(i,s,t,n,l,a,u)),s}function L(t,e,n,r,o,i){var s,a;return null!=e&&(o&&o.nodes?(s=n-r,a=s+("array"===i?t:e.nodes).length,A(o.nodes.slice(s,a),o.slice(s,a))):e.nodes&&A(e.nodes,e)),e=new t.constructor,e.tag&&(e={}),e.nodes=[],e}function F(t,n,r){function o(t){return"string"===e(t)||"number"===e(t)&&"NaN"!==e(t)}function i(t){return t&&t.attrs&&o(t.attrs.key)?t.attrs.key:void 0}function s(t,e){t&&t.attrs&&(void 0===e?delete t.attrs.key:t.attrs.key=e)}function a(){return t.length!==n.length?!0:t.some(function(t,e){var r=n[e];return r.attrs&&t.attrs&&r.attrs.key!==t.attrs.key})}function l(t,e){var r=i(t);if(void 0!==r)if(d[r]){var o=d[r].index;d[r]={action:f,index:e,from:o,element:n.nodes[o]||_t.createElement("div")}}else d[r]={action:h,index:e}}function u(e,o){var i=e.index,s=e.action;if(s===c&&(A(n[i].nodes,n[i]),o.splice(i,1)),s===h){var a=_t.createElement("div");a.setAttribute("data-mref",i);var l=t[i].attrs.key;r.insertBefore(a,r.childNodes[i]||null),o.splice(i,0,{attrs:{key:l},nodes:[a]}),o.nodes[i]=a}s===f&&(e.element.setAttribute("data-mref",i),r.childNodes[i]!==e.element&&null!==e.element&&r.insertBefore(e.element,r.childNodes[i]||null),o[i]=n[e.from],o.nodes[i]=e.element)}var c=1,h=2,f=3,d={},p=!1;n.forEach(function(t,e){var n=i(t);s(t,n),void 0!==n&&(p=!0,d[n]={action:c,index:e})});var v=0;if(t.some(function(t){var e=i(t);return s(t,e),void 0!==e})&&t.forEach(function(t){t&&t.attrs&&null==t.attrs.key&&(t.attrs.key="__mithril__"+v++)}),p&&a()){t.forEach(l);var g=void 0,m=new Array(n.length);g=Object.keys(d).map(function(t){return d[t]}).sort(function(t,e){return t.action-e.action||t.index-e.index}),m.nodes=n.nodes.slice();for(var y=0,w=g.length;w>y;y++)u(g[y],m);n=m}return n}function H(t,n,r,o,i,s,a,l,u,c){function h(t){var h=R(r,o,n,i,t,n[d],s,i+f||f,l,u,c);void 0!==h&&(h.nodes.intact||(a=!1),f+=h.$trusted?(h.match(/<[^\/]|\>\s*[^<]/g)||[0]).length:"array"===e(h)?h.length:1,n[d++]=h)}var f=0,d=0,p=[];if(t.forEach(h),!a){for(var v=0,g=t.length;g>v;v++)null!=n[v]&&p.push.apply(p,n[v].nodes);for(var v=0,m=void 0;m=n.nodes[v];v++)null!=m.parentNode&&p.indexOf(m)<0&&A([m],[n[v]]);t.length<n.length&&(n.length=t.length),n.nodes=p}return n}function q(n,r,o,i,s,a,l,u){for(var c,h,f=[],d=[];n.view;){var p=n.view,v=n.view.$original||p,g=r.views?r.views.indexOf(v):-1,m=g>-1?r.controllers[g]:new(n.controller||t),y=m.instance;"object"==typeof y&&(c=y.name,"object"==typeof y.cached&&(h=y.cached),y.viewFn=[p,m]);var w=n&&n.attrs&&n.attrs.key;if(n=n.view(m),"retain"===n.subtree)return h?h:r;null!=w&&(n.attrs||(n.attrs={}),n.attrs.key=w),m.onunload&&Nt.unloaders.set(m,m.onunload),f.push(v),d.push(m)}if(!n.tag&&d.length)throw new Error("Component template must return a virtual element, not an array, string, etc.");if(n.attrs||(n.attrs={}),null!=h&&(r=h),r.attrs||(r.attrs={}),(n.tag!=r.tag||!U(n.attrs,r.attrs)||n.attrs.id!=r.attrs.id||n.attrs.key!=r.attrs.key||"string"===e(c)&&r.componentName!=c)&&r.nodes.length&&A(r.nodes,r),"string"!==e(n.tag))return r;var b,E,k=0===r.nodes.length,x=Object.keys(n.attrs),_=x.length>("key"in n.attrs?1:0);if(n.attrs.xmlns?l=n.attrs.xmlns:"svg"===n.tag?l="http://www.w3.org/2000/svg":"math"===n.tag&&(l="http://www.w3.org/1998/Math/MathML"),k){var O=I(o,l,n,i);b=O[0],E=O[1],r={tag:n.tag,attrs:_?C(b,n.tag,n.attrs,{},l):n.attrs,children:null!=n.children&&n.children.length>0?R(b,n.tag,void 0,void 0,n.children,r.children,!0,0,n.attrs.contenteditable?b:a,l,u):n.children,nodes:[b]},d.length&&(r.views=f,r.controllers=d),r.children&&!r.children.nodes&&(r.children.nodes=[]),"select"===n.tag&&"value"in n.attrs&&C(b,n.tag,{value:n.attrs.value},{},l),null!=E&&o.insertBefore(b,o.childNodes[E]||null)}else b=r.nodes[0],_&&C(b,n.tag,n.attrs,r.attrs,l),r.children=R(b,n.tag,void 0,void 0,n.children,r.children,!1,0,n.attrs.contenteditable?b:a,l,u),r.nodes.intact=!0,d.length&&(r.views=f,r.controllers=d),s===!0&&null!=b&&o.insertBefore(b,o.childNodes[i]||null);if("string"===e(c)&&(r.componentName=c),"function"===e(n.attrs.config)){var N=r.configContext=r.configContext||{},j=function(t){return function(){return n.attrs.config.apply(n,t)}};u.push(j([b,!k,N,r,[o,i,a,l]]))}return r}function I(t,e,n,r){var o,i,s=r;if(t&&t.childNodes.length&&(i=S(t,r),i&&i[0])){if(s=i[1],i[0].tagName.toLowerCase()==n.tag.toLowerCase())return[i[0],null];A([i[0]])}return o=n.attrs.is?void 0===e?_t.createElement(n.tag,n.attrs.is):_t.createElementNS(e,n.tag,n.attrs.is):void 0===e?_t.createElement(n.tag):_t.createElementNS(e,n.tag),o.setAttribute("data-mref",r),[o,s]}function S(t,e){for(var n,r=0,o=t.childNodes.length;o>r;r++)if(n=t.childNodes[r],n.getAttribute&&n.getAttribute("data-mref")==e)return[n,r];return null}function B(t,e,n,r,o,i,s){var a;if(0===e.nodes.length){if(""==t)return e;A([n.childNodes[o]]),t.$trusted?a=$(n,o,t):(a=[_t.createTextNode(t)],n.nodeName.match(It)||n.insertBefore(a[0],n.childNodes[o]||null)),e="string number boolean".indexOf(typeof t)>-1?new t.constructor(t):t,e.nodes=a}else e.valueOf()!==t.valueOf()||i===!0?(a=e.nodes,s&&s===_t.activeElement||(t.$trusted?(A(a,e),a=$(n,o,t)):"textarea"===r?n.value=t:s?s.innerHTML=t:((1===a[0].nodeType||a.length>1)&&(A(e.nodes,e),a=[_t.createTextNode(t)]),n.insertBefore(a[0],n.childNodes[o]||null),a[0].nodeValue=t)),e=new t.constructor(t),e.nodes=a):e.nodes.intact=!0;return e}function W(t){for(var n=0;n<t.length;n++)"array"===e(t[n])&&(t=t.concat.apply([],t),n--);return t}function U(t,e){var n=Object.keys(t).sort().join(),r=Object.keys(e).sort().join();return n===r}function $(t,e,n){var r=t.childNodes[e];if(r){var o=1!==r.nodeType,i=_t.createElement("span");o?(t.insertBefore(i,r||null),i.insertAdjacentHTML("beforebegin",n),t.removeChild(i)):r.insertAdjacentHTML("beforebegin",n)}else t.insertAdjacentHTML("beforeend",n);for(var s,a=[];(s=t.childNodes[e++])!==r;)a.push(s);return a}function K(t,e,n,r){var o={root:t,vNode:e,forceRecreation:n};return r===!0?Y(o):void Nt.renderQueue.addTarget({mergeType:1,root:t,processor:Y,params:[o]})}function Y(t){var e=t.root,n=t.vNode,r=t.forceRecreation;if(!e)throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");var o,i=[],s=e===_t||e===_t.documentElement,a=s?St:e;s&&"html"!==n.tag&&(n={tag:"html",attrs:{},children:n}),r&&Q(a),o=R(a,null,void 0,void 0,n,Bt.get(a),!1,0,null,void 0,i),i.forEach(function(t){t()}),Bt.set(a,o)}function Q(t){A(t.childNodes,Bt.get(t)),Bt.remove(t)}function X(t){Ut!==!0&&(Ut=!0,t===!0&&(Nt.forcing=!0),G(t),Ut=!1)}function G(t){var n,r,o,i;(0===Wt.length()||t===!0)&&"function"===e(Nt.computePreRedrawHook)&&(Nt.computePreRedrawHook(),Nt.computePreRedrawHook=null),Wt.length()>0&&Wt.stop();for(var s=0,a=Nt.roots.length;a>s;s++)n=Nt.roots[s],r=Nt.components[s],o=Nt.controllers[s],i=Nt.recreations[s],o&&("object"==typeof o.instance&&(o.instance.viewFn=[r.view,o]),K(n,r.view?r.view(o):"",i,t)),Nt.recreations[s]=void 0;t===!0&&(V(),Nt.forcing=!1)}function V(){"function"===e(Nt.computePostRedrawHook)&&(Nt.computePostRedrawHook(),Nt.computePostRedrawHook=null)}function Z(t){var e=t.processor,n=t.params;"function"==typeof e&&e.apply(null,n)}function z(t,e){var n,r,o,i;for(n=0,r=t.length;r>n;n++)if(i=J(t[n],e)){o=n;break}return o>-1?(t.splice(o,1),t.push(i)):t.push(e),t}function J(t,e){var n=t.root,r=e.root;if(t.mergeType&e.mergeType)return n===r?e:null;var o=h(n,r);return o?o===n?t:e:null}function tt(e,r){var o=function(){return(e.controller||t).apply(this,r)||this},i=function(t){return arguments.length>1&&(r=r.concat(n(arguments,1))),e.view.apply(e,r.length?[t].concat(r):[t])};i.$original=e.view;var s={controller:o,view:i};return r[0]&&null!=r[0].key&&(s.attrs={key:r[0].key}),s}function et(t){return tt(t,n(arguments,1))}function nt(n,r,o){if(!n)throw new Error("Please ensure the DOM element exists before rendering a template into it.");var i=Nt.roots.indexOf(n);0>i&&(i=Nt.roots.length);var s=!1,a={preventDefault:function(){s=!0,Nt.computePreRedrawHook=Nt.computePostRedrawHook=null}};if(Nt.unloaders.each(function(t,e){t.call(e,a),e.onunload=null}),s?Nt.unloaders.each(function(t,e){e.onunload=t}):Nt.unloaders.clear(),Nt.controllers[i]&&"function"===e(Nt.controllers[i].onunload)&&Nt.controllers[i].onunload(a),!s){Nt.roots[i]=n;var l=$t=r=r||{controller:t},u=r.controller||t,c=new u;return l===$t&&(Nt.controllers[i]=c,Nt.components[i]=r,Nt.recreations[i]=o),X(),Nt.controllers[i]}}function rt(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function ot(t){var e=t.viewFn,n=e[0](e[1]),r=t.props.key,o=t.redrawData,i=o[0],s=o[1],a=o[2],l=o[3],u=[];null!=r&&(n.attrs=n.attrs||{},n.attrs.key=r),t.cached=R(i,null,void 0,void 0,n,t.cached,!1,s,a,l,u);for(var c=0,h=u.length;h>c;c++)u[c]()}function it(t){if("object"!==e(t))throw new TypeError("[createComponent]param should be a object! given: "+t);var n={},r=at(t);return n.controller=function(t,n){var o=new r(t,n),i={instance:o};return i.onunload=o.onunload.bind(o,o.componentWillUnmount),"string"===e(o.name)&&(i.name=o.name),i},n.view=lt(),n}function st(t,r){var o;for("array"!==e(r)&&(r=n(arguments,1)),r=r.filter(function(t){return"object"===e(t)});r.length>0;)o=r.shift(),Object.keys(o).forEach(function(n){if("mixins"===n)return void(r=ht([].concat(o[n]),r));if(-1===Xt.indexOf(n))return-1!==Yt.indexOf(n)?void("array"===e(t[n])?t[n].push(o[n]):t[n]="function"===e(t[n])?[t[n],o[n]]:[o[n]]):void(t[n]=o[n])});Yt.forEach(function(n){if("array"===e(t[n])){var r=t[n].filter(function(t){return"function"===e(t)});t[n]=ft(-1!==Qt.indexOf(n),r)}})}function at(t){var n,r=function(){Gt.apply(this,arguments),ut(r.prototype,this)};return r.prototype=Object.create(Gt.prototype),n=t.mixins||[],delete t.mixins,n="array"===e(n)?n.concat(t):[n,t],st(r.prototype,n),r}function lt(){var t={};return function(n,r,o){var i=n.instance,s=t.props,a=t.state,l=function(t,n,r,o,l){ct(i,"setInternalProps",t,o,l),n?ct(i,"componentDidUpdate",t,s,a):(ct(i,"componentDidMount",t),"function"===e(i.componentWillDetached)&&(r.onunload=i.componentWillDetached.bind(i,t)))};if(i.setProps(r,o),t.props=i.props,t.state=i.state,null!=i.root){if(ct(i,"shouldComponentUpdate",s,a)===!1)return{subtree:"retain"};ct(i,"componentWillUpdate",i.root,s,a)}else ct(i,"componentWillMount",s,a);var u=ct(i,"render",i.props,i.state);return u.attrs=u.attrs||{},u.attrs.config=l,u}}function ut(t,n){Object.keys(t).forEach(function(r){var o=t[r];("function"===e(o)||/^on[A-Z]\w*/.test(r))&&(n[r]=o.bind(n))})}function ct(t,r){var o=n(arguments,2);return"function"===e(t[r])?t[r].apply(t,o):void 0}function ht(t,e){var n,r,o=t.length;for(n=0;o>n;n++)r=t[n],-1===e.indexOf(r)&&e.unshift(r);return e}function ft(t,e){return function(){for(var r,o=n(arguments,0),i=this,s=0,a=e.length,l=o;a>s;s++)r=e[s],l=r.apply(i,o),o=t?l:o;return l}}var dt=/^\[object (\w+)\]$/,pt=Array.prototype.slice,vt=f,gt=/(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g,mt=/\[(.+?)(?:=("|'|)(.*?)\2)?\]/;f.trust=function(t){return t=new String(t),t.$trusted=!0,t};var yt=d;d.prototype={has:function(t){v(t);var e,n=this._keys;if(t!=t||0===t)for(e=n.length;e--&&!p(n[e],t););else e=n.indexOf(t);return this._index=e,e>-1},clear:function(){this._keys.length=0,this._values.length=0,this._index=-1},set:function(t,e){return this.has(t)?this._values[this._index]=e:this._values[this._keys.push(t)-1]=e,this},get:function(t,e){return this.has(t)?this._values[this._index]:(arguments.length>1&&this.set(t,e),e)},remove:function(t){var e=this._index;return this.has(t)&&(this._keys.splice(e,1),this._values.splice(e,1)),e>-1},each:function(t){if("function"==typeof t)for(var e=0,n=this._keys.length;n>e;e++)t(this._values[e],this._keys[e])}};var wt={all:["altKey","bubbles","cancelable","ctrlKey","eventPhase","metaKey","relatedTarget","shiftKey","target","timeStamp","type","view","which"],mouse:["button","buttons","clientX","clientY","layerX","layerY","offsetX","offsetY","pageX","pageY","screenX","screenY","toElement"],key:["char","charCode","key","keyCode"]},bt=/^key|input/,Et=/^(?:mouse|pointer|contextmenu)|click/;y.prototype=i(y.prototype,{init:function(t){w(this,t,"all"),this.originalEvent=t,this._bubbles=!1},preventDefault:function(){return this.originalEvent.preventDefault()},startPropagation:function(){this._bubbles=!0}});var kt=b.prototype;kt.on=function(t,e,n){var r=O(this.domEvHandlerMap,t,u());return N(r,e,this,n),this},kt.off=function(t,e,n){var r=O(this.domEvHandlerMap,t);return r?(arguments.length>=3?j(r,e,this,n):2===arguments.length?j(r,e,this):T(r,this),0===Object.keys(r).length&&this.domEvHandlerMap.remove(t),this):this},kt.addGlobalEventListener=function(t,e){return N(this.globalListeners,t,this,e),this},kt.removeGlobalEventListener=function(t,e){return arguments.length>=2?j(this.globalListeners,t,this,e):1===arguments.length?j(this.globalListeners,t,this):T(this.globalListeners,this),this},kt.destroy=function(){this.unlistenTo(),this.listenedEvents=null,this.eventDispatchers=null,this.globalListeners=null,this.domEvHandlerMap.clear()},kt.listenTo=function(t){if(t in this.listenedEvents||(this.listenedEvents[t]=0),this.listenedEvents[t]++,1!==this.listenedEvents[t])return this;var e=this.eventDispatchers[t];return e||(e=this.eventDispatchers[t]=E(t,this)),g(this.root,t,e),this},kt.unlistenTo=function(t){var e=this.eventDispatchers,n=this;if(0===arguments.length)return Object.keys(e).filter(function(t){var n=!!e[t];return n&&(e[t]=1),n}).forEach(function(t){n.unlistenTo(t)}),this;if(!(t in this.listenedEvents)||0===this.listenedEvents[t])return console.log('[DOMDelegator unlistenTo]event "'+t+'" is already unlistened!'),this;if(this.listenedEvents[t]--,this.listenedEvents[t]>0)return this;var r=this.eventDispatchers[t];if(!r)throw new Error("[DOMDelegator unlistenTo]: cannot unlisten to "+t);return m(this.root,t,r),this},D.prototype.addTarget=function(t){var n=this._queue.length;return"function"===e(this.options.onAddTarget)?this._queue=this.options.onAddTarget.call(this,this._queue,t):this._queue.push(t),0===n&&1===this._queue.length&&this.scheduleFlush(),this},D.prototype.removeTarget=function(t){var e=this._queue.indexOf(t);return-1!==e&&this._queue.splice(e,1),this},D.prototype.flush=function(){var t,n,r,o,i,s=new Date,a=this._cb,l=this._startPos;for(i=this._queue,r=l,o=i.length;o>r;r++)if(n=i[r],a.call(null,n),t=new Date-s,t>Tt){console.log("frame budget overflow:",t),r++;break}this._queue.splice(0,r),this._startPos=0,this._queue.length?this.scheduleFlush():"function"===e(this.options.onFinish)&&this.options.onFinish.call(null)},D.prototype.scheduleFlush=function(){return this._tick&&Mt(this._tick),this._tick=At(this.flush),this._tick},D.prototype.onFlush=function(t){if("function"!==e(t))throw new TypeError("[Batch.prototype.onFlush]need a Function here, but given "+t);return this._cb=t,this},D.prototype.length=function(){return this._queue.length},D.prototype.stop=function(){return Mt(this._tick),this._queue.length=0,this},["onAddTarget","onFinish"].forEach(function(t){D.prototype[t]=function(n){if("function"!==e(n))throw new TypeError("[Batch.prototype."+t+"]need a Function here, but given "+n);return this.options[t]=n,this}});for(var xt="undefined"!=typeof window?window:{},_t=xt.document,Ot="undefined"==typeof process||process.browser?"undefined"!=typeof window?"browser":"unknown":"nodejs",Nt={forcing:!1,unloaders:new yt,computePreRedrawHook:null,computePostRedrawHook:null,roots:[],recreations:[],components:[],controllers:[],domCacheMap:new yt,domDelegator:new b,renderQueue:new D},jt=0,Tt=16,Dt=["webkit","moz","ms","o"],At=xt.requestAnimationFrame,Mt=xt.cancelAnimationFrame||xt.cancelRequestAnimationFrame,Ct=0,Pt=Dt.length;Pt>Ct&&!At;++Ct)At=xt[Dt[Ct]+"RequestAnimationFrame"],Mt=xt[Dt[Ct]+"CancelAnimationFrame"]||xt[Dt[Ct]+"CancelRequestAnimationFrame"];At||(At=function(t){var e=Date.now?Date.now():(new Date).getTime(),n=Math.max(0,Tt-(e-jt)),r=setTimeout(function(){t(e+n)},n);return jt=e+n,r}),Mt||(Mt=function(t){return clearTimeout(t)});var Rt,Lt=Nt.domCacheMap,Ft=Nt.domDelegator,Ht=Nt.domDelegator,qt=/^ev([A-Z]\w*)/,It=/^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/,St={appendChild:function(t){void 0===Rt&&(Rt=_t.createElement("html")),_t.documentElement&&_t.documentElement!==t?_t.replaceChild(t,_t.documentElement):_t.appendChild(t),this.childNodes=_t.childNodes},insertBefore:function(t){this.appendChild(t)},childNodes:[]},Bt=Nt.domCacheMap,Wt=Nt.renderQueue.onFinish(V),Ut=!1;Nt.renderQueue.onFlush(Z).onAddTarget(z);var $t,Kt=et,Yt=["componentWillMount","componentDidMount","componentWillUpdate","componentDidUpdate","componentWillUnmount","componentWillDetached","componentWillReceiveProps","getInitialProps","getInitialState"],Qt=["getInitialProps","getInitialState","componentWillReceiveProps"],Xt=["setState","mixins","onunload","setInternalProps","redraw"],Gt=function(){function t(n,r){if(rt(this,t),"object"!==e(n)&&null!=n)throw new TypeError("[Component]param for constructor should a object or null or undefined! given: "+n);this.props=n||{},this.props.children=l(r),this.root=null,this.getInitialProps&&(this.props=this.getInitialProps(this.props)),this.getInitialState&&(this.state=this.getInitialState(this.props))}return t.prototype.setProps=function(t,e){this.componentWillReceiveProps&&(t=this.componentWillReceiveProps(t)),this.props=s(i(this.props,t,{children:l(e)}))},t.prototype.onunload=function(t){"function"===e(t)&&t.call(this),this.root=null,this.cached=null,this.redrawData=null},t.prototype.setInternalProps=function(t,e,n){this.root=t,this.cached=e,this.redrawData=n},t.prototype.redraw=function(){if(null!=this.redrawData){var t=this;Nt.renderQueue.addTarget({mergeType:0,processor:ot,root:t.root,params:[t]})}},t.prototype.setState=function(t,e){null==this.state&&(this.state={}),this.state=i(this.state,t),e||"browser"!==Ot||this.redraw()},t}(),Vt=vt;Vt.render=K,Vt.redraw=X,Vt.mount=nt,Vt.component=Kt,Vt.createComponent=it,Vt.domDelegator=Nt.domDelegator,"undefined"==typeof Object.assign&&(Object.assign=o);var Zt=Vt;return Zt});
}).call(this,require(1))
},{"1":1}],"page":[function(require,module,exports){
(function (process){
  /* globals require, module */

  'use strict';

  /**
   * Module dependencies.
   */

  var pathtoRegexp = require(5);

  /**
   * Module exports.
   */

  module.exports = page;

  /**
   * Detect click event
   */
  var clickEvent = ('undefined' !== typeof document) && document.ontouchstart ? 'touchstart' : 'click';

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var location = ('undefined' !== typeof window) && (window.history.location || window.location);

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;


  /**
   * Decode URL components (query string, pathname, hash).
   * Accommodates both regular percent encoding and x-www-form-urlencoded format.
   */
  var decodeURLComponents = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * HashBang option
   */

  var hashbang = false;

  /**
   * Previous context, for capturing
   * page exit events.
   */

  var prevContext;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      page['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];
  page.exits = [];

  /**
   * Current path being processed
   * @type {String}
   */
  page.current = '';

  /**
   * Number of pages navigated to.
   * @type {number}
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  page.len = 0;

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path) {
    if (0 === arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options) {
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false === options.decodeURLComponents) decodeURLComponents = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) {
      document.addEventListener(clickEvent, onclick, false);
    }
    if (true === options.hashbang) hashbang = true;
    if (!dispatch) return;
    var url = (hashbang && ~location.hash.indexOf('#!')) ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function() {
    if (!running) return;
    page.current = '';
    page.len = 0;
    running = false;
    document.removeEventListener(clickEvent, onclick, false);
    window.removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    if (false !== dispatch) page.dispatch(ctx);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {String} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object} [state]
   * @api public
   */

  page.back = function(path, state) {
    if (page.len > 0) {
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      history.back();
      page.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    }else{
      setTimeout(function() {
        page.show(base, state);
      });
    }
  };


  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {String} from - if param 'to' is undefined redirects to 'from'
   * @param {String} [to]
   * @api public
   */
  page.redirect = function(from, to) {
    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page(from, function(e) {
        setTimeout(function() {
          page.replace(to);
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        page.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */


  page.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) page.dispatch(ctx);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx) {
    var prev = prevContext,
      i = 0,
      j = 0;

    prevContext = ctx;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled(ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;

    if (hashbang) {
      current = base + location.hash.replace('#!', '');
    } else {
      current = location.pathname + location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    location.href = ctx.canonicalPath;
  }

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  page.exit = function(path, fn) {
    if (typeof path === 'function') {
      return page.exit('*', path);
    }

    var route = new Route(path);
    for (var i = 1; i < arguments.length; ++i) {
      page.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */
  function decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') { return val; }
    return decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' === path[0] && 0 !== path.indexOf(base)) path = base + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = parts[0];
      this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    page.len++;
    history.pushState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    history.replaceState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(this.path,
      this.keys = [],
      options.sensitive,
      options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Object} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };


  /**
   * Handle "populate" events.
   */

  var onpopstate = (function () {
    var loaded = false;
    if ('undefined' === typeof window) {
      return;
    }
    if (document.readyState === 'complete') {
      loaded = true;
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          loaded = true;
        }, 0);
      });
    }
    return function onpopstate(e) {
      if (!loaded) return;
      if (e.state) {
        var path = e.state.path;
        page.replace(path, e.state);
      } else {
        page.show(location.pathname + location.hash, undefined, undefined, false);
      }
    };
  })();
  /**
   * Handle "click" events.
   */

  function onclick(e) {

    if (1 !== which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;



    // ensure link
    var el = e.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;



    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (!hashbang && el.pathname === location.pathname && (el.hash || '#' === link)) return;



    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;



    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (typeof process !== 'undefined' && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    var orig = path;

    if (path.indexOf(base) === 0) {
      path = path.substr(base.length);
    }

    if (hashbang) path = path.replace('#!', '');

    if (base && orig === path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null === e.which ? e.button : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  page.sameOrigin = sameOrigin;

}).call(this,require(1))
},{"1":1,"5":5}],"s-flow":[function(require,module,exports){
var check = require(23);
var t = require(27);
var slice = require(4);
var pipe = require(3);
var Signal = require(9);
var createState = require(10);
var Promise = require(24);
var protos = {
  init: function init() {
    this.state = this._createState.apply(this, slice(arguments));
    return this;
  },
  snapshot: function snapshot(sigName,sigVal) {
    var signal = this.signal,
        snapshot = this._snapshot;
    if(snapshot == null) snapshot = this._snapshot = this._createState();
        // snapshot = this._createState();
    snapshot.reset(this._stateOptions.data);
    return Promise.resolve(signal.execute(sigName, snapshot, sigVal)).then(function(){
      snapshot.store.commit();
      return {
        state: snapshot,
        $type: '__$sf$__'
      };
    });
  },
  _createState: function(initData, options){
    var stateOpts = this._stateOptions;
    return createState(
      t.get(initData) === 'object' || t.get(initData) === 'array'? 
            initData: stateOpts.data,
      stateOpts.facets,
      stateOpts.refs,
      _merge(stateOpts.options, options||{})
      );
  },
  $type: '__$sf$__'
};

function SF(opts) {
  check.t({
    state:{
      data: 'object',
      facets: '?object',
      refs: '?object',
      options: '?object'
    },
    signal: 'function',
    watch: 'function'
  }, opts, '[sFlow constructor]Invalid state argument!');
  var signalCreator = opts.state.options && opts.state.options.signalCreator, sf;
  if (signalCreator) delete opts.state.options.signalCreator;
  sf = Object.create(protos);
  sf.signal = new Signal(sf, signalCreator);
  //register signals
  opts.signal(sf.signal);
  sf.signal.resolve();
  //watch signals
  opts.watch(_watch.bind(sf));
  sf._stateOptions = opts.state;
  return sf;
}
SF.isCtorOf = function(sf){
  return t.get(sf) === 'object' && sf.$type === '__$sf$__';
}
module.exports = SF;

function _watch(sigName) {
  var reactions = slice(arguments, 1),
    signal = this.signal,
    self = this,
    // state = this.state,
    sigHandler;
  check(typeof sigName === 'string', '[sFlow watch]first parameter should be a string! given: ' + sigName);
  check.t(['function'], reactions, '[sFlow watch]actions should be an array of functions! given: ' + reactions);
  sigHandler = function(state){
    var args = slice(arguments, 1),
        piped = pipe.apply(null, reactions.map(function(orgFn) {
            return orgFn.bind(this, state.store, state.refs);
          })
        );
    return piped.apply(self, args);
  };
  signal.on(sigName, sigHandler);
}
function _merge(t, o){
  for(var k in o){
    if(Object.prototype.hasOwnProperty.call(o, k)){
      t[k] = o[k];
    }
  }
  return t;
}

},{"10":10,"23":23,"24":24,"27":27,"3":3,"4":4,"9":9}]},{},[]);
