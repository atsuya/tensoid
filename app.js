
/**
 * Module dependencies.
 */

var express = require('express');
var socketio = require('socket.io');
var config = require('./config');

var app = module.exports = express.createServer();

// Configuration

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: config.server.secret }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
  app.use(express.errorHandler()); 
});

app.dynamicHelpers({
  message: function(req, res) {
    var message = req.flash('error')[0] || '';
    return message;
  },
  resources: function(req, res) {
    var resources = req.session.resources || [];
    delete req.session.resources;
    return resources;
  },
  variables: function(req, res) {
    var variables = req.session.variables || [];
    delete req.session.variables;
    return variables;
  }
});

// Routes

app.get('/', function(req, res) {
  res.session.resources = [
    { type: 'css', uri: '/stylesheets/sender.css' },
    { type: 'javascript', uri: '/javascripts/sender.js' }
  ];
  res.render('sender');
});

app.get('/:id', function(req, res) {
  res.session.resources = [
    { type: 'css', uri: '/stylesheets/receiver.css' },
    { type: 'javascript', uri: '/javascripts/receiver.js' }
  ];
  res.render('receiver');
});

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(config.server.port, config.server.host);
  console.log('tensoid is rocking on ' + config.server.host + ':' + config.server.port + '!');
}

var listener = socketio.listen(app, { transports: ['websocket'] }); 
listener.on('connection', function(client) {
  client.on('message', function(data) {
  });
  client.on('disconnect', function() {
  });
});

process.on('SIGINT', function () {
    console.log('shutting down!');
    shutdown();
});

function shutdown() {
  process.exit(0);
}
