/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

'use strict';

// module dependencies
var microevent = require('microevent'),
    purl = require('purl'),
    murl = require('murl'),
    paqs = require('paqs'),
    u = require('./utils');

var httpSafeMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'],
    isBrowser = !!(typeof window !== 'undefined' && window.document && window.document.createElement);

function isPath(str) {
  return str.search('/') >= 0;
}

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
 * @property {string}   cause     - the cause of the navigation.
 * @property {string}   fullPath  - the full-path of the navigation.
 * @property {string}   path      - the path part of the navigation.
 * @property {Boolean}  canUseDOM - <code>true</code> if DOM is accessible;
 *                                  <code>false</code> if not. Use this to
 *                                  detect if navigation occurred on the
 *                                  server-side or in the browser.
 * @property {Object}   request   - the server-side request object. Available only on
 *                                  the server.
 * @property {Object}   response  - the server-side response object. Available only on
 *                                  the server.
 * @property {Router}   router    - the current router instance
 * @property {Object}   params    - the URL parameters extracted. Available only on the
 *                                  the client-side. On the server, URL parameters are
 *                                  available via the <code>request</code> object.
 * @property {Object}   query     - the query string parameters extracted. Available only
 *                                  on the client-side. On the server, URL parameters are
 *                                  available via the <code>response</code> object.
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
 * @property {string}     method   - the HTTP method of this route
 * @property {string}     path     - the path pattern used by this route to match requests
 * @property {Handler[]}  handlers - the handlers or middlewares for this route
 * @property {Object}     matcher  - the matcher object that performs matching of request
 *                                   with this route's path pattern
 */

