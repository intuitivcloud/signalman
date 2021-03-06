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
    html: '<!doctype html><html><head></head><body><div id="content"></div></body></html>',
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

      it('should not add a route to handle a non-GET request', function () {

        router.post('test1', '/hello/{name}', function () {});
        router.del('test2', '/hello/{name}', function () {});
        router.put('test3', '/hello/{name}', function () {});
        router.patch('test4', '/hello/{name}', function () {});
        router.head('test5', '/hello/{name}', function () {});
        router.options('test6', '/hello/{name}', function () {});
        router.trace('test7', '/hello/{name}', function () {});

        expect(router._routes).to.be.empty();
      });

      it('should not add a route if another route with the same name is added', function () {

        router.get('test1', '/hello/{name}', function () {});
        expect(function () {
          router.get('test1', '/hello/{name}', function () {});
        }).to.throwError(/Route with the name 'test1' is already added/);
      });

      it('should not navigate to the initial route by path on start when autoStart is not set', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function () {
              rightHandlerCalled = true;
            };

        router.get('test', '/', function () { wrongHandlerCalled = true; });
        router.get('test2', '/hello/{name}', handler);

        router.start();

        expect(rightHandlerCalled).to.be(false);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should navigate to the initial route on start when autoStart is set', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            navEventTriggered = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('startup');
              rightHandlerCalled = true;
            },
            navEventHandler = function (evt) {
              expect(evt.path).to.be('http://localhost:3000/hello/Goober?confirm=1');
              expect(evt.method).to.be('GET');
              expect(evt.cause).to.be('startup');
              expect(evt.router).to.be(router);
              navEventTriggered = true;
            };

        router.get('test1', '/', function () { wrongHandlerCalled = true; });
        router.get('test2', '/hello/{name}', handler);

        router.bind('navigating', navEventHandler);

        router.start({ autoStart: true });

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
        expect(navEventTriggered).to.be(true);
      });

      it('should navigate to the specified route', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            navEventTriggered = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('navigation');
              rightHandlerCalled = true;
            },
            navEventHandler = function (evt) {
              expect(evt.path).to.be('/');
              expect(evt.method).to.be('GET');
              expect(evt.cause).to.be('navigation');
              expect(evt.router).to.be(router);
              navEventTriggered = true;
            };

        router.get('test1', '/hello/{name}', function () { wrongHandlerCalled = true; });
        router.get('test2', '/', handler);

        router.bind('navigating', navEventHandler);

        router.start();

        router.navigateTo('/');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
        expect(navEventTriggered).to.be(true);
      });

      it('should emit error event if route handler throws error', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            errorEventHandlerCalled = false,
            handler = function (cxt) {
              rightHandlerCalled = true;
              throw { message: 'Error!' };
            },
            errorEventHandler = function (evt) {
              expect(evt.path).to.be('/');
              expect(evt.method).to.be('GET');
              expect(evt.error).to.be.eql({ message: 'Error!' });
              expect(evt.router).to.be(router);
              errorEventHandlerCalled = true;
            };

        router.get('test', '/', handler);

        router.bind('error', errorEventHandler);

        router.start();

        router.navigateTo('/');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
        expect(errorEventHandlerCalled).to.be(true);
      });

      it('should emit notFound event if no route was found matching the navigation path', function () {
        var notFoundEventHandlerCalled = false,
            notFoundEventHandler = function (evt) {
              expect(evt.path).to.be('/');
              expect(evt.method).to.be('GET');
              expect(evt.router).to.be(router);
              notFoundEventHandlerCalled = true;
            };

        router.bind('notFound', notFoundEventHandler);

        router.start();

        router.navigateTo('/');

        expect(notFoundEventHandlerCalled).to.be(true);
      });

      it('should emit error event if route handler calls next with error', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            errorEventHandlerCalled = false,
            handler = function (cxt) {
              rightHandlerCalled = true;
              cxt.next({ message: 'Error!' });
            },
            errorEventHandler = function (evt) {
              expect(evt.path).to.be('/');
              expect(evt.method).to.be('GET');
              expect(evt.error).to.be.eql({ message: 'Error!' });
              expect(evt.router).to.be(router);
              errorEventHandlerCalled = true;
            };

        router.get('test', '/', handler);

        router.bind('error', errorEventHandler);

        router.start();

        router.navigateTo('/');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
        expect(errorEventHandlerCalled).to.be(true);
      });

      it('should navigate to the specified route by path calling all middleware and handlers', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            middlewareCalled = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('navigation');
              rightHandlerCalled = true;
            },
            middleware = function (cxt) {
              middlewareCalled = true;
              cxt.next();
            };

        router.get('test', '/hello/{name}', function () { wrongHandlerCalled = true; });
        router.get('test1', '/', middleware, handler);

        router.start();

        router.navigateTo('/');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
        expect(middlewareCalled).to.be(true);
      });

      it('should navigate to the specified route by name calling all middleware and handlers', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            middlewareCalled = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('navigation');
              rightHandlerCalled = true;
            },
            middleware = function (cxt) {
              middlewareCalled = true;
              cxt.next();
            };

        router.get('test', '/hello/{name}', function () { wrongHandlerCalled = true; });
        router.get('test1', '/', middleware, handler);

        router.start();

        router.navigateTo('test1');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
        expect(middlewareCalled).to.be(true);
      });

      it('should stop navigate to the route handler if middleware invokes next with error', function () {
        var rightHandlerCalled = false,
            middlewareCalled = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('navigation');
              rightHandlerCalled = true;
            },
            middleware = function (cxt) {
              middlewareCalled = true;
              cxt.next({ message: 'Error!' });
            };

        router.get('test', '/', middleware, handler);

        router.start();

        router.navigateTo('/');

        expect(middlewareCalled).to.be(true);
        expect(rightHandlerCalled).to.be(false);
      });

      it('should emit error event if middleware invokes next with error', function () {
        var rightHandlerCalled = false,
            middlewareCalled = false,
            errorEventHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.cause).to.be('navigation');
              rightHandlerCalled = true;
            },
            middleware = function (cxt) {
              middlewareCalled = true;
              cxt.next({ message: 'Error!' });
            },
            errorEventHandler = function (evt) {
              expect(evt.path).to.be('/');
              expect(evt.method).to.be('GET');
              expect(evt.error).to.be.eql({ message: 'Error!' });
              expect(evt.router).to.be(router);
              errorEventHandlerCalled = true;
            };

        router.get('test', '/', middleware, handler);

        router.bind('error', errorEventHandler);

        router.start();

        router.navigateTo('/');

        expect(middlewareCalled).to.be(true);
        expect(rightHandlerCalled).to.be(false);
        expect(errorEventHandlerCalled).to.be(true);
      });

      it('should navigate to the specified route by path and parse URL parameters', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.params).to.be.eql({bookId: 'abc123', authorId: '235xyz'});
              rightHandlerCalled = true;
            };

        router.get('test', '/', function () { wrongHandlerCalled = true; });
        router.get('test1', '/books/{bookId}/authors/{authorId}', handler);

        router.start();

        router.navigateTo('/books/abc123/authors/235xyz');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should navigate to the specified route by name with specified parameters', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.params).to.be.eql({bookId: 'abc123', authorId: '235xyz'});
              rightHandlerCalled = true;
            };

        router.get('test', '/', function () { wrongHandlerCalled = true; });
        router.get('test1', '/books/{bookId}/authors/{authorId}', handler);

        router.start();

        router.navigateTo('test1', null, { bookId: 'abc123', authorId: '235xyz' });

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should navigate to the specified route by name with specified query parameters', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            handler = function (cxt) {
              expect(cxt.query).to.be.eql({st: 'foo', g: 1});
              expect(cxt.params).to.be.eql({bookId: 'abc123', authorId: '235xyz'});
              rightHandlerCalled = true;
            };

        router.get('test', '/', function () { wrongHandlerCalled = true; });
        router.get('test1', '/books/{bookId}/authors/{authorId}', handler);

        router.start();

        router.navigateTo('test1', { st: 'foo', g: 1 }, { bookId: 'abc123', authorId: '235xyz' });

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
      });

      it('should navigate to the specified route and parse URL and query parameters', function () {
        var rightHandlerCalled = false,
            wrongHandlerCalled = false,
            navEventTriggered = false,
            handler = function (cxt) {
              expect(cxt.params).to.be.eql({bookId: 'abc123', authorId: '235xyz'});
              expect(cxt.query).to.be.eql({confirm: '1', view: 'detail'});
              rightHandlerCalled = true;
            },
            navEventHandler = function (evt) {
              expect(evt.path).to.be('/books/abc123/authors/235xyz?confirm=1&view=detail');
              expect(evt.method).to.be('GET');
              expect(evt.cause).to.be('navigation');
              expect(evt.router).to.be(router);
              navEventTriggered = true;
            };

        router.get('test', '/', function () { wrongHandlerCalled = true; });
        router.get('test1', '/books/{bookId}/authors/{authorId}', handler);

        router.bind('navigating', navEventHandler);

        router.start();

        router.navigateTo('/books/abc123/authors/235xyz?confirm=1&view=detail');

        expect(rightHandlerCalled).to.be(true);
        expect(wrongHandlerCalled).to.be(false);
        expect(navEventTriggered).to.be(true);
      });

      it.skip('should intercept clicks on links and navigate through router', function () {
        doInBrowser(function (window) {
          var signalman = window.signalman,
              document = window.document,
              router = signalman(),
              homePageHandlerCalled = false,
              helloPageHandlerCalled = false,
              homePageHandler = function (cxt) {
                var c = document.getElementById('content');

                c.innerHTML = '<a id="helloLink" href="/greet/John%20Doe?confirm=1">Click Me</a>';
                document.title = 'Welcome';

                homePageHandlerCalled = true;
              },
              helloPageHandler = function (cxt) {
                expect(cxt.params.name).to.be('John Doe');
                expect(cxt.query.confirm).to.be('1');

                document.title = 'Hello';

                helloPageHandlerCalled = true;
              },
              link, evt;

          console.log(router._routes);

          router.get('test', '/', homePageHandler);
          router.get('test1', '/greet/{name}', helloPageHandler);

          router.start();

          router.navigateTo('/');

          expect(homePageHandlerCalled).to.be(true);

          evt = document.createEvent('MouseEvents');
          evt.initEvent('click', true, true, window, 0,
                        evt.screenX, evt.screenY,
                        evt.clientX, evt.clientY,
                        false, false, false, false, 0, null);

          evt.button = 1;
          evt.which = null;

          link = document.getElementById('helloLink');
          link.dispatchEvent(evt);

          expect(helloPageHandlerCalled).to.be(true);
        });
      });

      afterEach(function () {
        router = null;
      });

    });

  });

});
