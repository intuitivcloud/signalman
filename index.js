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
 * @private
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
 * Builds and returns a new context object for the specified path, route and state
 *
 * @private
 *
 * @param {string} path - the path for which this context is to be created
 * @param {Route} route - the route object that will be associated with the context
 * @param {Function} next - the next handler
 * @param {Object} [state] - an optional state with additional attributes to add to context
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
   * @return {Function} the next middleware function registered for the route
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

  // parse URL and query params
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
 * Starts routing
 *
 * @public
 *
 * @param {Object} opts - options for routing
 */
Router.prototype.start = function (opts) {
  opts = opts || { autoStart: false };

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

