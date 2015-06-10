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

  describe('#parseUrl', function () {

    it('should parse a complete URL and return its components', function () {
      var pu = u.parseUrl('http://user:pass@www.google.com:8000/foo/bar/index.html?st=1&lt=10;#/koo9');

      expect(pu).to.be.eql({
        origin: 'http://user:pass@www.google.com:8000',
        protocol: 'http:',
        userinfo: 'user:pass',
        username: 'user',
        password: 'pass',
        host: 'www.google.com:8000',
        hostname: 'www.google.com',
        port: '8000',
        pathname: '/foo/bar/index.html',
        search: 'st=1&lt=10;',
        hash: '/koo9'
      });

    });

    it('should parse a URL without port and return its components', function () {
      var pu = u.parseUrl('http://user:pass@www.google.com/foo/bar?st=1&lt=10;#/koo9');

      expect(pu).to.be.eql({
        origin: 'http://user:pass@www.google.com',
        protocol: 'http:',
        userinfo: 'user:pass',
        username: 'user',
        password: 'pass',
        host: 'www.google.com',
        hostname: 'www.google.com',
        port: undefined,
        pathname: '/foo/bar',
        search: 'st=1&lt=10;',
        hash: '/koo9'
      });

    });

    it('should parse a URL without port and userinfo and return its components', function () {
      var pu = u.parseUrl('http://www.google.com/foo/bar?st=1&lt=10;#/koo9');

      expect(pu).to.be.eql({
        origin: 'http://www.google.com',
        protocol: 'http:',
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: 'www.google.com',
        hostname: 'www.google.com',
        port: undefined,
        pathname: '/foo/bar',
        search: 'st=1&lt=10;',
        hash: '/koo9'
      });

    });

    it('should parse a URL without port, userinfo and hash and return its components', function () {
      var pu = u.parseUrl('http://www.google.com/foo/bar?st=1&lt=10;');

      expect(pu).to.be.eql({
        origin: 'http://www.google.com',
        protocol: 'http:',
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: 'www.google.com',
        hostname: 'www.google.com',
        port: undefined,
        pathname: '/foo/bar',
        search: 'st=1&lt=10;',
        hash: undefined
      });

    });

    it('should parse a URL without port, userinfo, search and hash and return its components', function () {
      var pu = u.parseUrl('http://www.google.com/foo/bar');

      expect(pu).to.be.eql({
        origin: 'http://www.google.com',
        protocol: 'http:',
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: 'www.google.com',
        hostname: 'www.google.com',
        port: undefined,
        pathname: '/foo/bar',
        search: undefined,
        hash: undefined
      });

    });

    it('should parse a URL without port, userinfo, path, search and hash and return its components', function () {
      var pu = u.parseUrl('http://www.google.com/');

      expect(pu).to.be.eql({
        origin: 'http://www.google.com',
        protocol: 'http:',
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: 'www.google.com',
        hostname: 'www.google.com',
        port: undefined,
        pathname: '/',
        search: undefined,
        hash: undefined
      });

    });

    it('should parse a path with search and hash and return its components', function () {
      var pu = u.parseUrl('/foo/bar?st=1&lt=10#foo');

      expect(pu).to.be.eql({
        origin: undefined,
        protocol: undefined,
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: undefined,
        hostname: undefined,
        port: undefined,
        pathname: '/foo/bar',
        search: 'st=1&lt=10',
        hash: 'foo'
      });

    });

    it('should parse a path with search and no hash and return its components', function () {
      var pu = u.parseUrl('/foo/bar?st=1&lt=10');

      expect(pu).to.be.eql({
        origin: undefined,
        protocol: undefined,
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: undefined,
        hostname: undefined,
        port: undefined,
        pathname: '/foo/bar',
        search: 'st=1&lt=10',
        hash: undefined
      });

    });

    it('should parse a path with no search or hash and return its components', function () {
      var pu = u.parseUrl('/foo/bar');

      expect(pu).to.be.eql({
        origin: undefined,
        protocol: undefined,
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: undefined,
        hostname: undefined,
        port: undefined,
        pathname: '/foo/bar',
        search: undefined,
        hash: undefined
      });

    });

    it('should parse a root path and return its components', function () {
      var pu = u.parseUrl('/');

      expect(pu).to.be.eql({
        origin: undefined,
        protocol: undefined,
        userinfo: undefined,
        username: undefined,
        password: undefined,
        host: undefined,
        hostname: undefined,
        port: undefined,
        pathname: '/',
        search: undefined,
        hash: undefined
      });

    });

  });

});
