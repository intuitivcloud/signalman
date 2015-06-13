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

	var httpSafeMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'],
	    isBrowser = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

	/**
	 * A router that routes requests
	 *
	 * @public
	 *
	 * @class
	 * @constructor
	 */
	function Router () {
	  this._routes = [];
	}

	// add event support
	microevent.mixin(Router);

	/**
	 * Represents the details of a navigation performed by the router.
	 *
	 * A Context object is passed to all handlers in a route using which the
	 * handlers can retrieve details about the navigation from this object
	 *
	 * @typedef {Object} Context
	 *
	 * @property {string}   cause - the cause of the navigation.
	 * @property {string}   fullPath - the full-path of the navigation.
	 * @property {string}   path - the path part of the navigation.
	 * @property {Boolean}  canUseDOM - <code>true</code> if DOM is accessible;
	 *                                  <code>false</code> if not. Use this to
	 *                                  detect if navigation occurred on the
	 *                                  server-side or in the browser.
	 * @property {Object}   request - the server-side request object. Available only on
	 *                                the server.
	 * @property {Object}   response - the server-side response object. Available only on
	 *                                  the server.
	 * @property {Router}   router - the current router instance
	 * @property {Object}   params - the URL parameters extracted. Available only on the
	 *                                the client-side. On the server, URL parameters are
	 *                                available via the <code>request</code> object.
	 * @property {Object}   query - the query string parameters extracted. Available only
	 *                              on the client-side. On the server, URL parameters are
	 *                              available via the <code>response</code> object.
	 */

	/**
	 * A handler function that is invoked with a navigation context
	 *
	 * <p>Handlers can also be specified as middleware chain for a route. If defined as a
	 * middleware, implementations can invoke the <code>next()</code> method on the
	 * navigation context object passed to indicate that the router can proceed to
	 * the next middleware or handler in the chain.</p>
	 *
	 * @callback Handler
	 *
	 * @param {Context} context - the navigation context object
	 */

	/**
	 * Represents a route definition in signalman.
	 *
	 * @typedef {Object} Route
	 *
	 * @private
	 *
	 * @property {string}     method - the HTTP method of this route
	 * @property {string}     path - the path pattern used by this route to match requests
	 * @property {Handler[]}  handlers - the handlers or middlewares for this route
	 * @property {Object}     matcher - the matcher object that performs matching of request
	 *                                  with this route's path pattern
	 */

	// add HTTP methods as methods to the router prototype
	httpSafeMethods.reduce(function (proto, method) {
	  var methodName = (method === 'DELETE' ? 'DEL' : method).toLowerCase();

	  /**
	   * Registers the specified chain of handlers for the specified path and method
	   *
	   * @public
	   *
	   * @param  {string} path - the path to handle
	   * @param  {function[]} handlers - one or more handlers
	   */
	  proto[methodName] = function (path) {
	    var handlers, m;

	    // noop if on client and method is not GET
	    if (isBrowser && method !== 'GET') return;

	    handlers = u.arrgs(arguments).slice(1);
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
	 * @private
	 *
	 * @param  {string} method - the HTTP method to match route against
	 * @param  {string} path - the path to match the route against
	 *
	 * @return {Route|undefined} the route object or undefined
	 */
	Router.prototype._findRoute = function findRoute(method, path) {
	  return u.find(this._routes, function (r) {
	    return r.matcher(path) && r.method === method;
	  });
	};

	/**
	 * Builds and returns a new context object for the specified path, route and state
	 *
	 * @private
	 *
	 * @param {string}    path - the path for which this context is to be created
	 * @param {Route}     route - the route object that will be associated with the context
	 * @param {Function}  next - the next handler
	 * @param {Object}    [state] - an optional state with additional attributes to add to context
	 *
	 * @return {Context} a new instance of the navigation context object
	 */
	Router.prototype._createContext = function _createContext(path, route, next, state) {
	  var handlerQ = route.handlers.slice(),
	      cxt = u.merge({
	        path: path,
	        router: this,
	        canUseDOM: isBrowser
	      }, state);

	  /**
	   * The next middleware iterator internal to signalman
	   *
	   * @public
	   *
	   * @return {Handler|null} the next middleware function registered for the route
	   */
	  function nextHandler() {
	    var handler = handlerQ.shift();

	    if (!handler) return next();

	    return handler(cxt);
	  }

	  cxt.next = nextHandler;

	  return cxt;
	};

	/**
	 * The server-side request dispatcher
	 *
	 * @private
	 *
	 * @param {Object}   req  - the request object sent by the server
	 * @param {Object}   res  - the response object sent by the server
	 * @param {Function} next - the next function in the server middleware chain
	 */
	Router.prototype._serverDispatcher = function (req, res, next) {
	  var parsedUrl = purl(req.url),
	      path = parsedUrl.pathname,
	      cause = 'httpRequest',
	      route, cxt;

	  // find the route
	  route = this._findRoute(req.method, path);

	  // did not find a matching route
	  if (!route) return next();

	  // parse URL and query params, attach to request
	  req.params = route.matcher(path);
	  req.query = parsedUrl.search ? paqs(parsedUrl.search) : {};

	  // build new context
	  cxt = this._createContext(path, route, next, {
	    cause: cause,
	    request: req,
	    response: res
	  });

	  // trigger a navigating event
	  this.trigger('navigating', {path: path, cause: cause, router: this});

	  return cxt.next();
	};

	/**
	 * The client-side dispatcher
	 *
	 * @private
	 *
	 * @param {string} path - the path to dispatch to
	 * @param {Object} [state] - an optional state to be associated with the navigation
	 */
	Router.prototype._clientDispatcher = function (path, state) {
	  var currPath = document.location.pathname,
	      url = purl(path),
	      route = this._findRoute('GET', url.pathname),
	      cxt, newState;

	  if (!route) {
	    this.trigger('notFound', path);
	    return;
	  }

	  // build new context
	  cxt = this._createContext(url.pathname, route, u.noop, {
	    fullPath: path,
	    cause: (state.cause || 'navigation'),
	    params: (state.params || route.matcher(url.pathname)),
	    query: (state.query || paqs(url.search))
	  });

	  // cherry-pick only serializable stuff from context
	  newState = u.pick(cxt, ['fullPath', 'path', 'params', 'query', 'cause']);

	  if (currPath === url.pathname)
	    window.history.replaceState(newState, null, path);
	  else
	    window.history.pushState(newState, null, path);

	  // invoke the first handler/middleware
	  cxt.next();
	};

	/**
	 * The client-side popState event handler
	 *
	 * @private
	 *
	 * @param {Object} e - the popState event object
	 */
	Router.prototype._onPopState = function (e) {
	  var state = e.state;
	  this._clientDispatcher(state.fullPath, state);
	};

	/**
	 * Handles clicks on the document, and defines
	 * navigation behavior for links.
	 *
	 * @private
	 *
	 * @param {Object} e - the click event
	 */
	Router.prototype._linkJacker = function (e) {
	  var tgt, href, docUrl, fullPath;

	  // ignore cancelled, modified or button events
	  if (e.defaultPrevented) return;
	  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
	  if (e.button !== 0) return;

	  tgt = e.target;
	  while (tgt && tgt.nodeName !== 'A')
	    tgt = tgt.parentNode;

	  if (!tgt) return;

	  // ignore links which open in a new tab, we will need server-side render for them
	  if (tgt.target && tgt.target !== '_self') return;

	  // ignore links that offer downloading content
	  if (tgt.attributes.download) return;

	  // extract the path of the link and the current document
	  href = purl(tgt.href);
	  docUrl = purl(window.location.href);

	  // link's protocol and host should match that of the host
	  if (href.protocol !== docUrl.protocol || href.host !== docUrl.host) return;

	  // compose the new path
	  fullPath = href.pathname + (href.search || '') + (href.hash || '');

	  e.preventDefault();

	  // get our router to route us
	  this.navigateTo(fullPath, {cause: 'navigation'});
	};

	/**
	 * The options for routing behavior
	 *
	 * @typedef RoutingOptions
	 *
	 * @property {Boolean} [autoStart=false] - <code>true</code> if the router should initialize
	 *                                         current document's URL and call the routes registered
	 *                                         for it. This is only available on the client-side.
	 *
	 * @property {Boolean} [handleLinks=true] - <code>true</code> if the router should intercept all
	 *                                         links on the current document and handle it. This is
	 *                                         only available on the client-side
	 */

	/**
	 * Starts routing
	 *
	 * @public
	 *
	 * @param {RoutingOptions} [opts] - options for routing
	 */
	Router.prototype.start = function (opts) {
	  opts = u.merge({ autoStart: false, handleLinks: true }, (opts || {}));

	  // already running, noop
	  if (this._isStarted) return undefined;

	  // if on server, use server dispatcher
	  if (!isBrowser) return this._serverDispatcher.bind(this);

	  this._popStateHandler = this._onPopState.bind(this);

	  // attach client dispatcher
	  window.addEventListener('popstate', this._popStateHandler);

	  // navigate to current document URL if autoStart specified
	  if (opts.autoStart)
	    this.navigateTo(document.location.href, { cause: 'startup' });

	  // jack links if requested
	  if (opts.handleLinks) {
	    this._linkHandler = this._linkJacker.bind(this);
	    document.addEventListener('click', this._linkHandler);
	  }

	  this._started = true;
	};

	/**
	 * Stops routing client-side navigation
	 *
	 * @public
	 */
	Router.prototype.stop = function stopRouting() {
	  if (!(isBrowser && this._isStarted)) return;

	  window.removeEventListener('popstate', this._popStateHandler);
	  if (this._linkHandler) document.removeEventListener('click', this._linkHandler);

	  this._isStarted = false;
	};

	// add the navigateTo method only if we are in a browser
	if (isBrowser)
	  /**
	   * Triggers navigation to the specified path
	   *
	   * @public
	   */
	  Router.prototype.navigateTo = function (path) {
	    this._clientDispatcher(path, {cause: 'navigation'});
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
	function find(items, predicate) {
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
	function arrgs(args) {
	  return Array.prototype.slice.call(args);
	}

	/**
	 * Returns the a new object after mergining all the attributes
	 * from all of the specified source objects.
	 *
	 * It does not modify any of the objects. Successive source objects'
	 * attributes will overwrite attributes with same names from
	 * previous source objects.
	 *
	 * This method can also be used to make shallow copies of objects.
	 *
	 * @param {Object|Object...} sources - the source objects to merge
	 *                                      attributes from
	 *
	 * @return {Object} a new object with attributes from all specified
	 *                  source objects
	 */
	function merge() {
	  var args = arrgs(arguments),
	      dest = {};

	  args.forEach(function (src) {
	    dest = Object.keys(src).reduce(function (d, k) {
	      d[k] = src[k];
	      return d;
	    }, dest);
	  });

	  return dest;
	}

	/**
	 * A no-op function.
	 */
	function noop() {}

	/**
	 * Returns an object with the attributes from the specified
	 * source object whose names are present in the specified
	 * property names
	 *
	 * @param {Object} src - the object to extract the attributes from
	 * @param {string[]} propName - the names of the attributes to extract
	 *
	 * @return {Object} an object with the specified attributes from source object
	 */
	function pick(src, propNames) {
	  return propNames.reduce(function (dest, name) {
	    if (!(name in src)) return dest;
	    dest[name] = src[name];
	    return dest;
	  }, {});
	}

	module.exports = {
	  find: find,
	  arrgs: arrgs,
	  merge: merge,
	  noop: noop,
	  pick: pick
	};



/***/ }
/******/ ]);