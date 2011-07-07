
/**
 * Module dependencies.
 */

var sys = require('sys');
var fs = require('fs');
var express = require('express');
var socketio = require('socket.io');
var Log = require('log');
var config = require('./config');

var log = new Log(Log.DEBUG, fs.createWriteStream('./logs/transferrings.log'));
var app = module.exports = express.createServer();

// Configuration

app.configure(function() {
  app.redirect('send', '/send');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.use(express.logger());
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
  res.redirect('send');
});

app.get('/send', function(req, res) {
  req.session.resources = [
    { type: 'javascript', uri: '/socket.io/socket.io.js' },
    { type: 'css', uri: '/stylesheets/sender.css' },
    { type: 'javascript', uri: '/javascripts/sender.js' }
  ];
  req.session.variables = [
    { name: 'webSocketHost', value: "'" + config.client.webSocket.host + "'" },
    { name: 'webSocketPort', value: config.client.webSocket.port }
  ];
  res.render('sender');
});

app.get('/receive/:id', function(req, res) {
  req.session.resources = [
    { type: 'javascript', uri: '/socket.io/socket.io.js' },
    { type: 'css', uri: '/stylesheets/receiver.css' },
    { type: 'javascript', uri: '/javascripts/receiver.js' }
  ];
  req.session.variables = [
    { name: 'requestUrl', value: "'http://" + config.server.host + ':' + config.server.port + req.url + "'" },
    { name: 'webSocketHost', value: "'" + config.client.webSocket.host + "'" },
    { name: 'webSocketPort', value: config.client.webSocket.port }
  ];
  res.render('receiver');
});

app.error(function(err, req, res) {
  res.send('oops, something went wrong.');
});

process.on('SIGINT', function () {
    console.log('shutting down!');
    shutdown();
});

process.on('uncaughtException', function(err) {
  log.error(err);
});

function shutdown() {
  process.exit(0);
}

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(config.server.port, config.server.host);
  console.log('tensoid is rocking on ' + config.server.host + ':' + config.server.port + '!');
}

var connections = {};
var io = socketio.listen(app, { transports: ['websocket'] });
io.set('log level', 1);
io.sockets.on('connection', function(socket) {
  socket.on('urlRequest', function(message) {
    var url = generateUrl();
    socket.emit('urlRequest', { url: url });
    addSender(url, socket);

    log.debug(
      '[%s]: action=urlRequest, from=%s',
      url,
      socket.handshake.address.address
    );
  });
  socket.on('receiverConnected', function(message) {
    addReceiver(message.url, socket);
    requestTransferring(message.url);

    log.debug(
      '[%s]: action=receiverConnected, from=%s',
      message.url,
      socket.handshake.address.address
    );
  });
  socket.on('transferStarted', function(message) {
    startTransferring(message.url, message);

    log.debug(
      '[%s]: action=transferStarted, from=%s',
      message.url,
      socket.handshake.address.address
    );
  });
  socket.on('transferringData', function(message) {
    transferData(message.url, message);
  });
  socket.on('transferEnded', function(message) {
    endTransferring(message.url, message);
    delete connections[message.url];

    log.debug(
      '[%s]: action=transferEnded, from=%s',
      message.url,
      socket.handshake.address.address
    );
  });
  socket.on('transferringDataOk', function(message) {
    var session = connections[message.url].sender;
    var sender = io.sockets.socket(session);
    sender.emit('transferringData');
  });
  socket.on('disconnect', function() {
  });
});

function generateUrl() {
  id = Math.floor(Math.random() * 10000000000);
  return 'http://' + config.server.host + ':' + config.server.port + '/receive/' + id;
}

function addSender(url, socket) {
  if (!(url in connections)) {
    connections[url] = {
      sender: socket.id,
      receivers: []
    };
  }
}

function addReceiver(url, socket) {
  if (url in connections) {
    connections[url].receivers.push(socket.id);
  }
}

function requestTransferring(url) {
  if (url in connections) {
    var socketId = connections[url].sender;
    var sender = io.sockets.socket(socketId);
    sender.emit('transferRequest');
  }
}

function startTransferring(url, content) {
  if (url in connections) {
    var socketId = connections[url].receivers[0];
    var receiver = io.sockets.socket(socketId);
    receiver.emit('transferStarted', {
        contentType: content.contentType,
        contentSize: content.contentSize
    });
  }
}

function transferData(url, content) {
  if (url in connections) {
    var socketId = connections[url].receivers[0];
    var receiver = io.sockets.socket(socketId);
    receiver.emit('transferringData', { data: content.data });
  }
}

function endTransferring(url, content) {
  if (url in connections) {
    var socketId = connections[url].receivers[0];
    var receiver = io.sockets.socket(socketId);
    receiver.emit('transferEnded');
  }
}
