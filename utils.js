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

