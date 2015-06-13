(function () {
  'use strict';

  function causePrinter(cxt) {
    console.log('Cause of this request: ', cxt.cause);
    cxt.next();
  }

  function renderHomePage() {
    var c = document.getElementById('content'),
        nameField, sayHelloButton;

    c.innerHTML = '<input type="text" id="name"/><button type="button" id="sayHello">Say Hello!</button>';

    nameField = document.getElementById('name');
    sayHelloButton = document.getElementById('sayHello');

    sayHelloButton.addEventListener('click', function (e) {
      var name = encodeURIComponent(nameField.value);
      app.router.navigateTo('/hello/' + name);
    });
  }

  function renderHelloPage(cxt) {
    var c = document.getElementById('content'),
        name = (cxt.params && cxt.params.name && decodeURIComponent(cxt.params.name)) || 'World',
        backButton;

    c.innerHTML = '<h2>Hello ' + name + '!</h2><button type="button" id="back">Go Back</button>';

    backButton = document.getElementById('back');

    backButton.addEventListener('click', function () {
      window.history.back();
    });
  };

  domready(function () {
    var app = window.app = {},
        router = app.router = signalman();

    router.get('/', causePrinter, renderHomePage);
    router.get('/hello/{name}', causePrinter, renderHelloPage);

    // listen to events on the router
    router.bind('navigating', function (e) {
      console.log('Router is navigating to:', e.fullPath, ', cause was:', e.cause);
    });

    router.start({ autoStart: true });
  });

})();

