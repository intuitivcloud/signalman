/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

'use strict';

var pathRex = /(([\w\.\-\+]+:)\/{2}(([\w\d\.]+):([\w\d\.]+))?@?(([a-zA-Z0-9\.\-_]+)(?::(\d{1,5}))?))?(\/(?:[a-zA-Z0-9\.\-\/\+\%]+)?)(?:\?([a-zA-Z0-9=%\-_\.\*&;]+))?(?:#([a-zA-Z0-9\-=,&%;\/\\"'\?]+)?)?/;

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

/**
 * Parses the specified URL and returns an object containing the components
 * extracted
 *
 * @param  {string} urlToParse - the URL to parse and extract components from
 *
 * @return {Object} an object containing the components extracted from the specified
 *                  URL
 */
exports.parseUrl = function parseUrl (urlToParse) {
  var m = pathRex.exec(urlToParse),
      i = 1;

  if (!m) return {};

  //origin = $1\nprotocol = $2\nuserinfo = $3\nusername = $4\npassword = $5\nhost = $6\nhostname = $7\nport = $8\npath = $9\nsearch = $10\nhash = $11

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
