/* global describe, it */
'use strict';

var expect = require('expect.js'),
    u = require('../utils');

describe('utils', function () {

  describe('#find', function () {

    it('should find an item in an array of unique elements', function () {
      expect(u.find([1, 2, 3, 4, 6], function (v) { return v === 3; })).to.be(3);
    });

    it('should return undefined if an item is not found in the specified array of unique elements', function () {
      expect(u.find([1, 2, 3, 4, 6], function (v) { return v === 5; })).to.be(undefined);
    });

    it('should find an item in an array of duplicate elements', function () {
      expect(u.find([1, 2, 3, 4, 3, 6], function (v) { return v === 3; })).to.be(3);
    });

    it('should return undefined if an item is not found in the specified array of duplicate elements', function () {
      expect(u.find([1, 2, 3, 4, 6, 6], function (v) { return v === 5; })).to.be(undefined);
    });

  });

  describe('#arrgs', function () {

    it('should convert arguments to an array and return it', function () {
      var args = function () {
        return u.arrgs(arguments);
      };

      expect(args(1, 2, 3)).to.be.eql([1, 2, 3]);
    });

    it('should return nested array if arguments contain an array', function () {
      var args = function () {
        return u.arrgs(arguments);
      };

      expect(args([1, 2, 3])).to.be.eql([[1, 2, 3]]);
    });

    it('should return an empty array and return it if no arguments were passed', function () {
      var args = function () {
        return u.arrgs(arguments);
      };

      expect(args()).to.be.eql([]);
    });

  });

});
