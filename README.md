# signalman
An tiny isomorphic router

[![npm Version](https://img.shields.io/npm/v/signalman.svg)](https://www.npmjs.com/package/signalman)
[![Build Status](https://travis-ci.org/intuitivcloud/signalman.svg)](https://travis-ci.org/intuitivcloud/signalman)
[![Dependency Status](https://david-dm.org/intuitivcloud/signalman.svg)](https://david-dm.org/intuitivcloud/signalman)
[![License](https://img.shields.io/badge/license-New%20BSD-blue.svg)](https://github.com/intuitivcloud/signalman)

## Installation

### Node

```bash
$ npm install --save signalman
```

### Browser

Copy the file `signalman.min.js` in the `dist` folder and refer to it in your HTML:

```html
<script src="/js/signalman.min.js"></script>
```

`signalman` will now be available via `window.signalman`.

## Usage

### Server-Side Setup

Example with a simple `express` server

```js
var express = require('express'),
    signalman = require('signalman');

var app = express(),
    router = signalman(),				// create a new router
    server;

// define a route handler
router.get('/', function (cxt) {
  // cxt provides the request and response objects transparently
  cxt.response.status(200).send('Hello World\n');
});

router.get('/bye/{name}', function (cxt) {
  // access the name parameter
  cxt.response.status(200).send('Bye ' + cxt.request.params.name + '!\n');
});

// route requests from signalman
app.use(router.start());

server = app.listen(process.env.PORT, process.env.HOST, function () {
  var address = server.address(),
      host = address.address,
      port = address.port;

  console.log('Server started at: http://%s:%d/', host, port); 
});
```

## Client-Side

Simple example using `domready`:

```js
function renderHomePage(cxt) {
  var c = document.getElementById('content'),
          nameField, sayHelloButton;

  c.innerHTML = '<a href="/hello/Signalman">Say Hello Signalman!</a><br/><input type="text" id="name"/><button type="button" id="sayHello">Say Hello!</button>';

  nameField = document.getElementById('name');
  sayHelloButton = document.getElementById('sayHello');

  sayHelloButton.addEventListener('click', function (e) {
    var name = encodeURIComponent(nameField.value);
    app.router.navigateTo('/hello/' + name);
  });
}

function renderHelloPage(cxt) {
  var c = document.getElementById('content'),
          name = (cxt.params.name && decodeURIComponent(cxt.params.name)) || 'World',
          backButton;

  c.innerHTML = '<h2>Hello ' + name + '!</h2><button type="button" id="back">Go Back</button>';

  backButton = document.getElementById('back');

  backButton.addEventListener('click', function () {
    window.history.back();
  });
}

domready(function () {
  var app = window.app = {},
      router = app.router = signalman();
      
  router.get('/', renderHomePage);
  router.get('/hello/{name}', renderHelloPage);
  
  // listen to events on the router
  router.bind('navigating', function (e) {
    console.log('Router is navigating to:', e.fullPath, ', cause was:', e.cause);
  });
  
  // start the router, auto navigate to the current URL
  router.start({ autoStart: true });
});
```

## API Reference

### `signalman()`

Returns an instance of a router.

On the server this method may be called multiple times to get an new instance of a router each time. 

In the browser, calling this method multiple-times will return the same router instance returned by the first call.

### `router.<HTTP Method>(path, handlers...)`

Registers the specified handler(s) to be invoked in their specified sequence when a request whose path matches the path specified to this method is detected.

**NOTE**: Only those routes registered with the `get` method will also be available in the browser. Routes registered with other methods, will be ignored in the browser.

##### Supported HTTP Methods:

| HTTP Method | Router Method Name | Supported in Browser? |
| ----------- | ------------------ | --------------------- |
| `GET`	    | `get`              | yes |
| `POST`      | `post`             | no  |
| `PUT`       | `put`              | no  |
| `DELETE`    | `del`              | no  |
| `PATCH`     | `patch`            | no  |
| `HEAD`      | `head`             | no  |
| `OPTIONS`   | `options`          | no  |
| `TRACE`     | `trace`            | no  |

##### Parameters:

* **path**: the pattern that defines the route's path
* **handlers...**: one or more handler/middleware functions. The handlers will be passed a navigation context object as a single parameter containing details about the navigation. Handlers defined as middleware can call the `next()` method on the context object to indicate that the router can call the next handler in the chain. See Navigation Context Object section below.

##### Example:

```js
router.get('/hello/{name}', function (cxt) {
	// code to respond with a greeting
});

// ignored in the browser
router.post('/users', function (cxt) {
	// code to create a new user
});
```

### `router.start([options])`

Starts routing requests or navigation actions.

On the server, this method returns a middleware function with the signature `function (req, res, next)` which can be attached with a server instance like `express` which supports middleware based routers.

In the browser, this method attaches itself to the `window.history` object listening to `popstate` events and using `pushState` and `replaceState` to define new history entries. 

* If `autoStart` option is specified as `true` in the options, the router automatically invokes the handler chain for the route matching the current `document.location.href`.

* If `handleLinks` options is specified as `true` in the options, the router automatically intercepts `click` events on `a` tags and routes the navigation via its routes. This is `true` by default.

##### Parameters:

* **options**: an optional object containing options for the router that adjust the in-browser routing behavior.

##### Example:

```js

// on server, return middleware function to attach to underlying server
// in browser, start routing, intercept links but do not auto-navigate to current URL's route
router.start();

// in the browser, start routing and auto-navigate to current URL's route and intercept links
router.start({ autoStart: true });

// in the browser, start routing and auto-navigate to current URL's route but do not intercept links
router.start({ autoStart: true, handleLinks: false });
```

### `router.stop()`

Stops routing navigation actions in the browser. This method only works in the browser.

When called, it detaches itself from the `popstate` events of `window` and stops intercepting `click` events on `a` tags in the document.

### `router.navigate(path)`

Navigates to a particular route in the browser. This method is available only in the browser.

If no route was found matching the path, the router triggers a `notFound` event which can be bound for defining the responding behavior.

##### Parameters:

* **path**: the path to navigate to

##### Example:

```js
router.navigateTo('/hello/John%20Doe?confirm=1');
```

### `router.bind(eventName, eventHandler)`

Binds the specified `eventHandler` function to be called when an event with the specified `eventName` occurs on the router.

##### Parameters:

* **eventName**: The name of the event to bind the handler to. See below for list of routing events.
* **eventHandler**: The event handler function to be invoked when the event occurs. Any event details are passed as arguments to the function.

##### Example:

```js
router.bind('notFound', function (e) {
	alert('We cannot find what you\'re looking for');
});
```

### `router.unbind(eventName, eventHandler)`

Un-binds the specified `eventHandler` function from being called when an event with the specified `eventName` occurs on the router.

##### Parameters:

* **eventName**: The name of the event to unbind the handler from. See below for list of routing events.
* **eventHandler**: The event handler function that was previously bound using the `#bind()` method.

### Navigation Context Object

Represents the details of a navigation performed by the router.

A Context object is passed to all handlers in a route using which the handlers can retrieve details about the navigation from this object.

#### Attributes on Context Object

| Name   | Type     | Description           | Available on Server | Available in Browser |
| ------------ | ------------------ | --------------------- | ---------- | ------------ |
| `cause` | string   | Cause of the navigation | yes | yes |
| `fullPath` | string   | The full URL of the navigation | yes | yes |
| `path` | string   | The path part of the URL of the navigation | yes | yes |
| `canUseDOM` | boolean   | `true` if browser DOM is accessible; `false` if not. | yes | yes |
| `router` | object   | The instance of the router which initiated the navigation | yes | yes |
| `request` | object   | The underlying request object provided by the server | yes | no |
| `request.params` | object | The URL parameters parsed by the router. Empty if none. | yes | no |
| `request.query` | object | The query-string parameters parsed by the router. Empty if none. | yes | no |
| `response` | object   | The underlying response object provided by the server | yes | no |
| `params` | object | The URL parameters parsed by the router. Empty if none. | no | yes |
| `query` | object | The query-string parameters parsed by the router. Empty if none. | no | yes |

### Routing Events

| Event Name   | Details passed     | Description           |
| ------------ | ------------------ | --------------------- |
| `navigating` | `path`, `router`   | triggered when router is navigating to a new route |
| `notFound`   | `path`, `router`   | triggered when the router did not find a route matching the path |
| `error`      | `path`, `error`, `router` | triggered when a route handler/middleware threw an error while executing |

## License

Copyright (c) 2015, intuitivcloud Systems &lt;engineering@intuitivcloud.com&gt;       
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of signalman nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
