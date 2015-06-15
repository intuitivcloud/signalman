/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

var expect = require('expect.js'),
    signalman = require('../');

var context = describe;

describe('signalman', function () {

  context('on server', function () {

    it('should create export a function', function () {
      expect(signalman).to.be.a('function');
    });

    describe('signalman Router', function () {
      var router;

      beforeEach(function () {
        router = signalman();
      });

      it('should have methods based on HTTP methods to add routes', function () {
        expect(router.get).to.be.a('function');
        expect(router.post).to.be.a('function');
        expect(router.put).to.be.a('function');
        expect(router.patch).to.be.a('function');
        expect(router.del).to.be.a('function');
        expect(router.head).to.be.a('function');
        expect(router.options).to.be.a('function');
        expect(router.trace).to.be.a('function');
      });

      it('should add a route to handle a GET request', function () {
        var handler = function (cxt) {},
            route;

        router.get('/', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('GET');
        expect(route.path).to.be('/');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a GET request with a middleware chain', function () {
        var middleware = function (cxt) {},
            handler = function (cxt) {},
            route;

        router.get('/', middleware, handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('GET');
        expect(route.path).to.be('/');
        expect(route.handlers).to.be.eql([middleware, handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a POST request', function () {
        var handler = function (cxt) {},
            route;

        router.post('/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('POST');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a PUT request', function () {
        var handler = function (cxt) {},
            route;

        router.put('/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('PUT');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a PATCH request', function () {
        var handler = function (cxt) {},
            route;

        router.patch('/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('PATCH');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a DELETE request', function () {
        var handler = function (cxt) {},
            route;

        router.del('/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('DELETE');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a HEAD request', function () {
        var handler = function (cxt) {},
            route;

        router.head('/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('HEAD');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a OPTIONS request', function () {
        var handler = function (cxt) {},
            route;

        router.options('/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('OPTIONS');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should add a route to handle a TRACE request', function () {
        var handler = function (cxt) {},
            route;

        router.trace('/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('TRACE');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should provide a middleware when routing is started', function () {
        var middleware = router.start();
        expect(middleware).to.be.a('function');
        expect(middleware).to.have.length(3);
      });

      context('when routing is started', function () {

        it('should handle a GET request by calling the handler for the route', function () {
          var handlerCalled = false,
              nextCalled = false,
              req, res, next, handler;

          req = { url: '/', method: 'GET' };
          res = { status: function () {} };
          next = function () { nextCalled = true; };
          handler = function (cxt) {
            expect(cxt.request).to.be(req);
            expect(cxt.response).to.be(res);
            expect(cxt.request.params).to.be.eql({});
            expect(cxt.request.query).to.be.eql({});
            handlerCalled = true;
          };

          router.get('/', handler);

          router.start()(req, res, next);

          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(false);

        });

        it('should handle a GET request by calling all middlewares and handler for the route with any changes made by middlewares', function () {
          var middlewareCalled = false,
              handlerCalled = false,
              nextCalled = false,
              req, res, next, middleware, handler;

          req = { url: '/', method: 'GET' };
          res = { status: function () {} };
          next = function () { nextCalled = true; };
          middleware = function (cxt) {
            expect(cxt.request).to.be(req);
            expect(cxt.response).to.be(res);
            expect(cxt.request.params).to.be.eql({});
            expect(cxt.request.query).to.be.eql({});
            cxt.request.middlewareInjectedValue = 'Yay middleware!';
            middlewareCalled = true;
            cxt.next();
          };
          handler = function (cxt) {
            expect(cxt.request).to.be(req);
            expect(cxt.response).to.be(res);
            expect(cxt.request.params).to.be.eql({});
            expect(cxt.request.query).to.be.eql({});
            expect(cxt.request.middlewareInjectedValue).to.be('Yay middleware!');
            handlerCalled = true;
          };

          router.get('/', middleware, handler);

          router.start()(req, res, next);

          expect(middlewareCalled).to.be(true);
          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(false);
        });

        it('should pass control to next middleware if no route registered for path', function () {
          var handlerCalled = false,
              nextCalled = false,
              req, res, next, middleware, handler;

          req = { url: '/', method: 'GET' };
          res = { status: function () {} };
          next = function () { nextCalled = true; };
          handler = function (cxt) {};

          router.get('/hello', middleware, handler);

          router.start()(req, res, next);

          expect(handlerCalled).to.be(false);
          expect(nextCalled).to.be(true);
        });

        it('should parse URL parameters if defined for route', function () {
          var handlerCalled = false,
              nextCalled = false,
              req, res, next, handler;

          req = { url: '/Goober', method: 'GET' };
          res = { status: function () {} };
          next = function () { nextCalled = true; };
          handler = function (cxt) {
            expect(cxt.request).to.be(req);
            expect(cxt.response).to.be(res);
            expect(cxt.request.params).to.be.eql({ name: 'Goober' });
            expect(cxt.request.query).to.be.eql({});
            handlerCalled = true;
          };

          router.get('/{name}', handler);

          router.start()(req, res, next);

          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(false);

        });

        it('should parse query parameters if defined for route', function () {
          var handlerCalled = false,
              nextCalled = false,
              req, res, next, handler;

          req = { url: '/?st=1&lt=10', method: 'GET' };
          res = { status: function () {} };
          next = function () { nextCalled = true; };
          handler = function (cxt) {
            expect(cxt.request).to.be(req);
            expect(cxt.response).to.be(res);
            expect(cxt.request.params).to.be.eql({});
            expect(cxt.request.query).to.be.eql({ st: '1', lt: '10' });
            handlerCalled = true;
          };

          router.get('/', handler);

          router.start()(req, res, next);

          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(false);

        });

      });

      afterEach(function () {
        router = null;
      });

    });

  });

});
