/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */
var signalman =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * signalman
	 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
	 * BSD-3-Clause Licensed
	 */

	'use strict';

	// module dependencies
	var microevent = __webpack_require__(1),
	    purl = __webpack_require__(4),
	    murl = __webpack_require__(2),
	    paqs = __webpack_require__(3),
	    u = __webpack_require__(6);

	var httpSafeMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

	/**
	 * A router that routes requests
	 *
	 * @class
	 * @constructor
	 */
	function Router () {
	  this._routes = [];
	}

	// add event support
	microevent.mixin(Router);

	// add HTTP methods as methods to the router prototype
	httpSafeMethods.reduce(function (proto, method) {
	  var methodName = (method === 'DELETE' ? 'DEL' : method).toLowerCase();

	  /**
	   * Registers the specified chain of handlers for the specified path and method
	   *
	   * @param  {string} path - the path to handle
	   * @param  {function[]} handlers - one or more handlers
	   */
	  proto[methodName] = function (path) {
	    var handlers = u.arrgs(arguments).slice(1),
	        m = murl(path);

	    if (!(m in this._routes)) this._routes[m] = {};

	    this._routes.push({
	      method: method,
	      path: path,
	      handlers: handlers,
	      matcher: m
	    });
	  };

	  return proto;
	}, Router.prototype);

	/**
	 * Finds and returns the first route whose matcher matches the specified
	 *
	 * @param  {string} method - the HTTP method to match route against
	 * @param  {string} path - the path to match the route against
	 *
	 * @return {Object} the route object or undefined
	 */
	Router.prototype._findRoute = function findRoute(method, path) {
	  return u.find(this._routes, function (r) {
	    return r.matcher(path) && r.method === method;
	  });
	};

	/**
	 * The server-side request dispatcher
	 *
	 * @param {Object}   req  - the request object sent by the server
	 * @param {Object}   res  - the response object sent by the server
	 * @param {Function} next - the next function in the server middleware chain
	 */
	Router.prototype.serverDispatcher = function (req, res, next) {
	  var parsedUrl = purl(req.url),
	      path = parsedUrl.pathname,
	      cause = 'httpRequest',
	      route, cxt, handlerQ;

	  /**
	   * The next middleware iterator internal to signalman
	   *
	   * @return {Function} the next middleware function registered for the route
	   */
	  function nextHandler() {
	    var handler = handlerQ.shift();

	    if (!handler) return next();

	    return handler(cxt);
	  }

	  // find the route
	  route = this._findRoute(req.method, path);

	  // did not find a matching route
	  if (!route) return next();

	  // parse URL and query params
	  req.params = route.matcher(path);
	  req.query = parsedUrl.search ? paqs(parsedUrl.search) : {};

	  handlerQ = route.handlers.slice();            // shallow copy of handlers, queued

	  cxt = {
	    cause: cause,
	    path: path,
	    router: this,
	    request: req,
	    response: res,
	    next: nextHandler
	  };

	  // trigger a navigating event
	  this.trigger('navigating', {path: path, cause: cause, router: this});

	  return nextHandler();
	};

	Router.prototype.start = function () {
	  return this.serverDispatcher.bind(this);
	};

	module.exports = function signalman() {
	  return new Router();
	};



