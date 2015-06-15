/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

/* global describe, it, beforeEach, afterEach */
'use strict';

var path = require('path'),
    fs = require('fs'),
    expect = require('expect.js'),
    jsdom = require('jsdom');

var context = describe;

function doInBrowser(workTodo) {
  var signalman = fs.readFileSync(path.join(__dirname, '../dist/signalman.js'));

  jsdom.env({
    html: '<!doctype html><html><head></head><body></body></html>',
    url: 'http://localhost:3000/hello/Goober?confirm=1',
    src: [signalman],
    done: function (err, window) {
      if (err) return expect().fail(err);
      workTodo(window);
    }
  });
}

describe('signalman', function () {

  context('in browser', function () {
    var signalman;

    beforeEach(function (done) {
      doInBrowser(function (window) {
        signalman = window.signalman;
        done();
      });
    });

    it('should be defined and be a function', function () {
      expect(signalman).to.be.ok();
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

      it('should not add a route to handle a non-GET request', function () {

        router.post('/hello/{name}', function () {});
        router.del('/hello/{name}', function () {});
        router.put('/hello/{name}', function () {});
        router.patch('/hello/{name}', function () {});
        router.head('/hello/{name}', function () {});
        router.options('/hello/{name}', function () {});
        router.trace('/hello/{name}', function () {});

        expect(router._routes).to.be.empty();
      });

      it('should navigate to the initial route on start when autoStart is not set', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('startup');
              rightHandlerCalled = true;
            };

        router.get('/', function () { wrongHandlerCalled = true; });
        router.get('/hello/{name}', handler);

        router.start();

        expect(rightHandlerCalled).to.be(false);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should not navigate to the initial route on start when autoStart is set', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              rightHandlerCalled = true;
            };

        router.get('/', function () { wrongHandlerCalled = true; });
        router.get('/hello/{name}', handler);

        router.start({ autoStart: true });

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should navigate to the specified route', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('navigation');
              rightHandlerCalled = true;
            };

        router.get('/hello/{name}', function () { wrongHandlerCalled = true; });
        router.get('/', handler);

        router.start();

        router.navigateTo('/');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should navigate to the specified route and parse URL parameters', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.params).to.be.eql({bookId: 'abc123', authorId: '235xyz'});
              rightHandlerCalled = true;
            };

        router.get('/', function () { wrongHandlerCalled = true; });
        router.get('/books/{bookId}/authors/{authorId}', handler);

        router.start();

        router.navigateTo('/books/abc123/authors/235xyz');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should navigate to the specified route and parse URL and query parameters', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.params).to.be.eql({bookId: 'abc123', authorId: '235xyz'});
              expect(cxt.query).to.be.eql({confirm: '1', view: 'detail'});
              rightHandlerCalled = true;
            };

        router.get('/', function () { wrongHandlerCalled = true; });
        router.get('/books/{bookId}/authors/{authorId}', handler);

        router.start();

        router.navigateTo('/books/abc123/authors/235xyz?confirm=1&view=detail');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
      });

      afterEach(function () {
        router = null;
      });

    });

  });

});
