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

