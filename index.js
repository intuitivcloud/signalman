/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

'use strict';

// module dependencies
var path2rex = require('path-to-regexp'),
    microevent = require('microevent');

var httpSafeMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];

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
    var handlers = arrgs(arguments).slice(1),
        keys = [],
        m = path2rex(path, keys);

    if (!(m in this._routes)) this._routes[m] = {};

    this._routes.push({
      method: method,
      keys: keys,
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
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
Router.prototype._findRoute = function findRoute(method, path) {
  return find(this._routes, function (r) {
    return r.matcher.test(path) && r.method === method;
  });
};

Router.prototype.dispatch = function (req, res, next) {
  var path = req.url,
      cause = 'httpRequest',
      route, cxt, handlerQ;

  function extractParams(route, path) {
    var m = route.matcher.exec(path);

    if (!m) return {};

    return route.keys.reduce(function (params, k, i) {
      params[k.name] = decodeURIComponent(m[i + 1]);
      return params;
    }, {});
  }

  function nextHandler() {
    var handler = handlerQ.shift();

    if (!handler) return next();

    return handler(cxt);
  }

  // find the route
  route = this._findRoute(req.method, path);

  // did not find a matching route
  if (!route) return next();

  req.params = extractParams(route, path);
  handlerQ = route.handlers.slice();            // shallow copy of handlers

  cxt = {
    cause: cause,
    path: path,
    router: this,
    route: route,
    req: req,
    res: res,
    next: nextHandler
  };

  // trigger a navigating event
  this.trigger('navigating', {path: path, cause: cause, router: this});

  return nextHandler();

};

Router.prototype.start = function () {
  return this.dispatch.bind(this);
};

function signalman() {
  return new Router();
}

module.exports = signalman;
