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

  describe('#merge', function () {

    it('should merge attributes from specified source objects', function () {
      expect(u.merge({name: 'jdoe', age: 31})).to.be.eql({name: 'jdoe', age: 31});
    });

    it('should merge attributes from specified multiple source objects', function () {
      expect(u.merge({name: 'jdoe'}, {age: 31})).to.be.eql({name: 'jdoe', age: 31});
    });

    it('should return empty object if no source objects were specified', function () {
      expect(u.merge()).to.be.eql({});
    });

    it('should overwrite attributes from successive objects with same name', function () {
      expect(u.merge({name: 'jdoe'}, {name: 'asmith'})).to.be.eql({name: 'asmith'});
    });

    it('should return shallow copies of source objects', function () {
      var src = {name: 'jdoe', age: 31},
          dest = u.merge(src);

      dest.name = 'asmith';
      dest.age = 43;

      expect(src).to.be.eql({name: 'jdoe', age: 31});
    });
  });

  describe('#pick', function () {

    it('should extract specified attributes from source object', function () {
      expect(u.pick({name: 'jdoe', age: 51}, ['name'])).to.be.eql({name: 'jdoe'});
    });

    it('should return an empty object if no specified attributes found in source object', function () {
      expect(u.pick({foo: 'bar', key: 'value'}, ['name'])).to.be.eql({});
    });

    it('should return some attributes if some others are not found in source object', function () {
      expect(u.pick({name: 'jdoe', key: 'value'}, ['name', 'age'])).to.be.eql({name: 'jdoe'});
    });

  });

  describe('#createPath', function () {

    it('should return valid path from arguments', function () {
      expect(u.createPath({ pathname: '/foo'})).to.be.eql('/foo');
    });

    it('should return valid path with a parameter replaced from arguments', function () {
      expect(u.createPath({ pathname: '/foo/{name}', params: {name: 'goober'}})).to.be.eql('/foo/goober');
    });

    it('should return valid path with parameters replaced from arguments', function () {
      expect(u.createPath({ pathname: '/foo/{name}/{fighter}', params: {name: 'goober', fighter: 'moo'}}))
          .to.be.eql('/foo/goober/moo');
    });

    it('should return valid path with parameters with special characters replaced from arguments', function () {
      expect(u.createPath({ pathname: '/foo/{name}/{fighter}', params: {name: 'goo ber', fighter: 'moo'}}))
          .to.be.eql('/foo/goo%20ber/moo');
    });

    it('should return valid path with parameters replaced and query string from arguments', function () {
      expect(u.createPath({ pathname: '/foo/{name}/{fighter}',
        params: {name: 'goober', fighter: 'moo'}, query: { a: '1', b: 20, 'c_d': true}}))
          .to.be.eql('/foo/goober/moo?a=1&b=20&c_d=true');
    });

    it('should return valid path with parameters replaced and query string with special characters from arguments',
        function () {
          expect(u.createPath({ pathname: '/foo/{name}/{fighter}',
            params: {name: 'goober', fighter: 'moo'}, query: { a: '1', b: 20, 'name': 'John Doe'}}))
              .to.be.eql('/foo/goober/moo?a=1&b=20&name=John%20Doe');
        }
    );

    it('should return valid path with parameters replaced and query string and hash from arguments', function () {
      expect(u.createPath({ pathname: '/foo/{name}/{fighter}',
        params: {name: 'goober', fighter: 'moo'}, query: { a: '1', b: 20, 'c_d': true}, hash: 'mee=boo'}))
          .to.be.eql('/foo/goober/moo?a=1&b=20&c_d=true#mee=boo');
    });

  });

});