// add HTTP methods as methods to the router prototype
httpSafeMethods.reduce(function (proto, method) {
  var methodName = (method === 'DELETE' ? 'DEL' : method).toLowerCase();

  /**
   * Registers the specified chain of handlers for the specified path and method
   *
   * @public
   *
   * @param  {string}     name     - the the name of the route
   * @param  {string}     path     - the path to handle
   * @param  {function[]} handlers - one or more handlers
   */
  proto[methodName] = function (name, path) {
    var handlers, m;

    // noop if on client and method is not GET
    if (isBrowser && method !== 'GET') return;

    if (this._findRouteByName(name))
      throw new Error('Route with the name \'' + name + '\' is already added');

    handlers = u.arrgs(arguments).slice(2);
    m = murl(path);

    if (!(m in this._routes)) this._routes[m] = {};

    this._routes.push({
      name: name,
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
 * @param  {string} path   - the path to match the route against
 * @param  {string} [method=GET] - the HTTP method to match route against
 *
 * @return {Route|undefined} the route object or undefined
 */
Router.prototype._findRouteByPath = function findRoute(path, method) {
  method = method || 'GET';
  return u.find(this._routes, function (r) {
    return r.matcher(path) && r.method === method.toUpperCase();
  });
};
/**
 * Finds and returns the first route whose name & method match the specified
 * name and method
 *
 * @private
 *
 * @param  {string} name   - the name of the route
 * @param  {string} [method=GET] - the HTTP method to match route against
 *
 * @return {Route|undefined} the route object or undefined
 */
Router.prototype._findRouteByName = function findRoute(name, method) {
  method = method || 'GET';

  return u.find(this._routes, function (r) {
    return r.name === name && r.method === method.toUpperCase();
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
  function nextHandler(err) {
    var handler;

    // stop if a handler throws an error
    if (err)
      return next(err);

    handler = handlerQ.shift();

    if (!handler) {
      this.router.trigger('navigationComplete', {
        path: path,
        method: route.method,
        cause: state.cause,
        router: this.router
      });
      return next();
    }

    try {
      return handler(cxt);
    } catch (err) {
      return next(err);
    }
  }

  cxt.next = nextHandler;

  return cxt;
};

/**
 * A terminating route for client-side routing
 *
 * @param  {string}   path  - the path of the route
 * @param  {Function} next  - the underlying next call
 * @param  {Object}   [err] - an optional error object
 */
Router.prototype._stubRoute = function (path, method, next, err) {
  if (err) this.trigger('error', {
    path: path,
    method: method,
    router: this,
    error: err
  });
  next(err);
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
  var parsedUrl = (typeof req.url === 'string') ? purl(req.url) : req.url,
      path = parsedUrl.pathname,
      method = req.method.toUpperCase(),
      cause = 'httpRequest',
      route, cxt;

  // find the route
  route = this._findRouteByPath(path, method);

  // did not find a matching route
  if (!route) {
    this.trigger('notFound', { path: req.url, method: method, router: this });
    return next();
  }

  // parse URL and query params, attach to request
  req.params = route.matcher(path);
  req.query = parsedUrl.search ? paqs(parsedUrl.search) : {};

  // build new context
  cxt = this._createContext(path, route,
    this._stubRoute.bind(this, req.url, method, next), {
    fullPath: req.url,
    cause: cause,
    request: req,
    response: res
  });

  // trigger a navigating event
  this.trigger('navigating', {
    path: path,
    method: method,
    cause: cause,
    router: this
  });

  return cxt.next();
};


/**
 * The client-side dispatcher
 *
 * @private
 *
 * @param {string} pathOrName    - the path to dispatch to
 * @param {Object} [state] - an optional state to be associated with the navigation
 */
Router.prototype._clientDispatcher = function (pathOrName, state) {
  var currPath = document.location.pathname,
      cause = (state.cause || 'navigation'),
      url = purl(pathOrName),
      byPath = isPath(pathOrName),
      route = byPath ? this._findRouteByPath(url.pathname, 'GET') : this._findRouteByName(pathOrName, 'GET'),
      newPath = byPath ? pathOrName : u.createPath({
        pathname: route.path,
        params: state.params,
        query: state.query,
        hash: state.hash
      }),
      cxt, newState;

  if (!route) {
    this.trigger('notFound', { path: newPath, method: 'GET', router: this });
    return;
  }

  // build new context
  cxt = this._createContext(url.pathname, route,
    this._stubRoute.bind(this, newPath, 'GET', u.noop), {
    fullPath: newPath,
    cause: cause,
    params: (state.params || route.matcher(url.pathname)),
    query: (state.query || paqs(url.search))
  });

  // cherry-pick only serializable stuff from context
  newState = u.pick(cxt, ['fullPath', 'path', 'params', 'query', 'cause']);

  if (currPath === url.pathname)
    window.history.replaceState(newState, null, newPath);
  else
    window.history.pushState(newState, null, newPath);

  // invoke the first handler/middleware
  cxt.next();

  // trigger a navigating event
  this.trigger('navigating', {
    path: newPath,
    method: 'GET',
    cause: cause,
    router: this
  });
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

  // ignore links with a hard mode
  if (('data-hard' in tgt.attributes) && tgt.attributes['data-hard'].value === 'true') return;

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
 * @property {Boolean} [autoStart=false]  - <code>true</code> if the router should initialize
 *                                          current document's URL and call the routes registered
 *                                          for it. This is only available on the client-side.
 *
 * @property {Boolean} [handleLinks=true] - <code>true</code> if the router should intercept all
 *                                          links on the current document and handle it. This is
 *                                          only available on the client-side
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
    this._clientDispatcher(document.location.href, {cause: 'startup'});

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
   * Triggers navigation to the route with the specified path or name
   *
   * @public
   *
   * @param {String} pathOrName the pathOrName to navigate to
   * @param {object} query      one or more query parameters
   * @param {object} params     one or more URL parameters
   */
  Router.prototype.navigateTo = function (pathOrName, query, params) {
    this._clientDispatcher(pathOrName, {cause: 'navigation', params: params, query: query });
  };

module.exports = function signalman() {
  return new Router();
};