/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(module) {/**
	 * MicroEvent - to make any js object an event emitter (server or browser)
	 * 
	 * - pure javascript - server compatible, browser compatible
	 * - dont rely on the browser doms
	 * - super simple - you get it immediatly, no mistery, no magic involved
	 *
	 * - create a MicroEventDebug with goodies to debug
	 *   - make it safer to use
	*/

	var MicroEvent	= function(){}
	MicroEvent.prototype	= {
		bind	: function(event, fct){
			this._events = this._events || {};
			this._events[event] = this._events[event]	|| [];
			this._events[event].push(fct);
		},
		unbind	: function(event, fct){
			this._events = this._events || {};
			if( event in this._events === false  )	return;
			this._events[event].splice(this._events[event].indexOf(fct), 1);
		},
		trigger	: function(event /* , args... */){
			this._events = this._events || {};
			if( event in this._events === false  )	return;
			for(var i = 0; i < this._events[event].length; i++){
				this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1))
			}
		}
	};

	/**
	 * mixin will delegate all MicroEvent.js function in the destination object
	 *
	 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
	 *
	 * @param {Object} the object which will support MicroEvent
	*/
	MicroEvent.mixin	= function(destObject){
		var props	= ['bind', 'unbind', 'trigger'];
		for(var i = 0; i < props.length; i ++){
			destObject.prototype[props[i]]	= MicroEvent.prototype[props[i]];
		}
	}

	// export in common js
	if( typeof module !== "undefined" && ('exports' in module)){
		module.exports	= MicroEvent
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(5)(module)))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var rewrite = function(pattern, visit) {
		var captures = [];

		pattern = pattern.replace(/\*([^}]|$)/g, '{*}$1');
		pattern = pattern.replace(/(\/)?(\.)?\{([^{]+)\}(?:\(([^)]+)\))?(\?)?(?=(.|$))/g, function(_, slash, dot, name, capture, optional, closed) {
			if (!/^(\w|\d|[_\-.*])+$/g.test(name)) throw new Error('bad pattern name: '+name);
			captures.push(visit({
				slash:slash ? '\\/' : '',
				dot:dot ? '\\.' : '',
				name:name,
				capture:capture,
				optional:optional,
				closed:closed === '' || closed === '/'
			}));
			return '@';
		});

		return pattern.replace(/([\\\/."])/g, '\\$1').replace(/@/g, function() {
			return captures.shift();
		});
	};
	var replacer = function(pattern, opts) {
		if (!pattern) {
			return function() {
				return '';
			};
		}

		pattern = 'return "'+rewrite(pattern, function(params) {
			return params.slash+params.dot+'"+params["'+params.name+'"]+"';
		})+'";';

		return new Function('params',pattern.replace(/\+"";$/, ';'));
	};
	var matcher = function(pattern, opts) {
		if (!pattern) {
			return function() {
				return {};
			};
		}

		var names = [];
		pattern = rewrite(pattern, function(params) {
			names.push(params.name);
			params.capture  = params.capture  || (params.name === '*' ? '.+?' : '[^\\/]+');
			params.optional = params.optional || (params.name === '*' ? '?' : '');
			return (params.closed ? '(?:'+params.slash+params.dot : params.slash+'(?:'+params.dot)+'('+params.capture+'))'+params.optional;
		});

		var end = opts.strict ? '' : '[\\/]?';
		var src = 'var pattern=/^'+pattern+end+'$/i;\nvar match=str.match(pattern);\nreturn match && {';
		for (var i = 0; i < names.length; i++) {
			if (names[i] === '*') {
				src += '"*":match['+(i+1)+'] || "","glob":match['+(i+1)+'] || ""';
			} else {
				src += '"'+names[i]+'":match['+(i+1)+']';
			}
			src += (i+1 < names.length ? ',' : '');
		}
		src += '};';

		return new Function('str', src);
	};

	module.exports = function(pattern, opts) {
		if (!opts) opts = {};

		var match = matcher(pattern, opts);
		var replace = replacer(pattern, opts);
		var vars = {};

		var fn = function(url) {
			return (typeof url === 'string' ? match : replace)(url);
		};

		rewrite(pattern || '', function(params) {
			vars[params.name] = true;
		});

		if (vars['*']) vars.glob = true;
		fn.variables = Object.keys(vars);
		fn.pattern = pattern || '';

		return fn;
	};

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * paqs
	 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
	 * BSD-3-Clause Licensed
	 */

	'use strict';

	var rex = /([\w\d\+\.%$\-_]+)=?([\w\d\+\.%$\-_]+)?&?/g,
	    spRex = /\+/g;

	module.exports = function paqs(qs) {
	  var params = {},
	      dec = decodeURIComponent,
	      isarr = Array.isArray,
	      m, k, v;

	  rex.lastIndex = 0;
	  while ((m = rex.exec(qs)) && m.length === 3) {
	    k = dec(m[1].replace(spRex, ' '));
	    v = m[2] && dec(m[2].replace(spRex, ' '));

	    if (k in params && isarr(params[k])) params[k].push(v);
	    if (k in params && !isarr(params[k])) params[k] = [params[k], v];
	    if (!(k in params)) params[k] = v;
	  }

	  return params;
	};



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * purl
	 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
	 * BSD-3-Clause Licensed
	 */

	'use strict';

	var pathRex = /(([\w\.\-\+]+:)\/{2}(([\w\d\.]+):([\w\d\.]+))?@?(([a-zA-Z0-9\.\-_]+)(?::(\d{1,5}))?))?(\/(?:[a-zA-Z0-9\.\-\/\+\%]+)?)(?:\?([a-zA-Z0-9=%\-_\.\*&;]+))?(?:#([a-zA-Z0-9\-=,&%;\/\\"'\?]+)?)?/;

	/**
	 * Parses the specified URL and returns an object containing the components
	 * extracted
	 *
	 * @param  {string} urlToParse - the URL to parse and extract components from
	 *
	 * @return {Object} an object containing the components extracted from the specified
	 *                  URL
	 */
	module.exports = function purl(urlToParse) {
	  var m = pathRex.exec(urlToParse),
	      i = 1;

	  if (!m) return {};

	  return {
	    origin: m[i++],
	    protocol: m[i++],
	    userinfo: m[i++],
	    username: m[i++],
	    password: m[i++],
	    host: m[i++],
	    hostname: m[i++],
	    port: m[i++],
	    pathname: m[i++],
	    search: m[i++],
	    hash: m[i++]
	  };
	};



/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/*!
	 * signalman
	 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
	 * BSD-3-Clause Licensed
	 */

	'use strict';

	/**
	 * Finds the first item in the array for which the specified
	 * predicate function returns <code>true</code>
	 *
	 * @param  {Function} predicate - the predicate to use to test each value
	 *
	 * @return {*|undefined} the first item in the array which tests positive
	 *                        with the predicate
	 */
	exports.find = function find(items, predicate) {
	  var i = 0;

	  for (;i < items.length; i += 1)
	    if (predicate(items[i], i, items))
	      return items[i];
	}

	/**
	 * Returns an array based on the specified arguments object
	 *
	 * @param  {Object} args - the arguments object to convert to array
	 *
	 * @return {Array} an array containing the items passed in the specified
	 *                  arguments object
	 */
	exports.arrgs = function arrgs(args) {
	  return Array.prototype.slice.call(args);
	}



/***/ }
/******/ ]);