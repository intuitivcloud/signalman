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

