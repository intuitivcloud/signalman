/*!
 * signalman
 * Copyright (c) 2015 intuitivcloud Systems <engineering@intuitivcloud.com>
 * BSD-3-Clause Licensed
 */

'use strict';

var express = require('express'),
    signalman = require('../../');

var app = express(),
    router = signalman(),
    server;

function causePrinter(cxt) {
  console.log('Cause of this request: ', cxt.cause);
  cxt.next();
}

router.get('/', causePrinter, function (cxt) {
  cxt.res.status(200).send('Hello World\n');
});

router.get('/hello/{name}', causePrinter, function (cxt) {
  var req = cxt.req,
      params = req.params;

  setTimeout(function () {
    cxt.res.status(200).send('Hello, ' + params.name);
  }, 5000);
});

router.bind('navigating', function (e) {
  console.log('Router is navigating to:', e.path, ', cause was', e.cause);
});

app.use(router.start());

server = app.listen(3000, function () {
  var address = server.address(),
      host = address.address,
      port = address.port;

  console.log('Started server at http://%s:%d', host, port);
});