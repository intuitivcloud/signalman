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

        router.get('test', '/', handler);
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

        router.get('test', '/', middleware, handler);
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

        router.post('test', '/hello/:name', handler);
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

        router.put('test', '/hello/:name', handler);
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

        router.patch('test', '/hello/:name', handler);
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

        router.del('test', '/hello/:name', handler);
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

        router.head('test', '/hello/:name', handler);
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

        router.options('test', '/hello/:name', handler);
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

        router.trace('test', '/hello/:name', handler);
        route = router._routes[0];

        expect(route).to.be.ok();
        expect(route.method).to.be('TRACE');
        expect(route.path).to.be('/hello/:name');
        expect(route.handlers).to.be.eql([handler]);
        expect(route.matcher).to.be.a('function');
      });

      it('should not add a route if another route with the same name is added', function () {
        router.get('test1', '/hello/{name}', function () {});

        expect(function () {
          router.get('test1', '/hello/{name}', function () {});
        }).to.throwError(/Route with the name 'test1' is already added/);
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

          router.get('test', '/', handler);

          router.start()(req, res, next);

          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(false);

        });

        it('should emit notFound event and call server next if no route found matching to request path', function () {
          var notFoundEventHandlerCalled = false,
              nextCalled = false,
              req, res, next, notFoundEventHandler;

          req = { url: '/', method: 'GET' };
          res = { status: function () {} };
          next = function () { nextCalled = true; };
          notFoundEventHandler = function (evt) {
            expect(evt.path).to.be('/');
            expect(evt.method).to.be('GET');
            expect(evt.router).to.be(router);
            notFoundEventHandlerCalled = true;
          };

          router.bind('notFound', notFoundEventHandler);

          router.start()(req, res, next);

          expect(notFoundEventHandlerCalled).to.be(true);
          expect(nextCalled).to.be(true);
        });

        it('should handle a GET request by calling all middlewares and handler for the route with any changes made by middlewares', function () {
          var middlewareCalled = false,
              handlerCalled = false,
              navEventTriggered = false,
              nextCalled = false,
              req, res, next, middleware, handler, navEventHandler;

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
          navEventHandler = function (evt) {
            expect(evt.path).to.be('/');
            expect(evt.method).to.be('GET');
            expect(evt.cause).to.be('httpRequest');
            expect(evt.router).to.be(router);
            navEventTriggered = true;
          };

          router.get('test', '/', middleware, handler);

          router.bind('navigating', navEventHandler);

          router.start()(req, res, next);

          expect(middlewareCalled).to.be(true);
          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(false);
          expect(navEventTriggered).to.be(true);
        });

        it('should pass control to next middleware if no route registered for path', function () {
          var handlerCalled = false,
              nextCalled = false,
              req, res, next, middleware, handler;

          req = { url: '/', method: 'GET' };
          res = { status: function () {} };
          next = function () { nextCalled = true; };
          handler = function (cxt) {};

          router.get('test', '/hello', middleware, handler);

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

          router.get('test', '/{name}', handler);

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

          router.get('test', '/', handler);

          router.start()(req, res, next);

          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(false);

        });

        it('should pass error to server next if handler calls router next with an error', function () {
          var handlerCalled = false,
              nextCalled = false,
              req, res, next, handler;

          req = { url: '/?st=1&lt=10', method: 'GET' };
          res = { status: function () {} };
          next = function (err) {
            expect(err).to.be.eql({message: 'Error!'});
            nextCalled = true;
          };
          handler = function (cxt) {
            handlerCalled = true;
            cxt.next({message: 'Error!'});
          };

          router.get('test', '/', handler);

          router.start()(req, res, next);

          expect(handlerCalled).to.be(true);
          expect(nextCalled).to.be(true);

        });

      });

      it('should stop routing if middleware calls router next with an error', function () {
        var middlewareCalled = false,
            handlerCalled = false,
            nextCalled = false,
            req, res, next, ware, handler;

        req = { url: '/?st=1&lt=10', method: 'GET' };
        res = { status: function () {} };
        next = function (err) {
          expect(err).to.be.eql({message: 'Error!'});
          nextCalled = true;
        };
        ware = function (cxt) {
          middlewareCalled = true;
          cxt.next({message: 'Error!'});
        };
        handler = function (cxt) {
          handlerCalled = true;
        };

        router.get('test', '/', ware, handler);

        router.start()(req, res, next);

        expect(middlewareCalled).to.be(true);
        expect(nextCalled).to.be(true);
        expect(handlerCalled).to.be(false);

      });

      it('should emit error event if middleware calls router next with an error', function () {
        var middlewareCalled = false,
            handlerCalled = false,
            errorEventTriggered = false,
            nextCalled = false,
            req, res, next, ware, handler, errorEventListener;

        req = { url: '/?st=1&lt=10', method: 'GET' };
        res = { status: function () {} };
        next = function (err) {
          expect(err).to.be.eql({message: 'Error!'});
          nextCalled = true;
        };
        ware = function (cxt) {
          middlewareCalled = true;
          cxt.next({message: 'Error!'});
        };
        handler = function (cxt) {
          handlerCalled = true;
        };
        errorEventListener = function (evt) {
          expect(evt.path).to.be('/?st=1&lt=10');
          expect(evt.method).to.be('GET');
          expect(evt.router).to.be(router);
          expect(evt.error).to.be.eql({
            message: 'Error!'
          });
          errorEventTriggered = true;
        };

        router.get('test', '/', ware, handler);
        router.bind('error', errorEventListener);

        router.start()(req, res, next);

        expect(middlewareCalled).to.be(true);
        expect(nextCalled).to.be(true);
        expect(handlerCalled).to.be(false);
        expect(errorEventTriggered).to.be(true);

      });

      afterEach(function () {
        router = null;
      });

    });

  });

});
